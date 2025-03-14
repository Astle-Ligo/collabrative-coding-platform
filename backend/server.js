const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");
const registerSocketHandlers = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Your frontend URL
        methods: ["GET", "POST"],
    },
});

// Attach all socket event handlers
registerSocketHandlers(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
