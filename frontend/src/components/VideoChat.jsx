import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNALING_SERVER = "http://localhost:3000";
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

export default function VideoChat({ roomId }) {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [otherPeerId, setOtherPeerId] = useState(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const log = (...args) => {
    console.log(...args);
    setStatus(args.join(" "));
  };

  // Initialize socket connection
  useEffect(() => {
    const s = io(SIGNALING_SERVER, {
      transports: ["websocket"],
      timeout: 5000
    });
    setSocket(s);

    s.on("connect", () => {
      log("Socket connected:", s.id);
      // Auto-join room if we have roomId
      if (roomId && !joinedRoom) {
        joinRoom();
      }
    });

    s.on("joined", ({ otherId }) => {
      log("Joined room. otherId:", otherId);
      setOtherPeerId(otherId);
      setIsJoined(true);
    });

    s.on("room-full", () => {
      log("Room is full (2 participants max).");
      alert("Room is full (2 participants max).");
    });

    s.on("peer-joined", ({ id }) => {
      log("Peer joined:", id);
      setOtherPeerId(id);
      // If we already have a stream, create offer immediately
      if (localStreamRef.current && pcRef.current) {
        log("Creating offer for newly joined peer:", id);
        createOffer();
      } else if (localStreamRef.current) {
        // If we have stream but no peer connection, create one and then offer
        log("Creating peer connection and offer for newly joined peer:", id);
        ensurePeerConnection().then(() => {
          createOffer();
        });
      }
      
      // If we're already in a call and someone joins, we should send our video
      if (isStarted && localStreamRef.current) {
        log("Peer joined while we're in call - sending our video");
        setTimeout(() => {
          if (pcRef.current) {
            createOffer();
          }
        }, 500);
      }
      
      // If we have a stream but we're not in a call yet, we should still send our video
      // This ensures the second person sends their video to the first person
      if (localStreamRef.current && !isStarted) {
        log("Peer joined while we have stream but not in call - sending our video");
        setTimeout(() => {
          if (pcRef.current) {
            createOffer();
          }
        }, 1000);
      }
    });

    s.on("peer-left", ({ id }) => {
      log("Peer left:", id);
      setOtherPeerId(null);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
        remoteStreamRef.current = null;
      }
      // Reset call state when peer leaves
      setIsStarted(false);
    });

    s.on("signal", async ({ from, type, data }) => {
      log("Signal received:", type, "from", from);
      try {
        if (type === "offer") {
          await ensurePeerConnection();
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          s.emit("signal", { to: from, type: "answer", data: pcRef.current.localDescription });
          log("Sent answer to", from);
        } else if (type === "answer") {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
            log("Set remote description from answer");
            
            // If we have a stream and we're not the one who sent the offer, send our video back
            if (localStreamRef.current && from && from !== socket.id) {
              setTimeout(() => {
                if (pcRef.current && otherPeerId) {
                  log("Received answer - sending our video back to ensure bidirectional connection");
                  createOffer();
                }
              }, 1000);
            }
          }
        } else if (type === "candidate") {
          if (pcRef.current && pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data));
              log("Added ICE candidate");
            } catch (err) {
              console.warn("Error adding ICE candidate:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error handling signal:", error);
        log("Error handling signal:", error.message);
      }
    });

    s.on("call-started", ({ from }) => {
      log("Peer started call:", from);
      // If we have a stream but no peer connection, create one and offer
      if (localStreamRef.current && !pcRef.current) {
        log("Creating peer connection in response to peer's call start");
        ensurePeerConnection().then(() => {
          if (otherPeerId) {
            createOffer();
          }
        });
      } else if (localStreamRef.current && pcRef.current && otherPeerId) {
        // If we already have everything, create offer
        log("Creating offer in response to peer's call start");
        createOffer();
      }
      
      // If we're the second person joining, we should also create an offer to send our video
      if (localStreamRef.current && otherPeerId && isStarted) {
        log("Second person joining - creating offer to send our video");
        setTimeout(() => {
          createOffer();
        }, 500); // Small delay to ensure everything is ready
      }
      
      // If we have a stream but we're not in a call yet, we should send our video back
      // This ensures bidirectional video when the first person starts a call
      if (localStreamRef.current && otherPeerId && !isStarted) {
        log("First person started call - sending our video back");
        setTimeout(() => {
          if (pcRef.current) {
            createOffer();
          }
        }, 1500); // Longer delay to ensure the first person's offer is processed
      }
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // Auto-join room when roomId changes
  useEffect(() => {
    if (roomId && socket && !joinedRoom) {
      joinRoom();
    }
  }, [roomId, socket]);

  const ensurePeerConnection = async () => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    }

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    pc.ontrack = (evt) => {
      log("ontrack event, adding tracks:", evt.streams);
      if (evt.streams && evt.streams[0]) {
        evt.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && otherPeerId) {
        socket.emit("signal", { to: otherPeerId, type: "candidate", data: event.candidate });
        log("Sent ICE candidate to", otherPeerId);
      }
    };

    pc.onconnectionstatechange = () => {
      log("PC connectionState:", pc.connectionState);
      if (pc.connectionState === "connected") {
        log("WebRTC connection established!");
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        log("WebRTC connection failed or disconnected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      log("ICE connection state:", pc.iceConnectionState);
    };

    return pc;
  };

  const joinRoom = () => {
    if (!roomId || !socket) return;
    socket.emit("join-video", { roomId });
    setJoinedRoom(roomId);
    log("Joining video room:", roomId);
  };

  const rejoinRoom = () => {
    if (!roomId || !socket) return;
    socket.emit("rejoin-video", { roomId });
    log("Rejoining video room:", roomId);
  };

  const createOffer = async () => {
    if (!pcRef.current || !otherPeerId) return;
    
    try {
      log("Creating offer for peer:", otherPeerId);
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("signal", { to: otherPeerId, type: "offer", data: pcRef.current.localDescription });
      log("Offer sent to", otherPeerId);
    } catch (error) {
      console.error("Error creating offer:", error);
      log("Error creating offer:", error.message);
    }
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        }, 
        audio: true 
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      log("Got local media");

      await ensurePeerConnection();

      if (otherPeerId) {
        log("Other peer exists -> creating offer to", otherPeerId);
        await createOffer();
      } else {
        log("No other peer yet — waiting for peer");
        // Try to rejoin room to refresh peer list
        rejoinRoom();
        // Also check if we need to create an offer after a short delay
        setTimeout(() => {
          if (otherPeerId && !isStarted) {
            log("Creating delayed offer for peer:", otherPeerId);
            createOffer();
          }
        }, 1000);
      }

      setIsStarted(true);
      
      // Notify other peer that we started our call
      if (otherPeerId) {
        socket.emit("call-started", { to: otherPeerId });
        log("Notified peer that call started");
        
        // If we're the second person joining, create an additional offer after a delay
        setTimeout(() => {
          if (localStreamRef.current && pcRef.current) {
            log("Second person - creating additional offer to ensure video is sent");
            createOffer();
          }
        }, 1000);
      }
      
      // If we're the first person and we have a peer, we should also create an additional offer
      // to ensure the second person sends their video back
      if (otherPeerId) {
        setTimeout(() => {
          if (localStreamRef.current && pcRef.current) {
            log("First person - creating additional offer to ensure bidirectional video");
            createOffer();
          }
        }, 2000); // Longer delay to ensure the second person has processed our initial offer
      }
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert("Could not get camera/mic: " + err.message);
    }
  };

  const hangUp = () => {
    log("Ending call...");
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((s) => {
        if (s.track) s.track.stop();
      });
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

          // Reset call state but keep room joined for reconnection
      setIsStarted(false);
      // Don't reset otherPeerId here - keep it for reconnection
    
    log("Call ended. Ready to reconnect.");
  };

  return (
    <div style={{ 
      fontFamily: "Arial, Helvetica, sans-serif", 
      padding: "16px",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <h2 style={{ 
        margin: "0 0 20px 0", 
        color: "#374151",
        fontSize: "20px",
        fontWeight: "600",
        textAlign: "center"
      }}>
        Video Chat
      </h2>

      {/* Button Container */}
      <div style={{ 
        marginBottom: "20px",
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={startCall} 
          disabled={!isJoined || isStarted}
          style={{
            padding: "12px 24px",
            backgroundColor: isStarted ? "#6b7280" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isStarted ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(16, 185, 129, 0.2)",
            minWidth: "120px"
          }}
          onMouseEnter={(e) => {
            if (!isStarted) {
              e.target.style.backgroundColor = "#059669";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(16, 185, 129, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isStarted) {
              e.target.style.backgroundColor = "#10b981";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(16, 185, 129, 0.2)";
            }
          }}
        >
          {isStarted ? "Call Active" : "Start Video Call"}
        </button>
        
        <button 
          onClick={hangUp} 
          disabled={!isStarted}
          style={{
            padding: "12px 24px",
            backgroundColor: !isStarted ? "#6b7280" : "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: !isStarted ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
            minWidth: "120px"
          }}
          onMouseEnter={(e) => {
            if (isStarted) {
              e.target.style.backgroundColor = "#b91c1c";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(220, 38, 38, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (isStarted) {
              e.target.style.backgroundColor = "#dc2626";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(220, 38, 38, 0.2)";
            }
          }}
        >
          End Call
        </button>
      </div>

                    {/* Status */}
       <div style={{ 
         fontSize: "12px", 
         color: "#6b7280", 
         marginBottom: "20px",
         textAlign: "center",
         padding: "8px",
         backgroundColor: "#f3f4f6",
         borderRadius: "6px",
         minHeight: "20px"
       }}>
         {status || "Ready to connect..."}
       </div>

      {/* Video Container */}
      <div style={{ 
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ textAlign: "center" }}>
          <h4 style={{ 
            margin: "0 0 8px 0", 
            color: "#374151",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            You
          </h4>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ 
              width: "100%", 
              maxWidth: "280px", 
              border: "2px solid #e5e7eb", 
              borderRadius: "8px",
              backgroundColor: "#f9fafb"
            }} 
          />
        </div>
        
        <div style={{ textAlign: "center" }}>
          <h4 style={{ 
            margin: "0 0 8px 0", 
            color: "#374151",
            fontSize: "14px",
            fontWeight: "500"
          }}>
            Remote
          </h4>
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            style={{ 
              width: "100%", 
              maxWidth: "280px", 
              border: "2px solid #e5e7eb", 
              borderRadius: "8px",
              backgroundColor: "#f9fafb"
            }} 
          />
        </div>
      </div>
    </div>
  );
}



