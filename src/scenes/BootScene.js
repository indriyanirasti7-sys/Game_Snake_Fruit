export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create canvas-generated pixel assets
        this.createPixelAssets();
        
        // Load sound effects (using Web Audio API - generate retro sounds)
        this.createAudioAssets();
    }

    createPixelAssets() {
        // Snake head pixel art
        const snakeHeadCanvas = document.createElement('canvas');
        snakeHeadCanvas.width = 32;
        snakeHeadCanvas.height = 32;
        const ctx = snakeHeadCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        
        // Draw pixel snake head
        ctx.fillStyle = '#6a9e4b';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#4a7a2b';
        ctx.fillRect(4, 4, 24, 24);
        ctx.fillStyle = '#2a5a1b';
        ctx.fillRect(8, 12, 6, 6);
        ctx.fillRect(18, 12, 6, 6);
        ctx.fillStyle = '#1a3a0a';
        ctx.fillRect(10, 20, 12, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 14, 2, 2);
        ctx.fillRect(20, 14, 2, 2);
        
        this.textures.addCanvas('snakeHead', snakeHeadCanvas);
        
        // Snake body pixel art
        const snakeBodyCanvas = document.createElement('canvas');
        snakeBodyCanvas.width = 32;
        snakeBodyCanvas.height = 32;
        const ctx2 = snakeBodyCanvas.getContext('2d');
        ctx2.fillStyle = '#6a9e4b';
        ctx2.fillRect(0, 0, 32, 32);
        ctx2.fillStyle = '#4a7a2b';
        ctx2.fillRect(6, 6, 20, 20);
        ctx2.fillStyle = '#3a6a1b';
        ctx2.fillRect(12, 12, 8, 8);
        
        this.textures.addCanvas('snakeBody', snakeBodyCanvas);
        
        // Apple fruit pixel art
        const appleCanvas = document.createElement('canvas');
        appleCanvas.width = 32;
        appleCanvas.height = 32;
        const ctx3 = appleCanvas.getContext('2d');
        ctx3.fillStyle = '#c94040';
        ctx3.fillRect(0, 0, 32, 32);
        ctx3.fillStyle = '#8a2020';
        ctx3.fillRect(8, 8, 16, 16);
        ctx3.fillStyle = '#5a1010';
        ctx3.fillRect(12, 6, 8, 4);
        ctx3.fillStyle = '#2a6a1a';
        ctx3.fillRect(14, 4, 4, 4);
        ctx3.fillStyle = '#e06060';
        ctx3.fillRect(10, 10, 4, 4);
        ctx3.fillRect(18, 10, 4, 4);
        
        this.textures.addCanvas('apple', appleCanvas);
        
        // Grass tile pattern
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 64;
        grassCanvas.height = 64;
        const ctx4 = grassCanvas.getContext('2d');
        ctx4.fillStyle = '#2a5a2a';
        ctx4.fillRect(0, 0, 64, 64);
        for(let i = 0; i < 30; i++) {
            ctx4.fillStyle = `rgba(30, 70, 30, ${Math.random() * 0.3})`;
            ctx4.fillRect(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64), 2, 2);
        }
        
        this.textures.addCanvas('grassTile', grassCanvas);
    }

    createAudioAssets() {
        // Store audio contexts for later use
        this.game.audioContext = null;
        this.game.sounds = {};
    }

    create() {
        this.scene.start('MainMenuScene');
    }
}