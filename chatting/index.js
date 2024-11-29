    const http = require("http");
    const express = require("express");
    const path = require("path");
    const { Server } = require("socket.io");
    const cors = require('cors');
    const fs = require('fs');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    app.use(cors());

    // app.use('/voice_messages', express.static(path.join(__dirname, 'public', 'voice_messages')));


    const voiceMessagesPath = path.join(__dirname, "public", "voice_messages");

    if (!fs.existsSync(voiceMessagesPath)) {
        fs.mkdirSync(voiceMessagesPath, { recursive: true });
    }
    app.use('/voice_messages', express.static(path.join(__dirname, 'public', 'voice_messages')));

    const generateUniqueFileName = () => {
        return `${Date.now()}_${Math.floor(Math.random() * 100000)}_voice.wav`;
    };

    io.on("connection", (socket) => {
        socket.on("user-message", (message) => {
            io.emit("message", message);
        });

        socket.on("user-joined", (username) => {
            socket.broadcast.emit("message", { username: "Server", message: `${username} has joined the chat` });
        });

        socket.on('voice-message', (data) => {
            const audioBuffer = Buffer.from(data.audioBlob);
            const fileName = generateUniqueFileName();
            const filePath = path.join(voiceMessagesPath, fileName);
            fs.writeFileSync(filePath, audioBuffer);
            io.emit('message', { username: data.username, message: fileName, isVoice: true });
        });

        socket.on('disconnect', () => {
            // console.log('User disconnected');
        });
    });



    app.use(express.static(path.resolve("./public")));

    app.get("/", (req, res) => {
        return res.sendFile("./public/index.html", { root: __dirname });
    });

    server.listen(8001, () => console.log("Server started at port 8000"));
