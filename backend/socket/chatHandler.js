// Complete socket.io server handler

const users = {}; // Store users by socket ID

module.exports = (io, socket) => {
    // User joins chat
    socket.on("joinChat", ({ username }) => {
        // Store user info
        users[socket.id] = {
            username,
            isOnline: true
        };

        console.log(`User ${username} (${socket.id}) joined the chat`);

        // Broadcast updated user list to everyone
        const userList = Object.entries(users).map(([id, user]) => ({
            id,
            username: user.username,
            isOnline: user.isOnline
        }));

        io.emit("updateUsers", userList);
    });

    // User sends a message
    socket.on("chatMessage", (messageData) => {
        const { sender, message, timestamp, roomId, recipient } = messageData;

        console.log(`Message from ${sender}: "${message}" to ${recipient || "group"}`);

        if (recipient) {
            // PERSONAL MESSAGE
            // 1. Send to recipient
            io.to(recipient).emit("receiveMessage", {
                sender,
                senderSocketId: socket.id,
                recipient,
                message,
                timestamp,
                isPersonal: true
            });

            // 2. Also send back to sender (confirmation)
            socket.emit("receiveMessage", {
                sender,
                senderSocketId: socket.id,
                recipient,
                message,
                timestamp,
                isPersonal: true
            });

            console.log(`Personal message sent to ${recipient}`);
        } else {
            // GROUP MESSAGE
            // Broadcast to everyone in the room including sender
            io.to(roomId).emit("receiveMessage", {
                sender,
                senderSocketId: socket.id,
                recipient: null,
                message,
                timestamp,
                isPersonal: false
            });

            console.log(`Group message broadcast to room ${roomId}`);
        }
    });

    // User is typing
    socket.on("typing", ({ roomId, username, recipient }) => {
        console.log(`${username} is typing (recipient: ${recipient || "group"})`);

        if (recipient) {
            // Personal chat typing indicator
            io.to(recipient).emit("showTyping", username);
        } else {
            // Group chat typing indicator
            socket.to(roomId).emit("showTyping", username);
        }
    });

    // User joins a room
    socket.on("joinRoom", ({ roomId, username }) => {
        socket.join(roomId);
        console.log(`${username} joined room ${roomId}`);
    });

    // User disconnects
    socket.on("disconnect", () => {
        const user = users[socket.id];
        if (user) {
            console.log(`User ${user.username} (${socket.id}) disconnected`);

            // Mark as offline first (keep in list for a while)
            users[socket.id].isOnline = false;

            // Broadcast updated user list
            const userList = Object.entries(users).map(([id, user]) => ({
                id,
                username: user.username,
                isOnline: user.isOnline
            }));

            io.emit("updateUsers", userList);

            // Remove after delay
            setTimeout(() => {
                delete users[socket.id];
                // Optionally broadcast updated list again
            }, 30000);
        }
    });
};