export default class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
        this.score = 0;
        this.highScore = 0;
        this.isPaused = false;
    }
    
    create() {
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        
        // Tombol Pause dan Fullscreen (tetap di pojok)
        this.createPauseButton();
        this.createFullscreenButton();
        
        const gameScene = this.scene.get('GameScene');
        if(gameScene) {
            gameScene.events.on('updateScore', this.updateScore, this);
        }
        
        this.input.keyboard.on('keydown-P', () => this.togglePause());
    }
    
    updateScore(score) {
        this.score = score;
        if(this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
    }
    
    createPauseButton() {
        const pauseBtn = this.add.rectangle(1250, 40, 40, 40, 0x4a6a3a, 0.8)
            .setStrokeStyle(2, 0x8aba6b)
            .setInteractive({ useHandCursor: true });
        this.pauseIcon = this.add.text(1250, 40, '⏸', { fontFamily: 'Arial', fontSize: '28px', fill: '#d0e8d0' }).setOrigin(0.5);
        pauseBtn.on('pointerdown', () => this.togglePause());
    }
    
    createFullscreenButton() {
        const fsBtn = this.add.rectangle(1200, 40, 40, 40, 0x4a6a3a, 0.8)
            .setStrokeStyle(2, 0x8aba6b)
            .setInteractive({ useHandCursor: true });
        const fsIcon = this.add.text(1200, 40, '⛶', { fontFamily: 'Arial', fontSize: '28px', fill: '#d0e8d0' }).setOrigin(0.5);
        fsBtn.on('pointerdown', () => {
            if(!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
    }
    
    togglePause() {
        const gameScene = this.scene.get('GameScene');
        if(!gameScene || gameScene.gameOver) return;
        this.isPaused = !this.isPaused;
        
        if(this.isPaused) {
            clearInterval(gameScene.moveInterval);
            gameScene.moveInterval = null;
            if(gameScene.bgmInterval) clearInterval(gameScene.bgmInterval);
            
            this.pauseOverlay = this.add.rectangle(640, 360, 400, 150, 0x1a3a1a, 0.95).setStrokeStyle(3, 0x8aba6b);
            this.pauseText = this.add.text(640, 360, 'PAUSED', { fontFamily: '"Courier New", monospace', fontSize: '48px', fill: '#e0f0e0' }).setOrigin(0.5);
            this.pauseIcon.setText('▶');
        } else {
            if(this.pauseOverlay) this.pauseOverlay.destroy();
            if(this.pauseText) this.pauseText.destroy();
            gameScene.startMovement();
            if(gameScene.startBGM) gameScene.startBGM();
            this.pauseIcon.setText('⏸');
        }
    }
    
    showGameOver(score) {
        const overlay = this.add.rectangle(640, 360, 1280, 720, 0x0a1a0a, 0.85);
        const panel = this.add.rectangle(640, 360, 500, 350, 0x2a4a2a).setStrokeStyle(4, 0x8aba6b);
        this.add.text(640, 220, '☠', { fontFamily: 'Arial', fontSize: '64px', fill: '#8a4a4a' }).setOrigin(0.5);
        this.add.text(640, 260, 'GAME OVER', { fontFamily: '"Courier New", monospace', fontSize: '48px', fill: '#e0a0a0', stroke: '#3a1a1a', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(640, 320, `FINAL SCORE: ${score}`, { fontFamily: '"Courier New", monospace', fontSize: '28px', fill: '#d0e8d0' }).setOrigin(0.5);
        
        const level = Math.floor(score / 10) + 1;
        this.add.text(640, 360, `REACHED LEVEL: ${level}`, { fontFamily: '"Courier New", monospace', fontSize: '20px', fill: '#a0c8a0' }).setOrigin(0.5);
        
        const restartBtn = this.add.rectangle(640, 420, 200, 50, 0x4a7a3a).setStrokeStyle(2, 0x8aba6b).setInteractive({ useHandCursor: true });
        const restartText = this.add.text(640, 420, 'RESTART', { fontFamily: '"Courier New", monospace', fontSize: '24px', fill: '#e0f0e0' }).setOrigin(0.5);
        
        restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x6a9e4b));
        restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x4a7a3a));
        restartBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
        
        const menuBtn = this.add.rectangle(640, 490, 200, 50, 0x4a5a3a).setStrokeStyle(2, 0x8aba6b).setInteractive({ useHandCursor: true });
        const menuText = this.add.text(640, 490, 'MAIN MENU', { fontFamily: '"Courier New", monospace', fontSize: '24px', fill: '#e0f0e0' }).setOrigin(0.5);
        
        menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x6a8a4a));
        menuBtn.on('pointerout', () => menuBtn.setFillStyle(0x4a5a3a));
        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop('UIScene');
            this.scene.start('MainMenuScene');
        });
    }
}