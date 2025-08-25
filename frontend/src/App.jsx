import React, { useState } from "react";
import CollaborativeEditor from "./components/Editor";
import VideoChat from "./components/VideoChat";
import TextEditor from "./components/TextEditor";

function App() {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [inputRoomId, setInputRoomId] = useState(""); // input field state
  const [copied, setCopied] = useState(false); // for clipboard feedback

  const handleStartMeeting = () => {
    // generate random room id
    const newRoomId = (() => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    })();
    setRoomId(newRoomId);
    setJoined(true);
  };

  const handleJoinMeeting = () => {
    if (!inputRoomId.trim()) {
      alert("Please enter a room ID");
      return;
    }
    setRoomId(inputRoomId.trim());
    setJoined(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      {!joined ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ 
              marginBottom: "10px", 
              fontSize: "48px", 
              fontWeight: "700",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              CodePair
            </h1>
            <p style={{ 
              marginBottom: "30px", 
              color: "#6b7280",
              fontSize: "18px",
              fontWeight: "400"
            }}>
              Collaborative Coding & Video Interviews
            </p>
            <p style={{ marginBottom: 20, color: "#666" }}>
              Enter a room ID to join collaborative coding and video chat
            </p>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              style={{ 
                padding: "12px 16px", 
                width: "250px", 
                marginBottom: "20px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "#667eea"}
              onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button 
                onClick={handleStartMeeting} 
                style={{ 
                  padding: "12px 24px",
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#5a67d8";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#667eea";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Start New Meeting
              </button>
              <button 
                onClick={handleJoinMeeting} 
                style={{ 
                  padding: "12px 24px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#059669";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#10b981";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ 
            padding: "15px 20px", 
            borderBottom: "2px solid #e5e7eb", 
            backgroundColor: "#1f2937",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <h1 style={{ 
                  margin: 0, 
                  color: "#ffffff",
                  fontSize: "28px",
                  fontWeight: "700",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  CodePair
                </h1>
                <div style={{ 
                  width: "1px", 
                  height: "30px", 
                  backgroundColor: "#4b5563" 
                }}></div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ 
                    margin: 0, 
                    color: "#ffffff",
                    fontSize: "20px",
                    fontWeight: "600"
                  }}>
                    Room: 
                  </h2>
                  <span style={{ 
                    color: "#10b981", 
                    fontSize: "20px",
                    fontWeight: "700",
                    fontFamily: "monospace",
                    backgroundColor: "#374151",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    border: "1px solid #4b5563"
                  }}>
                    {roomId}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      padding: "8px",
                      backgroundColor: copied ? "#10b981" : "#374151",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "16px",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "36px",
                      height: "36px"
                    }}
                    onMouseEnter={(e) => {
                      if (!copied) {
                        e.target.style.backgroundColor = "#4b5563";
                        e.target.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!copied) {
                        e.target.style.backgroundColor = "#374151";
                        e.target.style.transform = "translateY(0)";
                      }
                    }}
                    title={copied ? "Copied!" : "Copy Room ID"}
                  >
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                  {copied && (
                    <span style={{
                      color: "#10b981",
                      fontSize: "14px",
                      fontWeight: "500",
                      animation: "fadeIn 0.3s ease-in"
                    }}>
                      Copied!
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setJoined(false)} 
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: "#dc2626", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#b91c1c";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 8px rgba(220, 38, 38, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#dc2626";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 2px 4px rgba(220, 38, 38, 0.2)";
                }}
              >
                Leave Room
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "300px 1fr 400px",
              gap: "20px",
              padding: "20px",
              overflow: "hidden",
            }}
          >
            {/* Left sidebar with text editor */}
            <div style={{ 
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              overflow: "hidden"
            }}>
              <div style={{ 
                padding: "15px", 
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#ffffff"
              }}>
                <h3 style={{ 
                  margin: "0 0 10px 0", 
                  color: "#374151",
                  fontSize: "18px",
                  fontWeight: "600"
                }}>
                  Question & Notes
                </h3>
                <p style={{ 
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "12px"
                }}>
                  Share questions, test cases, and notes
                </p>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TextEditor roomId={roomId} />
              </div>
            </div>

            {/* Center editor */}
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", minHeight: 0 }}>
              <CollaborativeEditor roomId={roomId} />
            </div>

            {/* Right video chat */}
            <div style={{ 
              borderLeft: "1px solid #e5e7eb", 
              padding: "15px", 
              display: "flex", 
              flexDirection: "column", 
              overflow: "auto",
              backgroundColor: "#f9fafb",
              borderRadius: "8px"
            }}>
              <VideoChat roomId={roomId} />
            </div>
          </div>
        </>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default App;
