module.exports = (io, socket) => {
    socket.on("typing", ({ roomId, username }) => {
        socket.to(roomId).emit("showTyping", username);
    });

    socket.on("chatMessage", ({ roomId, username, message }) => {
        const timestamp = new Date().toLocaleTimeString();
        io.to(roomId).emit("receiveMessage", { username, message, timestamp });
    });
};
