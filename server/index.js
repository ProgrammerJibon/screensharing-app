const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(express.static(path.join(__dirname, "dist")));

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

    socket.on("screen", (data, ack) => {
        // Send to the specific room watching this socket ID
        socket.to(`viewing_${socket.id}`).emit("screen", data, ackClient =>{
            if (ack && ackClient){
                ack();
            }
        });
    });

    socket.on("sendCamera", ({ targetId }) => {
        socket.to(targetId).emit("sendCamera");
    });

    socket.on("camera", (data, ack) => {
        socket.to(`viewing_${socket.id}`).emit("camera", data, ackClient => {
            if (ack && ackClient) {
                ack();
            }
        });
    });

    socket.on("keyinput", (data) => {
        socket.to(`viewing_${socket.id}`).emit("keyinput", data);
    });


    // --- Client (Admin) Logic ---
    var viewingSocketId = null
    socket.on("join_pc", (targetSocketId) => {
        viewingSocketId = targetSocketId
        // Leave previous rooms to save bandwidth
        socket.rooms.forEach(room => {
            if (room.startsWith("viewing_")) socket.leave(room);
        });

        // Join the specific viewing room for the target PC
        const roomName = `viewing_${targetSocketId}`;
        socket.join(roomName);
        socket.to(targetSocketId).emit("sendScreen");
        console.log(`Client ${socket.id} joined room: ${roomName}`);
    });

    socket.on("remote_input", ({ targetId, type, data }) => {
        io.to(targetId).emit("control_command", { type, data });
    });

    socket.on("stop", ({ targetId }) => {
        io.to(targetId).emit("stop");
    });

    socket.on("delete_file", ({ targetId }) => {
        io.to(targetId).emit("delete");
    });

    // --- Disconnect Logic ---
    socket.on("disconnect", () => {
        // Only remove if it was a registered Home PC
        if (homePCs[socket.id]) {
            console.log(`Home PC disconnected: ${homePCs[socket.id].name}`);
            delete homePCs[socket.id];
            io.emit("update_pc_list", Object.values(homePCs));
        }
        if (viewingSocketId){
            io.to(viewingSocketId).emit("stop");
        }
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});