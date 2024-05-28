let socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard")
let draggdPiece = null;
let sourceSquare = null;
let playerRole = null;
const player = document.querySelector("#player")
const moveid = document.querySelector("#moviid");

const renderBoard = () => {
  const board = chess.board()
  boardElement.innerHTML = "";
  board.forEach((row, rowindex) => {
   row.forEach((square,squareindex) =>{
   const squareElemnt = document.createElement("div");
   squareElemnt.classList.add("square",(rowindex + squareindex)%2 === 0 ? "light" : "dark");
   squareElemnt.dataset.row = rowindex;
   squareElemnt.dataset.col = squareindex;
   if(square){
    const pieceElement = document.createElement("div")

    pieceElement.classList.add("piece", square.color === "w" ? "light-piece" : "dark-piece");
    pieceElement.innerText = getPieceUnicode(square);
    pieceElement.draggable = playerRole === square.color;

    squareElemnt.addEventListener("dragstart", (e) => {
     draggdPiece = pieceElement;
     sourceSquare = {row: rowindex, col: squareindex};
     e.dataTransfer.setData("text/plain", "");
    });

    squareElemnt.addEventListener("dragend", (e) => {
     draggdPiece = null
     sourceSquare = null;

    });
    squareElemnt.appendChild(pieceElement)
   }
   squareElemnt.addEventListener("dragover",(e)=>{
    e.preventDefault();
   })
   squareElemnt.addEventListener("drop", (e) => {
    e.preventDefault();
    if (draggdPiece) {
      const targetSquare = {row: parseInt(e.target.dataset.row), col: parseInt(e.target.dataset.col)};
      handleMove(sourceSquare,targetSquare)
    }
   })
   boardElement.appendChild(squareElemnt);
  })

})

if(playerRole === 'b'){
  boardElement.classList.add("flipped");
}else{
  boardElement.classList.remove("flipped");
}
}

const handleMove = (source, target) => {
  const sourceSquare = String.fromCharCode(97 + source.col) + (8 - source.row);
  const targetSquare = String.fromCharCode(97 + target.col) + (8 - target.row);
  const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q" // always promote to a queen for simplicity
  };
  socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
  const pieceUnicode = {
      p: '♙', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', // Black pieces
      P: '', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'  // White pieces
  };
  return pieceUnicode[piece.type] || '';
};

socket.on("playerRole",(role) => {
  console.log(role);
  playerRole = role;
  renderBoard();
})

socket.on("spectatorRole",() => {
  playerRole = null;
  renderBoard();
})

socket.on("boardState",(data) => {
  chess.load(data);
  renderBoard();
  console.log(chess.fen());

})
socket.on("move", (data) => {
  const moveText = chess.move(data);
  if (moveText) {
    const newFen = chess.fen();
    console.log('New FEN:', newFen);
    moveid.textContent = `Move: ${data.from}-${data.to}`;
  } else {
    // If the move is invalid, display an error message
    moveResult.textContent = 'Invalid move';
  }
  renderBoard();
})

socket.on("invalidMove", (data) => {
  chess.undo();
  player.textContent = `invalid move`;
  console.log("invalid move", data);
})

socket.on("disconnect", () => {
  player.innerText = `player leave the game`
  playerRole = null;
  renderBoard();
})

socket.on("connect", (e) => {
  player.textContent = `player join the game`
  console.log("connected");
  socket.emit("join");
})

socket.on("error", (error) => {
  player.textContent = `player leave the game error`
  console.log(error);
})


document.getElementById('reset').addEventListener('click', () => socket.emit('reset'));
document.getElementById('newGame').addEventListener('click', () => socket.emit('newGame'));
document.getElementById('resign').addEventListener('click', () => socket.emit('resign'));
document.getElementById('draw').addEventListener('click', () => socket.emit('draw'));
document.getElementById('undo').addEventListener('click', () => socket.emit('undo'));
document.getElementById('redo').addEventListener('click', () => socket.emit('redo'));
document.getElementById('loadGame').addEventListener('click', () => {
    const fen = prompt("Enter FEN:");
    if (fen) socket.emit('loadGame', fen);
});
document.getElementById('saveGame').addEventListener('click', () => socket.emit('saveGame'));


renderBoard()