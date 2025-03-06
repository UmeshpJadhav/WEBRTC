const express = require('express');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const server = http.createServer(app);
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    socket.on("signalingMessage", (message) => {  
      socket.broadcast.emit("signalingMessage", message);
    });
  });

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});