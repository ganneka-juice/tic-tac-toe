        window.addEventListener('load', () => {
            setTimeout(() => {
                const loader = document.querySelector('.loader');
                loader.classList.add('fade-out');
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 1000);
            }, 2000);
        });

        const tipBtn = document.querySelector('.tip-btn');
        const tipContent = document.querySelector('.tip-content');
        const overlay = document.querySelector('.overlay');

        tipBtn.addEventListener('click', () => {
            tipContent.style.display = 'block';
            overlay.style.display = 'block';
        });

        overlay.addEventListener('click', () => {
            tipContent.style.display = 'none';
            overlay.style.display = 'none';
        });

        const cells = document.querySelectorAll('.cell');
        const status = document.querySelector('.status');
        const resetBtn = document.querySelector('.reset-btn');
        const difficultySelect = document.querySelector('.difficulty-select');
        const popup = document.querySelector('.popup');
        const popupTitle = popup.querySelector('h2');
        const countdownEl = document.getElementById('countdown');
        let currentPlayer = 'X';
        let gameBoard = ['', '', '', '', '', '', '', '', ''];
        let gameActive = true;
        let isAgainstBot = true;
        let countdownInterval;
        let isBotTurn = false;
        let remainingX = 3;
        let remainingO = 3;
        let is3x3Mode = false;
        let moveHistory = []; // Track move history for 3x3 mode

        const xImage = new Image();
        xImage.src = 'images/cross.png';
        const oImage = new Image();
        oImage.src = 'images/circle.svg';
        const xImageUrl = xImage.src;
        const oImageUrl = oImage.src;

        const crossSound = new Audio('images/cross.mp3');
        const circleSound = new Audio('images/circle.mp3');
        const drawSound = new Audio('images/draw.mp3');
        const wonSound = new Audio('images/won.mp3');

        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        function handleCellClick(e) {
            if (isBotTurn || !gameActive) return;

            const cell = e.target;
            const index = parseInt(cell.getAttribute('data-index'));

            if (gameBoard[index] !== '') return;

            if (is3x3Mode) {
                if (currentPlayer === 'X' && remainingX <= 0) {
                    // Remove the oldest X move
                    const oldestXIndex = moveHistory.find(move => gameBoard[move] === 'X');
                    if (oldestXIndex !== undefined) {
                        gameBoard[oldestXIndex] = '';
                        cells[oldestXIndex].innerHTML = '';
                        cells[oldestXIndex].classList.remove('filled', 'x');
                        remainingX++;
                        moveHistory = moveHistory.filter(move => move !== oldestXIndex);
                    }
                }
            }

            makeMove(index);

            if (gameActive && isAgainstBot && difficultySelect.value !== '2player') {
                isBotTurn = true;
                setTimeout(() => {
                    const botMoveResult = makeBotMove();
                    if (botMoveResult === null) {
                        showGameEndPopup("Game Draw!");
                    }
                    isBotTurn = false;
                }, 500);
            }
        }

        function showGameEndPopup(message) {
            if (message === "Game Draw!") {
                drawSound.play();
                setTimeout(() => {
                    resetGame();
                }, 1000);
                return;
            }

            wonSound.play();
            popupTitle.textContent = message;
            popup.classList.add('show');

            let countdown = 5;
            countdownEl.textContent = countdown;

            countdownInterval = setInterval(() => {
                countdown--;
                countdownEl.textContent = countdown;

                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    popup.classList.remove('show');
                    resetGame();
                }
            }, 1000);
        }

        popup.addEventListener('click', () => {
            clearInterval(countdownInterval);
            popup.classList.remove('show');
            resetGame();
        });

        function makeMove(index) {
            const cell = cells[index];
            const img = document.createElement('img');
            img.src = currentPlayer === 'X' ? xImageUrl : oImageUrl;
            cell.innerHTML = '';
            cell.appendChild(img);
            cell.classList.add('filled');
            cell.classList.add(currentPlayer.toLowerCase());

            if (currentPlayer === 'X') {
                crossSound.play();
                if (is3x3Mode) {
                    remainingX--;
                    moveHistory.push(index);
                }
            } else {
                circleSound.play();
                if (is3x3Mode) {
                    remainingO--;
                    moveHistory.push(index);
                }
            }

            gameBoard[index] = currentPlayer;

            if (checkWin()) {
                status.textContent = `Player ${currentPlayer} Wins!`;
                gameActive = false;
                showGameEndPopup(`Player ${currentPlayer} Wins!`);
                return;
            }

            if (!is3x3Mode && checkDraw()) {
                status.textContent = "Game Draw!";
                gameActive = false;
                showGameEndPopup("Game Draw!");
                return;
            }

            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            document.body.className = currentPlayer === 'X' ? 'player-x' : 'player-o';
            status.textContent = `Player ${currentPlayer}'s Turn`;
        }

        function makeBotMove() {
            if (!gameActive) return null;

            let index;
            const difficulty = difficultySelect.value;

            if (is3x3Mode && remainingO <= 0) {
                const oldestOIndex = moveHistory.find(move => gameBoard[move] === 'O');
                if (oldestOIndex !== undefined) {
                    gameBoard[oldestOIndex] = '';
                    cells[oldestOIndex].innerHTML = '';
                    cells[oldestOIndex].classList.remove('filled', 'o');
                    remainingO++;
                    moveHistory = moveHistory.filter(move => move !== oldestOIndex);
                }
            }

            if (difficulty === '3x3') {
                index = getImpossibleMove();
                isAgainstBot = true;
                if (index === null || index === undefined) {
                    // If no valid move found, try to move an existing O piece
                    if (remainingO <= 0) {
                        const oldestOIndex = moveHistory.find(move => gameBoard[move] === 'O');
                        if (oldestOIndex !== undefined) {
                            gameBoard[oldestOIndex] = '';
                            cells[oldestOIndex].innerHTML = '';
                            cells[oldestOIndex].classList.remove('filled', 'o');
                            remainingO++;
                            moveHistory = moveHistory.filter(move => move !== oldestOIndex);
                            index = getImpossibleMove();
                        }
                    }
                }
            } else {
                switch (difficulty) {
                    case 'hard':
                        index = getBestMove();
                        break;
                    case 'medium':
                        index = Math.random() < 0.6 ? getBestMove() : getRandomEmptyCell();
                        break;
                    case 'easy':
                        index = getRandomEmptyCell();
                        break;
                    default:
                        index = getRandomEmptyCell();
                }
            }

            if (index !== null && index !== undefined) {
                makeMove(index);
                return true;
            }
            return null;
        }

        function getImpossibleMove() {
            // First check for winning move
            for (let i = 0; i < 9; i++) {
                if (gameBoard[i] === '') {
                    gameBoard[i] = 'O';
                    if (checkWinForMinimax('O')) {
                        gameBoard[i] = '';
                        return i;
                    }
                    gameBoard[i] = '';
                }
            }

            // Then block opponent's winning move
            for (let i = 0; i < 9; i++) {
                if (gameBoard[i] === '') {
                    gameBoard[i] = 'X';
                    if (checkWinForMinimax('X')) {
                        gameBoard[i] = '';
                        return i;
                    }
                    gameBoard[i] = '';
                }
            }

            // Otherwise make strategic move
            const strategicPositions = [4, 0, 2, 6, 8, 1, 3, 5, 7];
            for (let pos of strategicPositions) {
                if (gameBoard[pos] === '') {
                    return pos;
                }
            }

            return getRandomEmptyCell();
        }

        function findForkOpportunities(player) {
            const opportunities = [];
            for (let i = 0; i < 9; i++) {
                if (gameBoard[i] === '') {
                    let winningPaths = 0;
                    gameBoard[i] = player;

                    for (let combo of winningCombinations) {
                        let playerCount = 0;
                        let emptyCount = 0;

                        for (let pos of combo) {
                            if (gameBoard[pos] === player) playerCount++;
                            if (gameBoard[pos] === '') emptyCount++;
                        }

                        if (playerCount === 2 && emptyCount === 1) {
                            winningPaths++;
                        }
                    }

                    gameBoard[i] = '';
                    if (winningPaths >= 2) {
                        opportunities.push(i);
                    }
                }
            }
            return opportunities;
        }

        function evaluatePosition() {
            let score = 0;

            const strategicPositions = [4, 0, 2, 6, 8];
            for (let pos of strategicPositions) {
                if (gameBoard[pos] === 'O') score += 3;
                if (gameBoard[pos] === 'X') score -= 2;
            }

            if (gameBoard[4] === 'O') score += 5;

            return score;
        }

        function getBestMove() {
            let bestScore = -Infinity;
            let bestMove = null;
            const availableMoves = [];

            if (gameBoard.filter(cell => cell !== '').length === 0) {
                return 4;
            }

            for (let i = 0; i < 9; i++) {
                if (gameBoard[i] === '') {
                    availableMoves.push(i);
                }
            }

            for (let move of availableMoves) {
                gameBoard[move] = 'O';
                if (checkWinForMinimax('O')) {
                    gameBoard[move] = '';
                    return move;
                }
                gameBoard[move] = '';
            }

            for (let move of availableMoves) {
                gameBoard[move] = 'X';
                if (checkWinForMinimax('X')) {
                    gameBoard[move] = '';
                    return move;
                }
                gameBoard[move] = '';
            }

            for (let move of availableMoves) {
                gameBoard[move] = 'O';
                let score = minimax(gameBoard, 0, false, -Infinity, Infinity);
                gameBoard[move] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            return bestMove !== null ? bestMove : availableMoves[0];
        }

        function minimax(board, depth, isMaximizing, alpha, beta) {
            if (checkWinForMinimax('O')) return 10 - depth;
            if (checkWinForMinimax('X')) return depth - 10;
            if (checkDraw()) return 0;

            if (isMaximizing) {
                let bestScore = -Infinity;
                for (let i = 0; i < 9; i++) {
                    if (board[i] === '') {
                        board[i] = 'O';
                        let score = minimax(board, depth + 1, false, alpha, beta);
                        board[i] = '';
                        bestScore = Math.max(score, bestScore);
                        alpha = Math.max(alpha, score);
                        if (beta <= alpha) break;
                    }
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                for (let i = 0; i < 9; i++) {
                    if (board[i] === '') {
                        board[i] = 'X';
                        let score = minimax(board, depth + 1, true, alpha, beta);
                        board[i] = '';
                        bestScore = Math.min(score, bestScore);
                        beta = Math.min(beta, score);
                        if (beta <= alpha) break;
                    }
                }
                return bestScore;
            }
        }

        function checkWinForMinimax(player) {
            return winningCombinations.some(combination => {
                return combination.every(index => gameBoard[index] === player);
            });
        }

        function getRandomEmptyCell() {
            const emptyCells = gameBoard.reduce((acc, cell, index) => {
                if (cell === '') acc.push(index);
                return acc;
            }, []);

            return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
        }

        function checkWin() {
            return winningCombinations.some(combination => {
                return combination.every(index => {
                    return gameBoard[index] === currentPlayer;
                });
            });
        }

        function checkDraw() {
            return gameBoard.every(cell => cell !== '');
        }

        function resetGame() {
            clearInterval(countdownInterval);
            gameBoard = ['', '', '', '', '', '', '', '', ''];
            gameActive = true;
            currentPlayer = 'X';
            document.body.className = 'player-x';
            status.textContent = `Player ${currentPlayer}'s Turn`;
            isBotTurn = false;
            remainingX = 3;
            remainingO = 3;
            moveHistory = [];

            cells.forEach(cell => {
                cell.innerHTML = '';
                cell.classList.remove('filled', 'x', 'o');
            });

            is3x3Mode = difficultySelect.value === '3x3';
            isAgainstBot = difficultySelect.value !== '2player';
        }

        difficultySelect.addEventListener('change', resetGame);
        cells.forEach(cell => {
            cell.addEventListener('click', handleCellClick);
        });
        resetBtn.addEventListener('click', resetGame);
