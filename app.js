const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on("signalingMessage", (message) => {
        socket.broadcast.emit("signalingMessage", message);
    });
    
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});