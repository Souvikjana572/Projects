// Initialize a socket connection to the server
const socket = io();

// Create a new Chess game instance
const chess = new Chess();

// Select the chessboard element from the DOM
const boardelement = document.querySelector('.chessboard');

// Select the start and restart buttons from the DOM (not used in this code)
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// Variables to keep track of the dragged piece and its source square
let draggedPiece = null;
let sourceSquare = null;

// Variable to store the player's role (white, black, or spectator)
let playerRole = null;

// Function to render the chessboard
const renderBoard = () => {
    // Get the current board state
    const board = chess.board();
    // Clear the existing board
    boardelement.innerHTML = "";
    // Iterate through each row of the board
    board.forEach((row, rowindex) => {
        // Iterate through each square in the row
        row.forEach((square, squareIndex) => {
            // Create a new div element for the square
            const squareElement = document.createElement("div");
            // Add appropriate classes to the square (light or dark)
            squareElement.classList.add("square",
                rowindex % 2 === squareIndex % 2 ? "light" : "dark");
            // Set data attributes for row and column
            squareElement.dataset.row = rowindex;
            squareElement.dataset.column = squareIndex;
            // If there's a piece on this square
            if (square) {
                // Create a new div element for the piece
                const pieceElement = document.createElement("div");
                // Add appropriate classes to the piece (white or black)
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
                // Set the piece's Unicode character
                pieceElement.innerText = getPieceUnicode(square);
                // Make the piece draggable if it's the player's turn and piece
                pieceElement.draggable = playerRole === square.color && playerRole === chess.turn();

                // Add dragstart event listener to the piece
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        // Set the dragged piece and its source square
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareIndex };
                        // Set the drag data (required for Firefox)
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                // Append the piece to the square
                squareElement.appendChild(pieceElement);
            }
            // Add dragover event listener to the square
            squareElement.addEventListener("dragover", function (e) {
                // Prevent default to allow drop
                e.preventDefault();
            });
            // Add drop event listener to the square
            squareElement.addEventListener("drop", function (e) {
                // Prevent default browser behavior
                e.preventDefault();
                if (draggedPiece) {
                    // Get the target square coordinates
                    const TargetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.column),
                    }
                    // Handle the move
                    handleMove(sourceSquare, TargetSource);
                }
            });
            // Append the square to the board
            boardelement.append(squareElement);
        });
    });
    // Flip the board if the player is black
    if (playerRole === "b") {
        boardelement.classList.add("flipped");
    }
    else {
        boardelement.classList.remove("flipped");
    }
    // Update the game status
    updateGameStatus();
};

// Function to handle a move
const handleMove = (source, target) => {
    // Create a move object in the format required by chess.js
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q', // Always promote to queen for simplicity
    }
    // Emit the move to the server
    socket.emit("move", move)
}

// Function to get the Unicode character for a chess piece
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔",
        P: "♟", R: "♜", N: "♞", B: "♝", Q: "♛", K: "♚",
    };
    return unicodePieces[piece.type] || "";
};

// Socket event listener for receiving player role
socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

// Socket event listener for receiving moves
socket.on("move", function (move) {
    // Apply the move to the local chess instance
    chess.move(move);
    // Re-render the board
    renderBoard();
    // Update the game status
    updateGameStatus();
})

// Socket event listener for spectator role
socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

// Socket event listener for receiving board state
socket.on("boardState", function (fen) {
    // Load the received board state
    chess.load(fen);
    renderBoard();
})

// Initial board render
renderBoard();

// Function to update the game status
function updateGameStatus() {
    if (chess.isGameOver()) {
        let message = "";
        if (chess.isCheckmate()) {
            // Set message based on whether the current player won or lost
            message = playerRole === chess.turn() ? "You lost!" : "You won!";
        } else if (chess.isDraw()) {
            message = "It's a draw!";
        } else if (chess.isStalemate()) {
            message = "Stalemate!";
        }
        // Show the game over popup
        showPopup(message);
    }
}

// Function to show the game over popup
function showPopup(message) {
    const popup = document.getElementById('game-over-popup');
    const popupMessage = document.getElementById('popup-message');
    popupMessage.textContent = message;
    popup.classList.remove('hidden');
}

// Function to close the game over popup
function closePopup() {
    const popup = document.getElementById('game-over-popup');
    popup.classList.add('hidden');
}

// Add event listener for the close button on the popup
document.getElementById('close-popup').addEventListener('click', closePopup);
