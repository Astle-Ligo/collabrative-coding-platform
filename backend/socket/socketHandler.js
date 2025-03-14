const handleUsers = require("./userHandler");
const handleCode = require("./codeHandler");
const handleChat = require("./chatHandler");

const usersInRoom = {}; // Store users per room
const roomCode = {}; // Store latest code per room

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log("🟢 New client connected:", socket.id);

        handleUsers(io, socket, usersInRoom, roomCode);
        handleCode(io, socket, roomCode);
        handleChat(io, socket);

        socket.on("disconnect", () => {
            for (const roomId in usersInRoom) {
                usersInRoom[roomId] = usersInRoom[roomId].filter(user => user.id !== socket.id);
                io.to(roomId).emit("updateUsers", usersInRoom[roomId]);
            }
            console.log("🔴 Client disconnected:", socket.id);
        });
    });
};
