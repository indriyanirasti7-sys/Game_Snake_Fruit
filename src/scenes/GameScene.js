import Snake from '../objects/Snake.js';
import Fruit from '../objects/Fruit.js';
import Obstacle, { flashHitEffect, spawnHitParticles, screenShakeEffect } from '../objects/Obstacle.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        this.cellSize   = 28;
        this.gridWidth  = 20;
        this.gridHeight = 20;
        
        this.arenaWidth = this.gridWidth * this.cellSize;
        this.arenaHeight = this.gridHeight * this.cellSize;
        this.offsetX = (1280 - this.arenaWidth) / 2;
        this.offsetY = (720 - this.arenaHeight) / 2;

        this.snake        = null;
        this.fruit        = null;
        this.goldenFruit  = null;
        this.obstacles    = [];

        this.score        = 0;
        this.level        = 1;
        this.gameOver     = false;
        this.isRespawning = false;
        this.moveInterval = null;
        this.baseSpeed    = 200;
        this.currentSpeed = 200;

        this.goldenFruitActive = false;
        this.goldenFruitTimer = null;
        this.nextGoldenAt = 10;
        
        this._spawnTimer = null;
        this._obstacleSpawnDelay = 5000;
        this._maxObstacles = 6;
        this._initialSpawnDelay = 3000;
        this._obstacleSpawnCount = 1;
        
        this.swooshSound = null;
    }

    create() {
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isRespawning = false;
        this.currentSpeed = this.baseSpeed;
        this.nextGoldenAt = 10;
        this._obstacleSpawnCount = 1;
        this._maxObstacles = 6;
        
        if (this._spawnTimer) this._spawnTimer.remove();
        if (this.moveInterval) clearInterval(this.moveInterval);
        if (this.goldenFruitTimer) this.goldenFruitTimer.remove();
        
        this._destroyAllObstacles();
        if (this.goldenFruit) this.goldenFruit.destroy();

        this.add.rectangle(0, 0, 1280, 720, 0x0a1a0a).setOrigin(0, 0);
        
        this.createArena();
        
        this.arenaBg = this.add.tileSprite(this.offsetX, this.offsetY, this.arenaWidth, this.arenaHeight, 'grassTile').setOrigin(0, 0);
        this.drawGrid();
        
        var startX = Math.floor(this.gridWidth / 2);
        var startY = Math.floor(this.gridHeight / 2);
        this.snake = new Snake(this, startX, startY, this.gridWidth, this.gridHeight, this.offsetX, this.offsetY, this.cellSize);
        
        this.trailPositions = [];
        this.trailSprites = [];
        for(let i = 0; i < 8; i++) {
            const trail = this.add.rectangle(0, 0, this.cellSize - 4, this.cellSize - 4, 0x4a7a2b, 0.2);
            trail.setVisible(false);
            this.trailSprites.push(trail);
        }
        
        this.fruit = new Fruit(this, this.snake, this.offsetX, this.offsetY, this.cellSize);
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            pause: Phaser.Input.Keyboard.KeyCodes.P,
        });
        
        this.events.off('eat');
        this.events.off('gameover');
        this.events.on('eat', this.onEat, this);
        this.events.on('gameover', this.onGameOver, this);
        
        this.startMovement();
        this._startObstacleSpawning();
        this.startBGM();
    }
    
    createArena() {
        const borderWidth = 12;
        const outerX = this.offsetX - borderWidth;
        const outerY = this.offsetY - borderWidth;
        const outerW = this.arenaWidth + borderWidth * 2;
        const outerH = this.arenaHeight + borderWidth * 2;
        
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.4);
        shadow.fillRoundedRect(outerX + 6, outerY + 6, outerW, outerH, 12);
        
        const woodBg = this.add.graphics();
        woodBg.fillStyle(0x8B6914, 1);
        woodBg.fillRoundedRect(outerX, outerY, outerW, outerH, 12);
        
        for(let i = 0; i < 20; i++) {
            const grain = this.add.graphics();
            grain.fillStyle(0x6B4E14, 0.4);
            grain.fillRect(outerX + 3 + i * 8, outerY + 3, 2, outerH - 6);
            grain.fillRect(outerX + 3, outerY + 3 + i * 8, outerW - 6, 2);
        }
        
        const innerBorder = this.add.graphics();
        innerBorder.fillStyle(0x1a3a1a, 1);
        innerBorder.fillRoundedRect(this.offsetX - 3, this.offsetY - 3, this.arenaWidth + 6, this.arenaHeight + 6, 6);
        
        const arenaBorder = this.add.graphics();
        arenaBorder.lineStyle(3, 0x8B3A3A, 0.9);
        arenaBorder.strokeRoundedRect(this.offsetX - 2, this.offsetY - 2, this.arenaWidth + 4, this.arenaHeight + 4, 4);
        arenaBorder.lineStyle(1, 0xC8E8C8, 0.5);
        arenaBorder.strokeRoundedRect(this.offsetX, this.offsetY, this.arenaWidth, this.arenaHeight, 2);
        
        const cornerSize = 12;
        const corners = [
            [this.offsetX - 6, this.offsetY - 6],
            [this.offsetX + this.arenaWidth - 6, this.offsetY - 6],
            [this.offsetX - 6, this.offsetY + this.arenaHeight - 6],
            [this.offsetX + this.arenaWidth - 6, this.offsetY + this.arenaHeight - 6]
        ];
        corners.forEach(pos => {
            const corner = this.add.graphics();
            corner.fillStyle(0x5a8a3a, 0.9);
            corner.fillRect(pos[0], pos[1], cornerSize, cornerSize);
            corner.fillStyle(0x8aba6b, 0.6);
            corner.fillRect(pos[0] + 3, pos[1] + 3, 6, 6);
            corner.fillStyle(0xffcc44, 0.8);
            corner.fillRect(pos[0] + 5, pos[1] + 5, 2, 2);
        });
        
        // ============================================================
        // TEKS DI ATAS KOTAK ARENA
        // ============================================================
        
        // Panel background untuk teks
        const textPanel = this.add.graphics();
        textPanel.fillStyle(0x1a3a1a, 0.85);
        textPanel.fillRoundedRect(this.offsetX - 5, this.offsetY - 38, this.arenaWidth + 10, 34, 6);
        textPanel.lineStyle(1, 0x8aba6b, 0.6);
        textPanel.strokeRoundedRect(this.offsetX - 5, this.offsetY - 38, this.arenaWidth + 10, 34, 6);
        
        // SCORE di kiri
        this.arenaScoreText = this.add.text(
            this.offsetX + 15, 
            this.offsetY - 24,
            `SCORE: ${this.score}`, {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px',
            fill: '#c8e8c8',
            stroke: '#1a3a1a',
            strokeThickness: 2
        });
        
        // LEVEL di tengah
        this.levelText = this.add.text(
            this.offsetX + this.arenaWidth / 2, 
            this.offsetY - 24,
            `LEVEL: ${this.level}`, {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px',
            fill: '#ffcc44',
            stroke: '#1a3a1a',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // BEST di kanan
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        this.arenaHighScoreText = this.add.text(
            this.offsetX + this.arenaWidth - 15, 
            this.offsetY - 24,
            `BEST: ${highScore}`, {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px',
            fill: '#c8e8c8',
            stroke: '#1a3a1a',
            strokeThickness: 2
        }).setOrigin(1, 0);
    }
    
    drawGrid() {
        const g = this.add.graphics();
        g.lineStyle(1, 0x4a7a4a, 0.3);
        for(let i = 0; i <= this.gridWidth; i++) {
            g.moveTo(this.offsetX + i * this.cellSize, this.offsetY);
            g.lineTo(this.offsetX + i * this.cellSize, this.offsetY + this.arenaHeight);
            g.moveTo(this.offsetX, this.offsetY + i * this.cellSize);
            g.lineTo(this.offsetX + this.arenaWidth, this.offsetY + i * this.cellSize);
        }
        g.strokePath();
    }
    
    updateArenaUI() {
        if(this.arenaScoreText) this.arenaScoreText.setText(`SCORE: ${this.score}`);
        if(this.levelText) this.levelText.setText(`LEVEL: ${this.level}`);
        const highScore = localStorage.getItem('snakeHighScore') || 0;
        if(this.arenaHighScoreText) this.arenaHighScoreText.setText(`BEST: ${highScore}`);
    }
    
    updateTrail() {
        const head = this.snake.body[0];
        if(!head) return;
        
        this.trailPositions.unshift({ x: head.x, y: head.y });
        if(this.trailPositions.length > 8) this.trailPositions.pop();
        
        for(let i = 0; i < this.trailSprites.length; i++) {
            const pos = this.trailPositions[i];
            if(pos && i < this.trailPositions.length - 1) {
                this.trailSprites[i].setPosition(
                    this.offsetX + pos.x * this.cellSize + this.cellSize/2,
                    this.offsetY + pos.y * this.cellSize + this.cellSize/2
                );
                this.trailSprites[i].setVisible(true);
                this.trailSprites[i].setAlpha(0.15 - i * 0.015);
            } else {
                this.trailSprites[i].setVisible(false);
            }
        }
    }
    
    _startObstacleSpawning() {
        this._spawnTimer = this.time.addEvent({
            delay: this._obstacleSpawnDelay,
            callback: () => {
                if(!this.gameOver && this.obstacles.length < this._maxObstacles) {
                    this._spawnObstacleWithWarning();
                }
            },
            loop: true,
            startDelay: this._initialSpawnDelay
        });
    }
    
    async _spawnObstacleWithWarning() {
        let spawnCount = this._obstacleSpawnCount;
        if(this.score >= 20) spawnCount = 2;
        if(this.score >= 40) spawnCount = 3;
        
        for(let i = 0; i < spawnCount; i++) {
            let spawnX, spawnY;
            let valid = false;
            let attempts = 0;
            
            while(!valid && attempts < 30) {
                spawnX = Phaser.Math.Between(2, this.gridWidth - 3);
                spawnY = Phaser.Math.Between(2, this.gridHeight - 3);
                
                let collision = false;
                if(this.snake.getBody().some(s => s.x === spawnX && s.y === spawnY)) collision = true;
                const fp = this.fruit.getPosition();
                if(fp.x === spawnX && fp.y === spawnY) collision = true;
                if(this.obstacles.some(o => o.getCell().x === spawnX && o.getCell().y === spawnY)) collision = true;
                if(this.goldenFruitActive && this.goldenFruit.position && this.goldenFruit.position.x === spawnX && this.goldenFruit.position.y === spawnY) collision = true;
                
                if(!collision) valid = true;
                attempts++;
            }
            
            if(valid) {
                await this._showPreSpawnWarning(spawnX, spawnY);
                
                const types = ['thorn', 'rock'];
                const type = types[Phaser.Math.Between(0, 1)];
                const obs = new Obstacle(this, this.gridWidth, this.gridHeight, type, this.offsetX, this.offsetY, this.cellSize);
                obs.gridX = spawnX;
                obs.gridY = spawnY;
                obs.container.x = this.offsetX + spawnX * this.cellSize + this.cellSize/2;
                obs.container.y = this.offsetY + spawnY * this.cellSize + this.cellSize/2;
                this.obstacles.push(obs);
                
                this._playSwooshSound();
            }
        }
    }
    
    _showPreSpawnWarning(x, y) {
        return new Promise((resolve) => {
            const wx = this.offsetX + x * this.cellSize + this.cellSize/2;
            const wy = this.offsetY + y * this.cellSize + this.cellSize/2;
            
            const warning = this.add.graphics();
            let blinkCount = 0;
            let blinkInterval = this.time.addEvent({
                delay: 150,
                callback: () => {
                    warning.clear();
                    if(blinkCount % 2 === 0) {
                        warning.fillStyle(0xff3300, 0.4);
                        warning.fillRect(wx - this.cellSize/2, wy - this.cellSize/2, this.cellSize, this.cellSize);
                    }
                    blinkCount++;
                    if(blinkCount >= 6) {
                        blinkInterval.remove();
                        warning.destroy();
                        resolve();
                    }
                },
                repeat: 5
            });
        });
    }
    
    _spawnGoldenFruit() {
        if(this.goldenFruitActive) return;
        
        const available = [];
        for(let i = 0; i < this.gridWidth; i++) {
            for(let j = 0; j < this.gridHeight; j++) {
                let collision = this.snake.getBody().some(s => s.x === i && s.y === j);
                const fp = this.fruit.getPosition();
                if(fp.x === i && fp.y === j) collision = true;
                if(this.obstacles.some(o => o.getCell().x === i && o.getCell().y === j)) collision = true;
                if(!collision) available.push({ x: i, y: j });
            }
        }
        
        if(available.length > 0) {
            const pos = available[Math.floor(Math.random() * available.length)];
            this.goldenFruit = this.add.sprite(
                this.offsetX + pos.x * this.cellSize + this.cellSize/2,
                this.offsetY + pos.y * this.cellSize + this.cellSize/2,
                'apple'
            );
            this.goldenFruit.setTint(0xffaa33);
            this.goldenFruit.setDisplaySize(this.cellSize - 4, this.cellSize - 4);
            this.goldenFruit.position = pos;
            this.goldenFruitActive = true;
            
            this.tweens.add({
                targets: this.goldenFruit,
                angle: 360,
                duration: 2000,
                repeat: -1
            });
            
            this.goldenFruitTimer = this.time.delayedCall(5000, () => {
                if(this.goldenFruit) {
                    this.goldenFruit.destroy();
                    this.goldenFruitActive = false;
                }
            });
            
            const notify = this.add.text(this.offsetX + this.arenaWidth/2, this.offsetY - 45, '✨ GOLDEN APPLE! ✨', {
                fontFamily: '"Courier New", monospace',
                fontSize: '14px',
                fill: '#ffcc44',
                stroke: '#331100',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.tweens.add({
                targets: notify,
                alpha: 0,
                y: notify.y - 20,
                duration: 1500,
                onComplete: () => notify.destroy()
            });
        }
    }
    
    _collectGoldenFruit() {
        this._destroyAllObstacles();
        this.score += 5;
        this.updateArenaUI();
        
        const uiScene = this.scene.get('UIScene');
        if(uiScene) uiScene.events.emit('updateScore', this.score);
        
        for(let i = 0; i < 30; i++) {
            const particle = this.add.rectangle(this.goldenFruit.x, this.goldenFruit.y, 4, 4, 0xffcc44);
            this.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 100,
                y: particle.y + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
        
        const bonusText = this.add.text(this.goldenFruit.x, this.goldenFruit.y - 30, '+5 & CLEAR!', {
            fontFamily: '"Courier New", monospace',
            fontSize: '16px',
            fill: '#ffcc44'
        }).setOrigin(0.5);
        this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => bonusText.destroy()
        });
        
        this.goldenFruit.destroy();
        this.goldenFruitActive = false;
        if(this.goldenFruitTimer) this.goldenFruitTimer.remove();
        
        this.playEatSound();
    }
    
    startMovement() {
        if(this.moveInterval) clearInterval(this.moveInterval);
        if(this.gameOver) return;
        
        this.moveInterval = setInterval(() => {
            if(!this.gameOver && !this.isRespawning) {
                this.updateMovement();
            }
        }, this.currentSpeed);
    }
    
    updateMovement() {
        if(this.gameOver) return;
        
        let newDir = null;
        if(this.cursors.left.isDown || this.keys.left.isDown) newDir = 'left';
        else if(this.cursors.right.isDown || this.keys.right.isDown) newDir = 'right';
        else if(this.cursors.up.isDown || this.keys.up.isDown) newDir = 'up';
        else if(this.cursors.down.isDown || this.keys.down.isDown) newDir = 'down';
        
        if(newDir) this.snake.setDirection(newDir);
        
        const ate = this.snake.move(this.fruit);
        if(ate) this.events.emit('eat');
        
        if(this.goldenFruitActive && this.goldenFruit) {
            const head = this.snake.getBody()[0];
            if(head.x === this.goldenFruit.position.x && head.y === this.goldenFruit.position.y) {
                this._collectGoldenFruit();
            }
        }
        
        this.updateTrail();
        
        if(this.snake.checkCollision()) {
            this._triggerDeathFX(null);
            this.events.emit('gameover');
            return;
        }
        
        for(let i = 0; i < this.obstacles.length; i++) {
            if(this.obstacles[i].tick(this.snake)) {
                this._triggerDeathFX(this.obstacles[i]);
                this.events.emit('gameover');
                return;
            }
        }
    }
    
    onEat() {
        this.score++;
        this.updateArenaUI();
        
        const newLevel = Math.floor(this.score / 10) + 1;
        if(newLevel > this.level) {
            this.level = newLevel;
            this.levelUp();
        }
        
        this.fruit.respawn(this.snake);
        this.createEatEffect();
        this.cameras.main.shake(100, 0.003);
        this.playEatSound();
        
        this.currentSpeed = Math.max(80, this.baseSpeed - (this.level - 1) * 6);
        this.startMovement();
        
        const uiScene = this.scene.get('UIScene');
        if(uiScene) uiScene.events.emit('updateScore', this.score);
        
        if(this.score >= this.nextGoldenAt) {
            this._spawnGoldenFruit();
            this.nextGoldenAt += 15;
        }
        
        if(this.level >= 3 && this._maxObstacles < 4) this._maxObstacles = 4;
        if(this.level >= 5 && this._maxObstacles < 5) this._maxObstacles = 5;
        if(this.level >= 7 && this._maxObstacles < 6) this._maxObstacles = 6;
    }
    
    levelUp() {
        const textY = this.offsetY + 60;
        
        const levelUpText = this.add.text(
            this.offsetX + this.arenaWidth/2, 
            textY,
            `⚡ LEVEL ${this.level}! ⚡`, {
            fontFamily: '"Courier New", monospace',
            fontSize: '32px',
            fill: '#ffcc44',
            stroke: '#331100',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 0, fill: true }
        }).setOrigin(0.5);
        
        levelUpText.setScale(0.5);
        levelUpText.setAlpha(0);
        
        this.tweens.add({
            targets: levelUpText,
            scale: 1.2,
            alpha: 1,
            duration: 200,
            ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: levelUpText,
                    scale: 1,
                    alpha: 0,
                    duration: 600,
                    delay: 500,
                    onComplete: () => levelUpText.destroy()
                });
            }
        });
        
        if(this.levelText) this.levelText.setText(`LEVEL: ${this.level}`);
        this._playLevelUpSound();
    }
    
    _destroyAllObstacles() {
        this.obstacles.forEach(o => { if(o.destroy) o.destroy(); });
        this.obstacles = [];
    }
    
    _triggerDeathFX(hitObstacle) {
        const head = this.snake.getBody()[0];
        const wx = this.offsetX + head.x * this.cellSize + this.cellSize/2;
        const wy = this.offsetY + head.y * this.cellSize + this.cellSize/2;
        
        screenShakeEffect(this, 0.018, 420);
        flashHitEffect(this);
        spawnHitParticles(this, wx, wy, 18);
        
        if(hitObstacle) {
            const cell = hitObstacle.getCell();
            spawnHitParticles(this, this.offsetX + cell.x * this.cellSize + this.cellSize/2, this.offsetY + cell.y * this.cellSize + this.cellSize/2, 12);
        }
        
        this._playDeathSound();
    }
    
    onGameOver() {
        if(this.gameOver) return;
        this.gameOver = true;
        
        if(this._spawnTimer) this._spawnTimer.remove();
        if(this.moveInterval) clearInterval(this.moveInterval);
        if(this.goldenFruitTimer) this.goldenFruitTimer.remove();
        if(this.bgmInterval) clearInterval(this.bgmInterval);
        
        const currentHigh = parseInt(localStorage.getItem('snakeHighScore') || '0');
        if(this.score > currentHigh) localStorage.setItem('snakeHighScore', this.score);
        
        const uiScene = this.scene.get('UIScene');
        if(uiScene) uiScene.showGameOver(this.score);
    }
    
    startBGM() {
        let bgmNote = 0;
        const notes = [262, 294, 330, 349, 392, 440, 494, 523];
        
        this.bgmInterval = setInterval(() => {
            if(this.gameOver) return;
            const ctx = this._getCtx();
            if(!ctx) return;
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.value = notes[bgmNote % notes.length] * 0.5;
            gain.gain.value = 0.02;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            osc.stop(ctx.currentTime + 0.4);
            bgmNote = (bgmNote + 1) % notes.length;
        }, 500);
    }
    
    _playSwooshSound() {
        const ctx = this._getCtx();
        if(!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = 400;
        gain.gain.value = 0.05;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.stop(ctx.currentTime + 0.15);
    }
    
    _playLevelUpSound() {
        const ctx = this._getCtx();
        if(!ctx) return;
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.value = 0.08;
            osc.start(ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.1 + 0.2);
            osc.stop(ctx.currentTime + i * 0.1 + 0.2);
        });
    }
    
    _getCtx() {
        try {
            if(!this.game.audioContext) {
                this.game.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this.game.audioContext;
            if(ctx.state === 'suspended') {
                window.addEventListener('click', () => ctx.resume(), { once: true });
            }
            return ctx;
        } catch(e) { return null; }
    }
    
    playEatSound() {
        const ctx = this._getCtx();
        if(!ctx) return;
        const notes = [[880, 0], [1100, 0.07], [1320, 0.13]];
        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.value = n[0];
            g.gain.setValueAtTime(0.08, ctx.currentTime + n[1]);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n[1] + 0.12);
            osc.start(ctx.currentTime + n[1]);
            osc.stop(ctx.currentTime + n[1] + 0.18);
        });
    }
    
    _playDeathSound() {
        const ctx = this._getCtx();
        if(!ctx) return;
        const notes = [[220, 0, 'sawtooth', 0.15], [165, 0.12, 'sawtooth', 0.18], [110, 0.26, 'square', 0.15], [82, 0.42, 'square', 0.20]];
        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.type = n[2];
            osc.frequency.value = n[0];
            g.gain.setValueAtTime(0.1, ctx.currentTime + n[1]);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + n[1] + n[3]);
            osc.start(ctx.currentTime + n[1]);
            osc.stop(ctx.currentTime + n[1] + n[3] + 0.05);
        });
    }
    
    createEatEffect() {
        if(!this.fruit) return;
        const pos = this.fruit.getPosition();
        if(!pos) return;
        
        const worldX = this.offsetX + pos.x * this.cellSize + this.cellSize/2;
        const worldY = this.offsetY + pos.y * this.cellSize + this.cellSize/2;
        
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
        
        const scoreText = this.add.text(worldX, worldY - 20, '+1', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            fill: '#ffe0a0'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: scoreText,
            y: worldY - 50,
            alpha: 0,
            duration: 600,
            onComplete: () => scoreText.destroy()
        });
    }
    
    update() {
        if(this.gameOver) return;
        if(this.fruit) this.fruit.update();
        if(this.goldenFruit && this.goldenFruitActive) {
            this.goldenFruit.y = this.offsetY + this.goldenFruit.position.y * this.cellSize + this.cellSize/2 + Math.sin(Date.now() * 0.005) * 3;
        }
        this.obstacles.forEach(o => { if(o.updateVisual) o.updateVisual(); });
    }
}