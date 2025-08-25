// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {}; // { roomId: { participants: [socketId, ...], code: string, language: string } }
const videoRooms = {}; // { roomId: [socketId, ...] } - for video calls (max 2)
const textRooms = {}; // { roomId: { participants: [socketId, ...], content: string } } - for text editing

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Handle room joining for both code editing and video calling
  socket.on("join", ({ roomId }) => {
    if (!roomId) return;
    
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: [], code: "", language: "cpp" };
    }
    
    // Add to code editing room (unlimited participants)
    if (!rooms[roomId].participants.includes(socket.id)) {
      rooms[roomId].participants.push(socket.id);
    }
    
    socket.join(roomId);
    console.log(`${socket.id} joined code room ${roomId}`, rooms[roomId].participants);

    // Send current code and language to new participant
    if (rooms[roomId].code) {
      socket.emit("code-change", { code: rooms[roomId].code, language: rooms[roomId].language });
    }
  });

  // Handle text editor room joining
  socket.on("join-text", ({ roomId }) => {
    console.log(`Join-text request from ${socket.id} for room ${roomId}`);
    
    if (!roomId) {
      console.log("No roomId provided for join-text");
      return;
    }
    
    // Initialize text room if it doesn't exist
    if (!textRooms[roomId]) {
      textRooms[roomId] = { participants: [], content: "" };
      console.log(`Created new text room ${roomId}`);
    }
    
    // Add to text editing room (unlimited participants)
    if (!textRooms[roomId].participants.includes(socket.id)) {
      textRooms[roomId].participants.push(socket.id);
      console.log(`Added ${socket.id} to text room ${roomId}`);
    }
    
    socket.join(`text-${roomId}`);
    console.log(`${socket.id} joined text room ${roomId}`, textRooms[roomId].participants);

    // Send current text content to new participant
    if (textRooms[roomId].content) {
      console.log(`Sending existing content to ${socket.id}:`, textRooms[roomId].content.substring(0, 50) + "...");
      socket.emit("text-change", { content: textRooms[roomId].content });
    } else {
      console.log(`No existing content in room ${roomId}`);
    }
  });

  // Handle video room joining (max 2 participants)
  socket.on("join-video", ({ roomId }) => {
    console.log(`Join-video request from ${socket.id} for room ${roomId}`);
    
    if (!roomId) {
      console.log("No roomId provided for join-video");
      return;
    }
    
    if (!videoRooms[roomId]) {
      videoRooms[roomId] = [];
      console.log(`Created new video room ${roomId}`);
    }

    // Check if user is already in the room
    if (videoRooms[roomId].includes(socket.id)) {
      console.log(`${socket.id} is already in video room ${roomId}`);
      return;
    }

    // Room limit 2 for video calls
    if (videoRooms[roomId].length >= 2) {
      console.log(`Video room ${roomId} is full`);
      socket.emit("room-full");
      return;
    }

    videoRooms[roomId].push(socket.id);
    socket.join(`video-${roomId}`);
    console.log(`${socket.id} joined video room ${roomId}`, videoRooms[roomId]);

    // Let the joining socket know who else is in the room
    const other = videoRooms[roomId].find((id) => id !== socket.id);
    socket.emit("joined", { otherId: other || null });

    // Notify the other peer that someone joined (if exists)
    if (other) {
      console.log(`Notifying ${other} that ${socket.id} joined`);
      socket.to(other).emit("peer-joined", { id: socket.id });
    }
  });

  // Handle code changes
  socket.on("code-change", ({ roomId, code, language }) => {
    if (!roomId || !rooms[roomId]) return;
    
    rooms[roomId].code = code;
    if (language) {
      rooms[roomId].language = language;
    }
    
    socket.to(roomId).emit("code-change", { code, language: rooms[roomId].language });
    console.log(`Code change in room ${roomId}, language: ${rooms[roomId].language}`);
  });

  // Handle text changes
  socket.on("text-change", ({ roomId, content }) => {
    console.log(`Text change received from ${socket.id} in room ${roomId}`);
    console.log(`Content length: ${content ? content.length : 0}`);
    
    if (!roomId || !textRooms[roomId]) {
      console.log(`Room ${roomId} not found or invalid`);
      return;
    }
    
    textRooms[roomId].content = content;
    console.log(`Broadcasting text change to room text-${roomId}`);
    
    socket.to(`text-${roomId}`).emit("text-change", { content });
    console.log(`Text change in room ${roomId} - participants:`, textRooms[roomId].participants);
  });

  // Generic signaling channel: forward to specific peer
  socket.on("signal", ({ to, type, data }) => {
    if (!to) return;
    console.log(`signal ${type} from ${socket.id} -> ${to}`);
    io.to(to).emit("signal", { from: socket.id, type, data });
  });



  // Handle call started notification
  socket.on("call-started", ({ to }) => {
    if (!to) return;
    console.log(`call-started from ${socket.id} -> ${to}`);
    io.to(to).emit("call-started", { from: socket.id });
  });

  // Handle leaving video room
  socket.on("leave", ({ roomId }) => {
    console.log(`Leave request from ${socket.id} for video room ${roomId}`);
    
    if (!roomId || !videoRooms[roomId]) {
      console.log(`Video room ${roomId} not found`);
      return;
    }
    
    // Remove from video room
    videoRooms[roomId] = videoRooms[roomId].filter((id) => id !== socket.id);
    socket.leave(`video-${roomId}`);
    
    // Notify other participants
    socket.to(`video-${roomId}`).emit("peer-left", { id: socket.id });
    console.log(`${socket.id} left video room ${roomId}, remaining:`, videoRooms[roomId]);
    
    // Clean up empty room
    if (videoRooms[roomId].length === 0) {
      delete videoRooms[roomId];
      console.log(`Deleted empty video room ${roomId}`);
    }
  });

  // Handle rejoin video room (for reconnection)
  socket.on("rejoin-video", ({ roomId }) => {
    console.log(`Rejoin-video request from ${socket.id} for room ${roomId}`);
    
    if (!roomId) {
      console.log("No roomId provided for rejoin-video");
      return;
    }
    
    if (!videoRooms[roomId]) {
      videoRooms[roomId] = [];
      console.log(`Created new video room ${roomId} for rejoin`);
    }

    // Check if user is already in the room
    if (videoRooms[roomId].includes(socket.id)) {
      console.log(`${socket.id} is already in video room ${roomId}`);
      return;
    }

    // Room limit 2 for video calls
    if (videoRooms[roomId].length >= 2) {
      console.log(`Video room ${roomId} is full`);
      socket.emit("room-full");
      return;
    }

    videoRooms[roomId].push(socket.id);
    socket.join(`video-${roomId}`);
    console.log(`${socket.id} rejoined video room ${roomId}`, videoRooms[roomId]);

    // Let the joining socket know who else is in the room
    const other = videoRooms[roomId].find((id) => id !== socket.id);
    socket.emit("joined", { otherId: other || null });

    // Notify the other peer that someone joined (if exists)
    if (other) {
      console.log(`Notifying ${other} that ${socket.id} rejoined`);
      socket.to(other).emit("peer-joined", { id: socket.id });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    
    // Remove from code editing rooms
    for (const roomId of Object.keys(rooms)) {
      if (rooms[roomId].participants.includes(socket.id)) {
        rooms[roomId].participants = rooms[roomId].participants.filter((id) => id !== socket.id);
        console.log(`${socket.id} removed from code room ${roomId}`);
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
          console.log(`Deleted empty code room ${roomId}`);
        }
      }
    }
    
    // Remove from text editing rooms
    for (const roomId of Object.keys(textRooms)) {
      if (textRooms[roomId].participants.includes(socket.id)) {
        textRooms[roomId].participants = textRooms[roomId].participants.filter((id) => id !== socket.id);
        console.log(`${socket.id} removed from text room ${roomId}`);
        if (textRooms[roomId].participants.length === 0) {
          delete textRooms[roomId];
          console.log(`Deleted empty text room ${roomId}`);
        }
      }
    }
    
    // Remove from video rooms
    for (const roomId of Object.keys(videoRooms)) {
      if (videoRooms[roomId].includes(socket.id)) {
        videoRooms[roomId] = videoRooms[roomId].filter((id) => id !== socket.id);
        socket.to(`video-${roomId}`).emit("peer-left", { id: socket.id });
        console.log(`${socket.id} removed from video room ${roomId}, remaining:`, videoRooms[roomId]);
        if (videoRooms[roomId].length === 0) {
          delete videoRooms[roomId];
          console.log(`Deleted empty video room ${roomId}`);
        }
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on :${PORT}`));

