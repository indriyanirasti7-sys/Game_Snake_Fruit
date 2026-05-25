import Snake from '../objects/Snake.js';
import Fruit from '../objects/Fruit.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.gridSize = 20;
        this.cellSize = 32;
        this.gridWidth = 20;
        this.gridHeight = 20;
        this.snake = null;
        this.fruit = null;
        this.score = 0;
        this.gameOver = false;
        this.moveInterval = null;
        this.baseSpeed = 250;
        this.currentSpeed = 250;
        this.particles = null;
        this.isRespawning = false;
    }
    
    create() {
        // Reset semua state
        this.score = 0;
        this.gameOver = false;
        this.currentSpeed = this.baseSpeed;
        this.isRespawning = false;
        
        // Bersihkan interval jika ada
        if(this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        
        // Background
        this.add.tileSprite(0, 0, 1280, 720, 'grassTile').setOrigin(0, 0);
        
        // Grid overlay (subtle)
        this.drawGrid();
        
        // Initialize snake at center
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        this.snake = new Snake(this, startX, startY, this.gridWidth, this.gridHeight);
        
        // Create fruit
        this.fruit = new Fruit(this, this.snake);
        
        // Particle system
        this.particles = this.add.particles(0, 0, 'snakeBody', {
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            quantity: 1,
            frequency: -1
        });
        
        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            pause: Phaser.Input.Keyboard.KeyCodes.P
        });
        
        // Start game loop
        this.startMovement();
        
        // Events
        this.events.off('eat'); // Remove old listeners
        this.events.off('gameover');
        this.events.on('eat', this.onEat, this);
        this.events.on('gameover', this.onGameOver, this);
    }
    
    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x3a6a3a, 0.3);
        
        for(let i = 0; i <= this.gridWidth; i++) {
            graphics.moveTo(i * this.cellSize, 0);
            graphics.lineTo(i * this.cellSize, this.gridHeight * this.cellSize);
            graphics.moveTo(0, i * this.cellSize);
            graphics.lineTo(this.gridWidth * this.cellSize, i * this.cellSize);
        }
        
        graphics.strokePath();
    }
    
    startMovement() {
        if(this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        
        if(this.gameOver) return;
        
        this.moveInterval = setInterval(() => {
            if(!this.gameOver && !this.isRespawning) {
                this.updateMovement();
            }
        }, this.currentSpeed);
    }
    
    updateMovement() {
        if(this.gameOver) return;
        
        // Get direction from input
        let newDir = null;
        
        if(this.cursors.left.isDown || this.keys.left.isDown) newDir = 'left';
        else if(this.cursors.right.isDown || this.keys.right.isDown) newDir = 'right';
        else if(this.cursors.up.isDown || this.keys.up.isDown) newDir = 'up';
        else if(this.cursors.down.isDown || this.keys.down.isDown) newDir = 'down';
        
        if(newDir) {
            this.snake.setDirection(newDir);
        }
        
        // Move snake
        const ate = this.snake.move(this.fruit);
        
        if(ate) {
            this.events.emit('eat');
        }
        
        // Check collision
        if(this.snake.checkCollision()) {
            this.events.emit('gameover');
        }
    }
    
    onEat() {
        // Increase score
        this.score++;
        
        // Spawn new fruit
        this.fruit.respawn(this.snake);
        
        // Particle effect
        this.createEatEffect();
        
        // Screen shake
        this.cameras.main.shake(100, 0.003);
        
        // Increase speed based on score
        this.currentSpeed = Math.max(80, this.baseSpeed - Math.floor(this.score / 5) * 8);
        this.startMovement(); // Restart interval with new speed
        
        // Update UI
        const uiScene = this.scene.get('UIScene');
        if(uiScene) {
            uiScene.events.emit('updateScore', this.score);
        }
        
        // Play retro sound
        this.playEatSound();
    }
    
    createEatEffect() {
        if(!this.fruit) return;
        
        const fruitPos = this.fruit.getPosition();
        if(!fruitPos) return;
        
        const worldX = fruitPos.x * this.cellSize + this.cellSize/2;
        const worldY = fruitPos.y * this.cellSize + this.cellSize/2;
        
        // Create particles
        for(let i = 0; i < 12; i++) {
            const particle = this.add.rectangle(worldX, worldY, 3, 3, 0xff6060);
            this.tweens.add({
                targets: particle,
                x: worldX + (Math.random() - 0.5) * 60,
                y: worldY + (Math.random() - 0.5) * 60,
                alpha: 0,
                scale: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
        
        // Floating number effect
        const scoreText = this.add.text(worldX, worldY - 20, '+1', {
            fontFamily: '"Courier New", monospace',
            fontSize: '24px',
            fill: '#ffe0a0'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: scoreText,
            y: worldY - 60,
            alpha: 0,
            duration: 600,
            onComplete: () => scoreText.destroy()
        });
    }
    
    playEatSound() {
        // Simple beep sound using Web Audio
        try {
            if(!this.game.audioContext) {
                this.game.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume audio context if suspended
            if(this.game.audioContext.state === 'suspended') {
                this.game.audioContext.resume();
            }
            
            const ctx = this.game.audioContext;
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = 880;
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
            oscillator.stop(ctx.currentTime + 0.3);
        } catch(e) {
            // Silent fail if audio not supported
        }
    }
    
    onGameOver() {
        if(this.gameOver) return;
        
        this.gameOver = true;
        if(this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        
        // Save high score
        const currentHigh = localStorage.getItem('snakeHighScore') || 0;
        if(this.score > currentHigh) {
            localStorage.setItem('snakeHighScore', this.score);
        }
        
        // Show game over overlay
        const uiScene = this.scene.get('UIScene');
        if(uiScene) {
            uiScene.showGameOver(this.score);
        }
    }
    
    restartGame() {
        this.isRespawning = true;
        
        // Bersihkan semua sprite lama
        if(this.snake) {
            this.snake.destroy();
        }
        if(this.fruit && this.fruit.sprite) {
            this.fruit.sprite.destroy();
        }
        
        // Hapus semua child kecuali background
        this.children.list.forEach(child => {
            if(child !== this.background && child.type !== 'TileSprite') {
                if(child.destroy) child.destroy();
            }
        });
        
        // Reset dan recreate
        this.create();
        this.isRespawning = false;
    }
    
    update() {
        if(this.gameOver) return;
        
        // Update fruit animation
        if(this.fruit) {
            this.fruit.update();
        }
    }
}