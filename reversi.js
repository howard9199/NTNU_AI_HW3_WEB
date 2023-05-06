// define a 2d array to store the state of the board
var board = new Array(8);
for (var i = 0; i < 8; i++) {
    board[i] = new Array(8);
}

var board_n = -1,
    board_m = -1;
var turn = 0; // which player's turn, 0 for player 1, 1 for player 2
var is_cmain = false;
var enable_ai = false;
var ai_first = false;

let resolve, reject;
var tmp_score;

// This function takes in two parameters, n and m, and generates an n*m Reversi board on the webpage.
// n is the number of rows of the Reversi board and m is the number of columns of the Reversi board.
// The Reversi board is created using HTML canvas and the size of each square is automatically adjusted based on the size of the canvas.
// The Reversi board is also responsive to the size of the window, so the Reversi board will always be fully visible on the screen.
// There's a button on the left of each row, which is used to clear the row.
// There's a button on the top of each column, which is used to clear the column.

function reversiboard(n, m) {
    board_n = n;
    board_m = m;
    // create a canvas element
    var canvas = document.getElementById("reversiboard");
    var ctx = canvas.getContext("2d");
    var width = window.innerWidth;
    var height = window.innerHeight;
    var squareSize = 50; //Math.min(width, height) / Math.max(n, m);
    canvas.width = squareSize * (parseInt(m) + 1); // transpose the width and height
    canvas.height = squareSize * (parseInt(n) + 1);

    for (var j = 0; j < m; j++) {
        // swap the loop order for rows and columns
        // draw the buttons on the left of each row
        ctx.fillStyle = "#e3ea13";
        ctx.fillRect((j + 1) * squareSize, 0, squareSize, squareSize);
        ctx.fillStyle = "#2dac38";
        ctx.fillRect((j + 1) * squareSize + 10, 0 + 10, squareSize - 20, squareSize - 20);
        for (var i = 0; i < n; i++) {
            // draw the buttons on the top of each column
            ctx.fillStyle = "#e3ea13";
            ctx.fillRect(0, (i + 1) * squareSize, squareSize, squareSize);
            ctx.fillStyle = "#2dac38";
            ctx.fillRect(0 + 10, (i + 1) * squareSize + 10, squareSize - 20, squareSize - 20);

            if ((i + j) % 2 == 0) {
                ctx.fillStyle = "#FFFFFF";
            } else {
                ctx.fillStyle = "#FFFFFF";
            }
            ctx.fillRect(j * squareSize + squareSize, i * squareSize + squareSize, squareSize, squareSize); // transpose the coordinates
            // add black edge to each square
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(j * squareSize + squareSize, i * squareSize + squareSize, squareSize, squareSize); // transpose the coordinates

            // if board[j][i] == 1, draw a black circle // transpose the indices

            if (board[i][j] == 1) {
                ctx.beginPath();
                ctx.arc(
                    (j + 1) * squareSize + squareSize / 2, // transpose the coordinates
                    (i + 1) * squareSize + squareSize / 2,
                    squareSize / 2,
                    0,
                    2 * Math.PI
                );
                ctx.fillStyle = "#000000";
                ctx.fill();
            }
        }
    }
}

// using Emscripten to call the function int ai_next(uint64_t board) in main.cpp to get the next move of the AI
// the function returns an integer, which is the next move

function ai_next(board) {
    let board1 = [
        [1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1],
        [0, 0, 0, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
    ];

    // transfer the board to a string
    var board64 = "";
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            board64 += board[i][j];
        }
    }
    console.log(board64);

    var nextMove = Module.ccall("ai_next", "number", ["string"], [board64]);
    console.log(nextMove);
    return nextMove;
}

// clear the entire row of the board
async function clearRow(row) {
    var score = 0;
    for (var i = 0; i < 8; i++) {
        if (board[i][row] == 1) score++;
        board[i][row] = 0;
    }
    console.log("clearRow", score);
    tmp_score = score;
    reversiboard(board_n, board_m);
    return score;
}

// clear the entire column of the board
async function clearCol(col) {
    var score = 0;
    for (var i = 0; i < 8; i++) {
        if (board[col][i] == 1) score++;
        board[col][i] = 0;
    }
    console.log("clearCol", score);
    tmp_score = score;
    reversiboard(board_n, board_m);
    return score;
}

// when the user click on the square of the leftmost of each row, clear the row
// if the user click on the square of the top of each column, clear the column
function clearRowOrColumn(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    var squareSize = 50;
    var row = Math.floor(x / squareSize) - 1;
    var col = Math.floor(y / squareSize) - 1;
    if (row < 0 && col >= 0) clearCol(col);
    else if (row >= 0 && col < 0) clearRow(row);
}

function init() {
    // read <input type="file" id="file" accept=".txt" />
    // the format is first line contain n, m, the n is the number of rows, m is the number of columns
    // the next n lines contain m numbers, 0 or 1, 0 means the square is empty, 1 means the square is occupied

    // init all board to 0
    for (var i = 0; i < 8; i++) {
        board[i] = [];
        for (var j = 0; j < 8; j++) {
            board[i][j] = 0;
        }
    }

    var file = document.getElementById("file").files[0];
    console.log(file);
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
        var text = reader.result;

        var lines = text.split("\n");
        var n = lines[0].split(" ")[0];
        var m = lines[0].split(" ")[1];
        for (var i = 0; i < n; i++) {
            var line = lines[i + 1].split(" ");
            for (var j = 0; j < m; j++) {
                board[i][j] = parseInt(line[j]);
            }
        }
        console.log(board);
        board_m = m;
        board_n = n;
        reversiboard(n, m);
        if (is_cmain) {
            callCMain_sub();
        } else {
            gameManager_sub();
        }
    };
    //var output = "Hello World\n";
    //var blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    //saveAs(blob, "output.txt");
    //save to the C:\Users\user\Desktop\output.txt
    //saveAs(blob, "C:\\Users\\user\\Desktop\\output.txt");
}

