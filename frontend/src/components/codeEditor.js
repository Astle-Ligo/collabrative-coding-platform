import React, { useState, useEffect } from "react";
import MonacoEditor from "@monaco-editor/react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // Connect to backend

const CodeEditor = ({ roomId }) => {
    const [code, setCode] = useState("");

    useEffect(() => {
        console.log("🔍 Received roomId in CodeEditor:", roomId);
        if (!roomId) {
            console.error("❌ No roomId provided! Fix this in parent component.");
            return;
        }
    
        const username = localStorage.getItem("username") || `User_${socket.id}`;
        console.log("🔗 Joining room:", { roomId, username });
    
        socket.emit("joinRoom", { roomId, username });
    
        socket.on("codeUpdate", (newCode) => {
            console.log("📩 Received updated code:", newCode);
            setCode(newCode);
        });
    
        return () => {
            socket.off("codeUpdate");
        };
    }, [roomId]);
    
    useEffect(() => {
        socket.on("connect", () => console.log("🟢 Connected:", socket.id));
        socket.on("disconnect", () => console.log("🔴 Disconnected"));
        return () => {
            socket.off("connect");
            socket.off("disconnect");
        };
    }, []);

    const handleCodeChange = (newValue) => {
        setCode((prevCode) => {
            if (prevCode === newValue) return prevCode;
            console.log("✍️ Code changed, sending update:", newValue);
            socket.emit("codeChange", { roomId, code: newValue });
            return newValue;
        });
    };

    return (
        <MonacoEditor
            height="500px"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
        />
    );
};

export default CodeEditor;
