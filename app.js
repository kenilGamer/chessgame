const express = require('express');
const http = require('http'); // Corrected typo from 'hptt' to 'http'
const socket = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');
const app = express();
const server = http.createServer(app); // Use 'http' correctly
const io = socket(server);
const chess = new Chess();
let players = {};
let currentPlayer = "W";
const port = 8080;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {  
    console.log('a user connected');
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (socket.id) {
            if (players.white === socket.id) {
                delete players.white;
            } else if (players.black === socket.id) {
                delete players.black;
            }
        } else {
            console.log("spectator disconnected");
        }
    });

    socket.on('move', (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("invalid move");
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            console.log("invalid move", move);
            socket.emit("invalidMove", move);
        }
    });
    socket.on('reset', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });
    socket.on('newGame', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });
    socket.on('resign', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });
    socket.on('draw', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });
    socket.on('undo', () => {
        chess.undo();
        io.emit("boardState", chess.fen());
    });
    socket.on('redo', () => {
        chess.redo();
        io.emit("boardState", chess.fen());
    });
    socket.on('loadGame', (fen) => {
       try {
        chess.load(fen);
        io.emit("boardState", chess.fen());
       } catch (error) {
        console.log("invalid moveid",error);
       }
    });
    socket.on('saveGame', (fen) => {
        io.emit("boardState", chess.fen());
    });
    socket.on('newGame', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });

});

app.get('/', (req, res) => {
    res.render("index", { title: "Chess Game" });
});

server.listen(port, () => console.log(`Server running at http://127.0.0.1:${port}/`));
 