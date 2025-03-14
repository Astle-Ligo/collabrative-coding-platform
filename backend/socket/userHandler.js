module.exports = (io, socket, usersInRoom, roomCode) => {
    socket.on("joinRoom", (data) => {
        if (!data || !data.roomId || !data.username) {
            console.error("❌ Invalid joinRoom data:", data);
            return;
        }

        const { roomId, username } = data;
        socket.join(roomId);

        if (!usersInRoom[roomId]) usersInRoom[roomId] = [];
        if (!usersInRoom[roomId].some(user => user.id === socket.id)) {
            usersInRoom[roomId].push({ id: socket.id, name: username });
        }

        console.log(`🔹 ${username} (${socket.id}) joined room ${roomId}`);
        io.to(roomId).emit("updateUsers", usersInRoom[roomId]);

        if (roomCode[roomId]) {
            socket.emit("codeUpdate", roomCode[roomId]);
        }
    });
};
