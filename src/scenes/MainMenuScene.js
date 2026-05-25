export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this.isHovering = false;
    }

    create() {
        // Background with subtle animation
        this.add.tileSprite(0, 0, 1280, 720, 'grassTile').setOrigin(0, 0);
        
        // Pixelated title with handmade look
        const title = this.add.text(640, 180, 'PIXEL SNAKE', {
            fontFamily: '"Courier New", "VT323", monospace',
            fontSize: '72px',
            fill: '#c8e8c8',
            stroke: '#2a4a2a',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#1a3a1a', blur: 0, fill: true }
        }).setOrigin(0.5);
        
        // Subtle title animation
        this.tweens.add({
            targets: title,
            y: '+=5',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Draw pixel snake decoration
        this.createSnakeDecoration();
        
        // Menu buttons with pixel style
        this.createButton(640, 380, 'START GAME', () => this.startGame());
        this.createButton(640, 460, 'HOW TO PLAY', () => this.showInstructions());
        
        // High score display
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        this.add.text(640, 560, `BEST: ${highScore}`, {
            fontFamily: '"Courier New", monospace',
            fontSize: '28px',
            fill: '#b8d8b8',
            stroke: '#1a3a1a',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Floating pixel particles
        this.createFloatingParticles();
    }
    
    createSnakeDecoration() {
        const snakeLength = 8;
        const startX = 200;
        const startY = 640;
        
        for(let i = 0; i < snakeLength; i++) {
            const segment = this.add.rectangle(startX + i * 28, startY + Math.sin(i * 0.8) * 8, 24, 24, 0x6a9e4b);
            segment.setStrokeStyle(2, 0x4a7a2b);
            
            if(i === 0) {
                segment.setFillStyle(0x8aba6b);
                // Add eyes
                this.add.circle(startX + i * 28 - 6, startY + Math.sin(i * 0.8) * 8 - 6, 3, 0xffffff);
                this.add.circle(startX + i * 28 + 6, startY + Math.sin(i * 0.8) * 8 - 6, 3, 0xffffff);
            }
        }
    }
    
    createFloatingParticles() {
        for(let i = 0; i < 20; i++) {
            const particle = this.add.rectangle(Math.random() * 1280, Math.random() * 720, 2, 2, 0x8aba6b);
            this.tweens.add({
                targets: particle,
                y: particle.y - 20,
                x: particle.x + (Math.random() - 0.5) * 30,
                alpha: 0,
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                delay: Math.random() * 3000,
                onComplete: () => {
                    particle.y = 720;
                    particle.x = Math.random() * 1280;
                    particle.alpha = 1;
                }
            });
        }
    }
    
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        const bg = this.add.rectangle(0, 0, 260, 54, 0x4a7a3a)
            .setStrokeStyle(3, 0x8aba6b);
        
        const label = this.add.text(0, 0, text, {
            fontFamily: '"Courier New", monospace',
            fontSize: '28px',
            fill: '#e8f0e8'
        }).setOrigin(0.5);
        
        button.add([bg, label]);
        button.setSize(260, 54);
        
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x6a9e4b);
                this.tweens.add({
                    targets: button,
                    scale: 1.05,
                    duration: 100,
                    ease: 'Back.out'
                });
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x4a7a3a);
                button.setScale(1);
            })
            .on('pointerdown', callback);
        
        return button;
    }
    
    startGame() {
        this.scene.start('GameScene');
        this.scene.start('UIScene');
        this.scene.stop('MainMenuScene');
    }
    
    showInstructions() {
        const panel = this.add.rectangle(640, 360, 600, 400, 0x2a4a2a, 0.95)
            .setStrokeStyle(4, 0x8aba6b);
        
        const closeBtn = this.createButton(640, 540, 'CLOSE', () => panel.destroy());
        
        const instructions = [
            'CONTROLS:',
            'WASD or Arrow Keys to move',
            '',
            'RULES:',
            'Eat apples to grow',
            'Avoid walls and yourself',
            'Speed increases with score',
            '',
            'Press P to pause',
            'Press F for fullscreen'
        ];
        
        let yPos = 220;
        instructions.forEach(line => {
            this.add.text(640, yPos, line, {
                fontFamily: '"Courier New", monospace',
                fontSize: line === 'CONTROLS:' || line === 'RULES:' ? '24px' : '18px',
                fill: '#d0e8d0',
                align: 'center'
            }).setOrigin(0.5);
            yPos += 30;
        });
    }
}