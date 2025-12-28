const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Store connected Home PCs: { socketId: { id: socketId, name: "PC Name" } }
let homePCs = {};

io.on("connection", (socket) => {
    // 1. Send existing list to the new user immediately
    socket.emit("update_pc_list", Object.values(homePCs));

    // --- Home PC Logic ---
    socket.on("register_home", (pcName) => {
        homePCs[socket.id] = { id: socket.id, name: pcName };
        console.log(`Home PC registered: ${pcName} (${socket.id})`);
        io.emit("update_pc_list", Object.values(homePCs));
    });

    socket.on("screen", (data) => {
        // Send to the specific room watching this socket ID
        socket.to(`viewing_${socket.id}`).emit("screen", data);
    });

    socket.on("camera", (data) => {
        socket.to(`viewing_${socket.id}`).emit("camera", data);
    });

    socket.on("sync", (ack) => {
        if (ack) ack();
    });

    // --- Client (Admin) Logic ---
    socket.on("join_pc", (targetSocketId) => {
        // Leave previous rooms to save bandwidth
        socket.rooms.forEach(room => {
            if (room.startsWith("viewing_")) socket.leave(room);
        });

        // Join the specific viewing room for the target PC
        const roomName = `viewing_${targetSocketId}`;
        socket.join(roomName);
        console.log(`Client ${socket.id} joined room: ${roomName}`);
    });

    socket.on("remote_input", ({ targetId, type, data }) => {
        io.to(targetId).emit("control_command", { type, data });
    });

    // --- Disconnect Logic ---
    socket.on("disconnect", () => {
        // Only remove if it was a registered Home PC
        if (homePCs[socket.id]) {
            console.log(`Home PC disconnected: ${homePCs[socket.id].name}`);
            delete homePCs[socket.id];
            io.emit("update_pc_list", Object.values(homePCs));
        }
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});