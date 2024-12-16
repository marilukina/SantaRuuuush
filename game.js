class SantasResourceRush {
    constructor() {
        this.gridSize = 7;
        this.currentLevel = 1;
        this.maxLevels = 10;
        this.lives = 3;
        this.moves = 20;
        this.collectedResources = 0;
        this.requiredResources = 3;
        this.playerPosition = { x: 6, y: 6 };  // Start at bottom right
        this.targetPosition = { x: 0, y: 0 };  // Target at top left
        this.grid = [];
        this.penaltyCells = new Set();
        this.resourceCells = new Set();
        this.hiddenMines = new Set();
        this.missingCells = new Set();
        this.isProcessingMove = false;
        
        // Get DOM elements
        this.gameContainer = document.querySelector('.game-container');
        this.gridContainer = document.querySelector('.grid-container');
        this.levelText = document.querySelector('.level-text');
        this.levelProgress = document.querySelector('.level-progress');
        this.livesDisplay = document.querySelector('.lives');
        this.movesDisplay = document.querySelector('.moves');
        this.giftsDisplay = document.querySelector('.gifts');
        this.popup = document.querySelector('.popup');
        
        // Initialize game
        this.initializeGame();
    }

    initializeGame() {
        // Create initial grid
        this.createGrid();
        
        // Set up first level
        this.setupLevel();
        
        // Add event listeners
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.gridContainer.addEventListener('click', (e) => this.handleGridClick(e));
        
        // Update display
        this.updateHUD();
        
        // Set initial focus
        this.gameContainer.focus();
    }

    createGrid() {
        // Clear existing grid
        this.gridContainer.innerHTML = '';
        this.grid = [];

        // Create cells
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Add to grid array and DOM
                row.push(cell);
                this.gridContainer.appendChild(cell);
            }
            this.grid.push(row);
        }

        // Place initial elements
        this.updateGridDisplay();
    }

    setupLevel() {
        // Clear previous level state
        this.penaltyCells.clear();
        this.resourceCells.clear();
        this.hiddenMines.clear();
        this.missingCells.clear();
        this.collectedResources = 0;
        
        // Reset positions
        this.playerPosition = { x: 6, y: 6 };
        this.targetPosition = { x: 0, y: 0 };
        
        // Set up level based on difficulty
        if (this.currentLevel >= 6) {
            // Advanced levels
            this.moves = 20 + Math.floor(this.currentLevel * 1.5);
            this.requiredResources = Math.min(3 + Math.floor(this.currentLevel / 2), 5);

            // Add obstacles
            const missingCount = Math.min((this.currentLevel - 5) * 2, 8);
            const mineCount = Math.min((this.currentLevel - 4), 5);
            const penaltyCount = Math.min(this.currentLevel * 2, 10);

            this.addObstacles(missingCount, mineCount, penaltyCount);
        } else {
            // Basic levels
            this.moves = 20 + (this.currentLevel * 2);
            this.requiredResources = Math.min(2 + Math.floor(this.currentLevel / 2), 4);
            
            const penaltyCount = Math.min(this.currentLevel + 1, 6);
            this.addObstacles(0, 0, penaltyCount);
        }

        // Add resources
        const resourceCount = this.requiredResources + 1;
        this.addResources(resourceCount);

        // Update display
        this.updateGridDisplay();
    }

    addObstacles(missingCount, mineCount, penaltyCount) {
        // Add missing cells
        for (let i = 0; i < missingCount; i++) {
            this.addRandomCell('missing');
        }

        // Add mines
        for (let i = 0; i < mineCount; i++) {
            this.addRandomCell('mine');
        }

        // Add penalty cells
        for (let i = 0; i < penaltyCount; i++) {
            this.addRandomCell('penalty');
        }
    }

    addResources(count) {
        for (let i = 0; i < count; i++) {
            this.addRandomCell('resource');
        }
    }

    addRandomCell(type) {
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            const x = Math.floor(Math.random() * this.gridSize);
            const y = Math.floor(Math.random() * this.gridSize);
            
            if (this.canPlaceCell(x, y)) {
                const key = `${x},${y}`;
                switch (type) {
                    case 'missing':
                        this.missingCells.add(key);
                        break;
                    case 'mine':
                        this.hiddenMines.add(key);
                        break;
                    case 'penalty':
                        this.penaltyCells.add(key);
                        break;
                    case 'resource':
                        this.resourceCells.add(key);
                        break;
                }
                return;
            }
            attempts++;
        }
    }

    canPlaceCell(x, y) {
        const key = `${x},${y}`;
        return !(
            (x === this.playerPosition.x && y === this.playerPosition.y) ||
            (x === this.targetPosition.x && y === this.targetPosition.y) ||
            this.missingCells.has(key) ||
            this.hiddenMines.has(key) ||
            this.penaltyCells.has(key) ||
            this.resourceCells.has(key)
        );
    }

    updateGridDisplay() {
        // Update each cell's appearance
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                const key = `${x},${y}`;

                // Reset cell
                cell.className = 'cell';
                cell.textContent = '';

                // Add appropriate content and classes
                if (x === this.playerPosition.x && y === this.playerPosition.y) {
                    cell.classList.add('player');
                    cell.textContent = '🎅';
                } else if (x === this.targetPosition.x && y === this.targetPosition.y) {
                    cell.classList.add('target');
                    cell.textContent = '🛷';
                } else if (this.missingCells.has(key)) {
                    cell.classList.add('missing');
                } else if (this.penaltyCells.has(key)) {
                    cell.classList.add('penalty');
                    cell.textContent = '❄️';
                } else if (this.resourceCells.has(key)) {
                    cell.textContent = '🎁';
                }

                // Show valid moves
                if (this.isValidMove(x, y)) {
                    cell.classList.add('valid-move');
                }
            }
        }

        // Update HUD
        this.updateHUD();
    }

    isValidMove(x, y) {
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
            return false;
        }

        if (this.missingCells.has(`${x},${y}`)) {
            return false;
        }

        const dx = Math.abs(x - this.playerPosition.x);
        const dy = Math.abs(y - this.playerPosition.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    handleKeyDown(e) {
        if (this.isProcessingMove) return;

        let newX = this.playerPosition.x;
        let newY = this.playerPosition.y;

        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                newY--;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                newY++;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                newX--;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                newX++;
                break;
            default:
                return;
        }

        e.preventDefault();
        if (this.isValidMove(newX, newY)) {
            this.movePlayer(newX, newY);
        }
    }

    handleGridClick(e) {
        if (this.isProcessingMove) return;

        const cell = e.target.closest('.cell');
        if (!cell) return;

        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        if (this.isValidMove(x, y)) {
            this.movePlayer(x, y);
        }
    }

    async movePlayer(x, y) {
        if (this.moves <= 0 || this.isProcessingMove) return;

        this.isProcessingMove = true;
        this.moves--;

        // Update position
        this.playerPosition = { x, y };
        const key = `${x},${y}`;

        // Check for special cells
        if (this.hiddenMines.has(key)) {
            this.moves = Math.max(0, this.moves - 2);
            this.grid[y][x].classList.add('mine-revealed');
            await this.showPopup('💥 Hidden Mine!', 'You triggered a hidden mine! Lost 2 extra moves!');
            this.hiddenMines.delete(key);
        }

        if (this.penaltyCells.has(key)) {
            this.moves = Math.max(0, this.moves - 1);
            await this.showPopup('Oops!', 'You hit an icy patch! Lost an extra move! ❄️');
        }

        if (this.resourceCells.has(key)) {
            this.collectedResources++;
            this.resourceCells.delete(key);
        }

        // Update display
        this.updateGridDisplay();

        // Check win/lose conditions
        if (x === this.targetPosition.x && y === this.targetPosition.y) {
            if (this.collectedResources >= this.requiredResources) {
                if (this.currentLevel === this.maxLevels) {
                    await this.showVictoryPopup();
                } else {
                    this.currentLevel++;
                    await this.showLevelCompletePopup();
                }
            }
        }

        if (this.moves <= 0) {
            this.lives--;
            if (this.lives <= 0) {
                await this.showGameOverPopup();
            } else {
                await this.showRetryPopup();
            }
        }

        this.isProcessingMove = false;
    }

    updateHUD() {
        this.levelText.textContent = `Level ${this.currentLevel} of ${this.maxLevels}`;
        this.livesDisplay.textContent = `❤️ x${this.lives}`;
        this.movesDisplay.textContent = `⏳ Moves: ${this.moves}`;
        this.giftsDisplay.textContent = `🎁 ${this.collectedResources}/${this.requiredResources}`;
        
        const progress = ''.padStart(this.currentLevel, '🔵').padEnd(this.maxLevels, '⚪');
        this.levelProgress.textContent = progress;
    }

    showPopup(title, message, buttonText = 'OK') {
        return new Promise(resolve => {
            const popupTitle = this.popup.querySelector('.popup-title');
            const popupMessage = this.popup.querySelector('.popup-message');
            const popupButton = this.popup.querySelector('.popup-button');

            popupTitle.textContent = title;
            popupMessage.textContent = message;
            popupButton.textContent = buttonText;

            const handleClose = () => {
                this.popup.style.display = 'none';
                popupButton.removeEventListener('click', handleClose);
                resolve();
            };

            popupButton.addEventListener('click', handleClose);
            this.popup.style.display = 'flex';
            popupButton.focus();
        });
    }

    async showLevelCompletePopup() {
        await this.showPopup(
            '🎉 Level Complete!',
            `Great job! Ready for Level ${this.currentLevel}?`,
            'Next Level'
        );
        this.setupLevel();
    }

    async showVictoryPopup() {
        await this.showPopup(
            '🎄 Congratulations!',
            'You saved Christmas! Share your achievement with friends! 🎅🎁⭐',
            'Share'
        );
        // Handle sharing
        const shareData = {
            title: "Santa's Resource Rush 🎄",
            text: "Check out this new Christmas game! 🎁✨ I saved Christmas, can you do it too? 🎅",
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            }
        } catch (err) {
            console.log('Error sharing:', err);
        }
    }

    async showRetryPopup() {
        await this.showPopup(
            '❄️ Out of Moves!',
            `${this.lives} lives remaining. Try again!`,
            'Retry Level'
        );
        this.moves = 20 + (this.currentLevel * 2);
        this.setupLevel();
    }

    async showGameOverPopup() {
        await this.showPopup(
            '💔 Game Over',
            'No more lives! Starting over from Level 1',
            'Start Over'
        );
        this.currentLevel = 1;
        this.lives = 3;
        this.setupLevel();
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    console.log('Starting Santa\'s Resource Rush...');
    new SantasResourceRush();
});