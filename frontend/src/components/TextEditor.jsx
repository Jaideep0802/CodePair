import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

function TextEditor({ roomId }) {
  const textareaRef = useRef(null);
  const isRemoteChange = useRef(false); // Prevent loop
  const [content, setContent] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io("http://localhost:3000", { 
      transports: ["websocket"],
      timeout: 5000
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected for text editor");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected for text editor");
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Handle textarea changes
  const handleTextChange = (e) => {
    if (!isRemoteChange.current && socketRef.current) {
      const newContent = e.target.value;
      setContent(newContent);
      console.log("Sending text change:", newContent.substring(0, 50) + "...");
      socketRef.current.emit("text-change", { roomId, content: newContent });
    }
  };

  // Join room and listen for updates
  useEffect(() => {
    if (!roomId || !socketRef.current) return;

    console.log("Joining text room:", roomId);
    socketRef.current.emit("join-text", { roomId });

    socketRef.current.on("text-change", ({ content: newContent }) => {
      console.log("Received text change:", newContent.substring(0, 50) + "...");
      if (textareaRef.current && newContent !== textareaRef.current.value) {
        console.log("Updating textarea with remote content");
        isRemoteChange.current = true; // Mark as remote change
        setContent(newContent);
        textareaRef.current.value = newContent;
        isRemoteChange.current = false; // Reset
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("text-change");
      }
    };
  }, [roomId]);

  // Set initial content when textarea is ready
  useEffect(() => {
    if (textareaRef.current && content) {
      textareaRef.current.value = content;
    }
  }, [content]);

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%",
      backgroundColor: "#ffffff"
    }}>
      {/* Connection status indicator */}
      <div style={{
        padding: "8px 15px",
        backgroundColor: isConnected ? "#d1fae5" : "#fef3c7",
        borderBottom: "1px solid #e5e7eb",
        fontSize: "12px",
        color: isConnected ? "#065f46" : "#92400e"
      }}>
        {isConnected ? "🟢 Connected - Real-time sync active" : "🟡 Connecting..."}
      </div>
      
      <textarea
        ref={textareaRef}
        placeholder="Paste your interview question here...

Example:
Given an array of integers, find the maximum sum of any contiguous subarray.

Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6 (subarray [4, -1, 2, 1])

Test Cases:
1. [1, 2, 3, 4] → 10
2. [-1, -2, -3] → -1
3. [0] → 0

Notes:
- Consider edge cases
- Think about time complexity
- Discuss your approach first"
        onChange={handleTextChange}
        style={{
          flex: 1,
          padding: "15px",
          border: "none",
          outline: "none",
          resize: "none",
          fontFamily: "monospace, 'Courier New', sans-serif",
          fontSize: "13px",
          lineHeight: "1.5",
          color: "#374151",
          backgroundColor: "#ffffff",
          overflowY: "auto"
        }}
      />
    </div>
  );
}

export default TextEditor;
