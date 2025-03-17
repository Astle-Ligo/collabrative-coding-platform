import React, { useState, useEffect, useRef, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import './codeEditor.css'
import ChatBox from "./chatBox";
import { io } from "socket.io-client";
import { FiMessageCircle } from "react-icons/fi"; // Importing icon

const socket = io("http://localhost:5000"); // Connect to backend

const CodeEditor = ({ roomId }) => {
    const [code, setCode] = useState("");
    const [cursors, setCursors] = useState({}); // Track cursors for multiple users
    const [typingUsers, setTypingUsers] = useState({}); // Track users who are typing
    const editorRef = useRef(null); // Store editor instance
    const decorationsRef = useRef([]); // Store previous decorations
    const userColorsRef = useRef({}); // Store colors for users (persistent)
    const typingTimeoutsRef = useRef({}); // Store typing timeouts separately
    const [isChatOpen, setIsChatOpen] = useState(false); // State to toggle chat

    const username = localStorage.getItem("username") || `User_${socket.id}`;

    const toggleChat = () => {
        setIsChatOpen((prev) => !prev);
    };

    useEffect(() => {
        if (!roomId) {
            console.error("❌ No roomId provided! Fix this in parent component.");
            return;
        }

        socket.emit("joinRoom", { roomId, username });

        socket.on("codeUpdate", (newCode) => {
            setCode(newCode);
        });

        socket.on("updateCursor", ({ userId, cursor }) => {
            setCursors((prevCursors) => ({
                ...prevCursors,
                [userId]: cursor,
            }));
        });

        socket.on("userTyping", ({ userId, username, cursor }) => {
            if (userId !== socket.id) {
                setTypingUsers((prev) => ({
                    ...prev,
                    [userId]: { username, cursor }
                }));

                clearTimeout(typingTimeoutsRef.current[userId]);

                typingTimeoutsRef.current[userId] = setTimeout(() => {
                    setTypingUsers((prev) => {
                        const updatedUsers = { ...prev };
                        delete updatedUsers[userId];
                        return updatedUsers;
                    });
                    delete typingTimeoutsRef.current[userId];
                }, 1500); // Reduced timeout for smoother UI
            }
        });

        return () => {
            socket.off("codeUpdate");
            socket.off("updateCursor");
            socket.off("userTyping");
        };
    }, [roomId, username]);

    const getUserColor = (userId) => {
        if (!userColorsRef.current[userId]) {
            // Generate a random color for each user
            userColorsRef.current[userId] = `hsl(${Math.random() * 360}, 100%, 60%)`;
        }
        return userColorsRef.current[userId];
    };

    const updateCursorDecorations = useCallback(() => {
        if (!editorRef.current || !window.monaco) return;
        const editor = editorRef.current;

        // Remove old decorations
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

        // Ensure decorations are always present
        const newDecorations = Object.entries(cursors).map(([userId, cursor]) => ({
            range: new window.monaco.Range(
                cursor.lineNumber,
                cursor.column,
                cursor.lineNumber,
                cursor.column + 1 // Extend to make cursor more visible
            ),
            options: {
                className: `remote-cursor-${userId}`,
                afterContentClassName: `cursor-label-${userId}`,
                stickiness: window.monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTyping,
            },
        }));

        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
    }, [cursors]);

    useEffect(() => {
        updateCursorDecorations(); // Update cursor decorations

        setTimeout(() => { // Wait for elements to be rendered
            Object.entries(cursors).forEach(([userId]) => {
                const color = getUserColor(userId);
                document.querySelectorAll(`.cursor-label-${userId}`).forEach((label) => {
                    if (!label.dataset.processed) {
                        label.style.background = color;
                        label.style.borderRadius = "4px";
                        label.style.padding = "2px 4px";
                        label.style.color = "white";
                        label.style.fontSize = "12px";
                        label.style.fontWeight = "bold";
                        label.style.position = "absolute";
                        label.innerText = `User ${userId}`;
                        label.dataset.processed = "true"; // Mark as processed
                    }
                });
            });
        }, 100); // Short delay to wait for elements to appear

    }, [cursors, updateCursorDecorations]);

    useEffect(() => {
        socket.on("connect", () => console.log("🟢 Connected:", socket.id));
        socket.on("disconnect", () => console.log("🔴 Disconnected"));
        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    const handleCodeChange = useCallback((newValue) => {
        setCode((prevCode) => {
            if (prevCode === newValue) return prevCode;
            socket.emit("codeChange", { roomId, code: newValue });

            const editor = editorRef.current;
            if (editor) {
                const position = editor.getPosition();
                socket.emit("userTyping", { roomId, userId: socket.id, username, cursor: position });
            }
            return newValue;
        });
    }, [roomId, username]);

    const handleCursorChange = (editor) => {
        const position = editor.getPosition();
        if (position) {
            setCursors((prevCursors) => ({
                ...prevCursors,
                [socket.id]: { lineNumber: position.lineNumber, column: position.column },
            }));

            socket.emit("cursorMove", {
                roomId,
                userId: socket.id,
                cursor: { lineNumber: position.lineNumber, column: position.column }
            });
        }
    };

    return (
        <div className="code-editor-container">
            <MonacoEditor
                width="100%"
                height="100vh"
                language="javascript"
                theme="vs-dark"
                value={code}
                onChange={handleCodeChange}
                onMount={(editor) => {
                    editorRef.current = editor;
                    editor.onDidChangeCursorPosition(() => handleCursorChange(editor));
                }}
            />

            {/* Button to open/close chat */}
            <button className="chat-toggle-btn" onClick={toggleChat}>
                <FiMessageCircle />
            </button>

            <ChatBox
                socket={socket}
                roomId={roomId}
                username={username}
                isOpen={isChatOpen} // Pass the state as a prop
                toggleChat={toggleChat} // Pass the function to close it
            />

            {/* Corrected Typing Indicator */}
            <div className="typing-indicator">
                {Object.values(typingUsers).length > 0 &&
                    Object.entries(typingUsers).map(([userId, { username, cursor }]) => (
                        <div key={userId} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ fontWeight: "bold", color: getUserColor(userId) }}>
                                {username} is typing...
                            </span>
                            {cursor && (
                                <span style={{ fontStyle: "italic", fontSize: "12px" }}>
                                    (Line {cursor.lineNumber}, Column {cursor.column})
                                </span>
                            )}
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default CodeEditor;