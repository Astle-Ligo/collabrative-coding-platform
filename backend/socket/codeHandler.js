module.exports = (io, socket, roomCode) => {
    socket.on("codeChange", ({ roomId, code }) => {
        roomCode[roomId] = code;
        socket.to(roomId).emit("codeUpdate", code);
    });

    socket.on("cursorMove", ({ roomId, cursor }) => {
        socket.to(roomId).emit("updateCursor", { userId: socket.id, cursor });
    });
};