// This is the game manager. It is called when the user click on the start button.
// It controls the game flow. Like ai or user move first, ai or user's turn, and when the game ends, etc.
// Otherwise, it should calculate how many circles one player has and how many circles the other player has.
// It will call the function reversiboard to draw the board.
// If enable_ai is false, both players are human players.
// If enable_ai is true, one player is human player, the other player is AI.
// If ai_first is true, AI moves first, otherwise, human player moves first.
// When the human player's turn, it waits until the human player click on the board.
// use canvas.addEventListener to listen to the click event.

function gameManager(g_enable_ai, g_ai_first) {
    is_cmain = false;
    enable_ai = g_enable_ai;
    ai_first = g_ai_first;
    init();
}

async function gameManager_sub() {
    var player1_score = 0; // player1 is the first player
    var player2_score = 0; // player2 is the second player
    var canvas = document.getElementById("reversiboard");
    var ctx = canvas.getContext("2d");
    var squareSize = 50;
    document.getElementById("player1_score").innerHTML = "player1_score: " + player1_score;
    document.getElementById("player2_score").innerHTML = "player2_score: " + player2_score;
    document.getElementById("winner").innerHTML = "Game Started!";
    turn = 0;

    // while the board is not all empty
    while (true) {
        reversiboard(board_n, board_m);

        console.log(board);
        // if the board is all empty, the game ends
        var all_empty = true;
        for (var i = 0; i < board_n; i++) {
            for (var j = 0; j < board_m; j++) {
                if (board[i][j] == 1) {
                    all_empty = false;
                    break;
                }
            }
        }
        if (all_empty) break;

        // if it's first player's turn
        if (turn % 2 == 0) {
            // if the first player is human player
            if (!enable_ai || !ai_first) {
                player1_score += await human_player_turn();
                console.log("player1_score: " + player1_score);
            } else {
                player1_score += await ai_player_turn();
            }
        } else {
            // if the second player is human player
            if (!enable_ai || ai_first) {
                player2_score += await human_player_turn();
                console.log("player2_score: " + player2_score);
            } else {
                player2_score += await ai_player_turn();
            }
        }
        // show the score
        document.getElementById("player1_score").innerHTML = "player1_score: " + player1_score;
        document.getElementById("player2_score").innerHTML = "player2_score: " + player2_score;

        turn++;
        console.log("turn: " + turn);
    }

    // show the winner
    if (player1_score > player2_score) {
        document.getElementById("winner").innerHTML = "Player 1 wins!";
    } else if (player1_score < player2_score) {
        document.getElementById("winner").innerHTML = "Player 2 wins!";
    } else {
        document.getElementById("winner").innerHTML = "Draw!";
    }

    // output the result to output.txt, and download it
    /*var output = "";
    output += "Player 1: " + player1_score + "\n";
    output += "Player 2: " + player2_score + "\n";
    if (player1_score > player2_score) {
        output += "Player 1 wins!";
    } else if (player1_score < player2_score) {
        output += "Player 2 wins!";
    }
    var blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "output.txt");

    // disable the start button
    document.getElementById("start").disabled = true;

    // disable the file input
    document.getElementById("file").disabled = true;*/
}

// human player's turn
async function human_player_turn() {
    console.log("human player's turn");
    var canvas = document.getElementById("reversiboard");
    var ctx = canvas.getContext("2d");
    var squareSize = 50;
    var score = 0;

    // wait until the human player click on the board, use await

    const p = new Promise((r) => (resolve = r));
    const evt = await p;

    console.log("finish");
    reversiboard(board_n, board_m);
    return tmp_score;
}

// computer player's turn
async function ai_player_turn() {
    var row_or_col = ai_next(board);
    var score = 0;
    if (row_or_col < 8) score = clearRow(row_or_col);
    else score = clearCol(row_or_col - 8);

    reversiboard(board_n, board_m);
    return score;
}

// AI to I/O
function callCMain() {
    is_cmain = true;
    init();
}

function callCMain_sub() {
    // wait until the reader.onload function is called in init()

    var board64 = "";
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            board64 += board[i][j];
        }
    }
    console.log(board64);

    var return_val = Module.ccall("auto_move", "string", ["string"], [board64]);

    // console log [...return_val] to see the unicode of return_val
    console.log([...return_val].map((x) => x.charCodeAt(0)));

    const return_valNFC = return_val.normalize("NFC");
    console.log(return_valNFC);
    // delete the first 1 in return_val
    // return_val = return_val.substring(1);
    var blob = new Blob([return_valNFC], { type: "text/plain" });
    saveAs(blob, "output.txt");

    // disable the start button
    document.getElementById("start").disabled = true;

    // disable the file input
    document.getElementById("file").disabled = true;
}
