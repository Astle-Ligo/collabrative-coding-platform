import React, { useState, useEffect, useRef } from "react";
import "./chatBox.css";
import { FiMessageSquare, FiPhoneCall, FiUsers, FiX } from "react-icons/fi";

const ChatBox = ({ socket, roomId, username, isOpen, toggleChat }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [typingUser, setTypingUser] = useState("");
    const [users, setUsers] = useState([]);
    const [chatMode, setChatMode] = useState("group");
    const [currentChatUser, setCurrentChatUser] = useState(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Join both room and chat
        socket.emit("joinRoom", { roomId, username });
        socket.emit("joinChat", { username });

        // Listen for messages
        socket.on("receiveMessage", (messageData) => {
            console.log("Received message:", messageData);
            setMessages(prev => [...prev, messageData]);
        });

        // Listen for typing indicators
        socket.on("showTyping", (typingUsername) => {
            if (typingUsername !== username) {
                setTypingUser(`${typingUsername} is typing...`);
                setTimeout(() => setTypingUser(""), 2000);
            }
        });

        // Listen for user list updates
        socket.on("updateUsers", (userList) => {
            console.log("Updated user list:", userList);
            setUsers(userList.filter(user => user.id !== socket.id));
        });

        return () => {
            socket.off("receiveMessage");
            socket.off("showTyping");
            socket.off("updateUsers");
        };
    }, [socket, roomId, username]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = () => {
        if (!message.trim()) return;

        const timestamp = new Date().toLocaleTimeString();

        const messageData = {
            sender: username,
            message: message.trim(),
            timestamp,
            roomId: chatMode === "group" ? roomId : null,
            recipient: chatMode === "personal" && currentChatUser ? currentChatUser.id : null
        };

        console.log("Sending message:", messageData);
        socket.emit("chatMessage", messageData);

        setMessage("");
    };

    const handleTyping = () => {
        const recipient = chatMode === "personal" && currentChatUser ? currentChatUser.id : null;
        socket.emit("typing", { roomId, username, recipient });
    };

    // Filter messages based on current chat mode
    const filteredMessages = messages.filter(msg => {
        if (chatMode === "group") {
            // Only show group messages (no recipient)
            return !msg.recipient;
        } else if (chatMode === "personal" && currentChatUser) {
            // Show messages between current user and selected chat partner
            const isMessageToCurrentChat =
                (msg.sender === username && msg.recipient === currentChatUser.id) ||
                (msg.senderSocketId === currentChatUser.id && msg.recipient === socket.id);

            return isMessageToCurrentChat;
        }
        return false;
    });

    return (
        <div className={`chat-container ${isOpen ? "open" : "closed"}`}>
            <div className={`sidebar ${isOpen ? "open" : ""}`}>
                <button
                    className={`sidebar-btn ${chatMode === "personal" ? "active" : ""}`}
                    onClick={() => setChatMode("personal")}
                >
                    <FiMessageSquare />
                    <span>Personal</span>
                </button>
                <button
                    className={`sidebar-btn ${chatMode === "group" ? "active" : ""}`}
                    onClick={() => setChatMode("group")}
                >
                    <FiUsers />
                    <span>Group</span>
                </button>
                <button className="sidebar-btn close-sidebar" onClick={toggleChat}>
                    <FiX />
                </button>
            </div>

            <div className="chat-content">
                <div className="chat-header">
                    <h3>
                        {chatMode === "personal"
                            ? `Chat with ${currentChatUser ? currentChatUser.username : "..."}`
                            : "Group Chat"}
                    </h3>
                    <button className="close-btn" onClick={toggleChat}>✖</button>
                </div>

                {chatMode === "personal" && (
                    <div className="users-list">
                        <h4>Available Users</h4>
                        {users.length === 0 ? (
                            <p className="no-users">No other users online</p>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.id}
                                    className={`user ${currentChatUser?.id === user.id ? "selected" : ""}`}
                                    onClick={() => setCurrentChatUser(user)}
                                >
                                    <span className={`status ${user.isOnline ? "online" : "offline"}`}></span>
                                    <span className="username">{user.username}</span>
                                    {!user.isOnline && <span className="offline-label">(offline)</span>}
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="chat-messages">
                    {filteredMessages.length === 0 ? (
                        <p className="no-messages">
                            {chatMode === "personal" && !currentChatUser
                                ? "Select a user to start chatting"
                                : "No messages yet"}
                        </p>
                    ) : (
                        filteredMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chat-message ${msg.sender === username ? "sent" : "received"}`}
                            >
                                <div className="message-content">
                                    <strong>{msg.sender}:</strong> {msg.message}
                                </div>
                                <span className="timestamp">{msg.timestamp}</span>
                            </div>
                        ))
                    )}
                    {typingUser && <p className="typing-indicator">{typingUser}</p>}
                    <div ref={messagesEndRef} /> {/* For auto-scrolling */}
                </div>

                <div className="chat-input">
                    <input
                        type="text"
                        value={message}
                        placeholder={
                            chatMode === "personal" && !currentChatUser
                                ? "Select a user first..."
                                : "Type a message..."
                        }
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage();
                            else handleTyping();
                        }}
                        disabled={chatMode === "personal" && !currentChatUser}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={chatMode === "personal" && !currentChatUser}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBox;