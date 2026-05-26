import Snake from '../objects/Snake.js';
import Fruit from '../objects/Fruit.js';
import Obstacle, { flashHitEffect, spawnHitParticles, screenShakeEffect } from '../objects/Obstacle.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');

        this.cellSize   = 32;
        this.gridWidth  = 20;
        this.gridHeight = 20;

        this.snake        = null;
        this.fruit        = null;
        this.obstacles    = [];

        this.score        = 0;
        this.gameOver     = false;
        this.isRespawning = false;
        this.moveInterval = null;
        this.baseSpeed    = 250;
        this.currentSpeed = 250;

        // Time-based spawn settings
        this._spawnTimer = null;           // Timer untuk spawn obstacle
        this._obstacleSpawnDelay = 5000;   // 5 detik antar spawn
        this._maxObstacles = 6;            // Maksimal 6 obstacle di arena
        this._initialSpawnDelay = 2000;    // Delay awal sebelum spawn pertama (2 detik)
    }

    create() {
        // ── Reset state ──────────────────────────────────────────────
        this.score        = 0;
        this.gameOver     = false;
        this.isRespawning = false;
        this.currentSpeed = this.baseSpeed;

        // Hentikan timer lama jika ada
        if (this._spawnTimer) {
            this._spawnTimer.remove();
            this._spawnTimer = null;
        }

        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }

        // Bersihkan obstacle dari sesi sebelumnya
        this._destroyAllObstacles();

        // ── Background ──────────────────────────────────────────────
        this.add.tileSprite(0, 0, 1280, 720, 'grassTile').setOrigin(0, 0);
        this.drawGrid();

        // ── Snake ────────────────────────────────────────────────────
        var startX = Math.floor(this.gridWidth  / 2);
        var startY = Math.floor(this.gridHeight / 2);
        this.snake = new Snake(this, startX, startY, this.gridWidth, this.gridHeight);

        // ── Fruit ────────────────────────────────────────────────────
        this.fruit = new Fruit(this, this.snake);

        // ── Particles ────────────────────────────────────────────────
        this.particles = this.add.particles(0, 0, 'snakeBody', {
            speed:    { min: 50, max: 150 },
            angle:    { min: 0,  max: 360  },
            scale:    { start: 0.5, end: 0  },
            lifespan: 500,
            quantity: 1,
            frequency: -1,
        });

        // ── Input ────────────────────────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys    = this.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            pause: Phaser.Input.Keyboard.KeyCodes.P,
        });

        // ── Events ───────────────────────────────────────────────────
        this.events.off('eat');
        this.events.off('gameover');
        this.events.on('eat',      this.onEat,     this);
        this.events.on('gameover', this.onGameOver, this);

        // ── Mulai loop ───────────────────────────────────────────────
        this.startMovement();
        
        // ── START TIME-BASED SPAWN OBSTACLE ───────────────────────────
        this._startObstacleSpawning();
    }

    // ─────────────────────────────────────────────────────────────────
    //  TIME-BASED OBSTACLE SPAWNING
    // ─────────────────────────────────────────────────────────────────

    _startObstacleSpawning() {
        // Timer untuk spawn obstacle secara berkala
        this._spawnTimer = this.time.addEvent({
            delay: this._obstacleSpawnDelay,
            callback: () => {
                // Cek apakah game belum over dan obstacle belum mencapai batas maksimal
                if (!this.gameOver && this.obstacles.length < this._maxObstacles) {
                    this._spawnObstacle();
                }
            },
            loop: true,
            startDelay: this._initialSpawnDelay // Tunggu 2 detik sebelum spawn pertama
        });
        
        // Optional: Tampilkan teks "Obstacle akan muncul" di awal
        this._showSpawnInfo();
    }
    
    _showSpawnInfo() {
        var infoText = this.add.text(640, 100, '⚠ OBSTACLE COMING SOON ⚠', {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            fill: '#ffaa44',
            stroke: '#331100',
            strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0.8);
        
        this.tweens.add({
            targets: infoText,
            alpha: 0,
            y: 70,
            duration: 2000,
            delay: 1500,
            onComplete: () => infoText.destroy()
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  Grid
    // ─────────────────────────────────────────────────────────────────

    drawGrid() {
        var g = this.add.graphics();
        g.lineStyle(1, 0x3a6a3a, 0.3);
        for (var i = 0; i <= this.gridWidth; i++) {
            g.moveTo(i * this.cellSize, 0);
            g.lineTo(i * this.cellSize, this.gridHeight * this.cellSize);
            g.moveTo(0, i * this.cellSize);
            g.lineTo(this.gridWidth * this.cellSize, i * this.cellSize);
        }
        g.strokePath();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Movement loop
    // ─────────────────────────────────────────────────────────────────

    startMovement() {
        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }
        if (this.gameOver) return;

        var self = this;
        this.moveInterval = setInterval(function() {
            if (!self.gameOver && !self.isRespawning) {
                self.updateMovement();
            }
        }, this.currentSpeed);
    }

    updateMovement() {
        if (this.gameOver) return;

        // ── Baca input arah ──────────────────────────────────────────
        var newDir = null;
        if      (this.cursors.left.isDown  || this.keys.left.isDown)  newDir = 'left';
        else if (this.cursors.right.isDown || this.keys.right.isDown) newDir = 'right';
        else if (this.cursors.up.isDown    || this.keys.up.isDown)    newDir = 'up';
        else if (this.cursors.down.isDown  || this.keys.down.isDown)  newDir = 'down';

        if (newDir) this.snake.setDirection(newDir);

        // ── Gerakkan ular ─────────────────────────────────────────────
        var ate = this.snake.move(this.fruit);
        if (ate) this.events.emit('eat');

        // ── Cek tabrakan dinding / diri sendiri ───────────────────────
        if (this.snake.checkCollision()) {
            this._triggerDeathFX(null);
            this.events.emit('gameover');
            return;
        }

        // ── Tick semua obstacle ───────────────────────────────────────
        for (var i = 0; i < this.obstacles.length; i++) {
            var hit = this.obstacles[i].tick(this.snake);
            if (hit) {
                this._triggerDeathFX(this.obstacles[i]);
                this.events.emit('gameover');
                return;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Eat event (dengan TIME-BASED SPAWN - tidak ada spawn berdasarkan score)
    // ─────────────────────────────────────────────────────────────────

    onEat() {
        this.score++;
        
        // Respawn fruit
        this.fruit.respawn(this.snake);
        
        // Efek visual
        this.createEatEffect();
        this.cameras.main.shake(100, 0.003);
        this.playEatSound();
        
        // Speed up
        this.currentSpeed = Math.max(80, this.baseSpeed - Math.floor(this.score / 5) * 8);
        this.startMovement();
        
        // Update UI
        var uiScene = this.scene.get('UIScene');
        if (uiScene) uiScene.events.emit('updateScore', this.score);
        
        // CATATAN: Obstacle SPAWN sudah ditangani oleh TIMER di _startObstacleSpawning()
        // Tidak perlu spawn obstacle di sini lagi!
    }

    // ─────────────────────────────────────────────────────────────────
    //  Obstacle management
    // ─────────────────────────────────────────────────────────────────

    _spawnObstacle() {
        // Pilih tipe obstacle random
        var types = ['thorn', 'rock'];
        var type  = types[Phaser.Math.Between(0, 1)];
        var obs   = new Obstacle(this, this.gridWidth, this.gridHeight, type);

        // Pastikan tidak spawn di atas snake atau fruit
        var validPosition = false;
        for (var attempt = 0; attempt < 50; attempt++) {
            var cell    = obs.getCell();
            var onSnake = this.snake.getBody().some(function(s) {
                return s.x === cell.x && s.y === cell.y;
            });
            var fp      = this.fruit.getPosition();
            var onFruit = fp.x === cell.x && fp.y === cell.y;
            
            // Cek juga dengan obstacle lain
            var onObstacle = this.obstacles.some(function(o) {
                var oCell = o.getCell();
                return oCell.x === cell.x && oCell.y === cell.y;
            });

            if (!onSnake && !onFruit && !onObstacle) {
                validPosition = true;
                break;
            }

            // Reposisi acak
            obs.gridX = Phaser.Math.Between(2, this.gridWidth  - 3);
            obs.gridY = Phaser.Math.Between(2, this.gridHeight - 3);
            var wx = obs.gridX * this.cellSize + this.cellSize / 2;
            var wy = obs.gridY * this.cellSize + this.cellSize / 2;
            obs.container.x = wx;
            obs.container.y = wy;
        }

        if (validPosition || attempt < 50) {
            this.obstacles.push(obs);
            this._showSpawnWarning(obs);
            
            // Update UI counter
            if (this.scene.get('UIScene')) {
                this.scene.get('UIScene').events.emit('updateObstacles', this.obstacles.length);
            }
        } else {
            // Jika tidak ada posisi valid, destroy obstacle
            obs.destroy();
        }
    }

    /** Ring + label "!" oranye sesaat saat obstacle muncul */
    _showSpawnWarning(obs) {
        var cell = obs.getCell();
        var wx   = cell.x * this.cellSize + this.cellSize / 2;
        var wy   = cell.y * this.cellSize + this.cellSize / 2;

        // Lingkaran peringatan
        var ring = this.add.graphics().setDepth(50);
        ring.lineStyle(3, 0xff8800, 0.9);
        ring.strokeCircle(wx, wy, this.cellSize * 1.3);

        this.tweens.add({
            targets:  ring,
            scaleX:   2.4,
            scaleY:   2.4,
            alpha:    0,
            duration: 650,
            ease:     'Quad.easeOut',
            onComplete: function() { ring.destroy(); },
        });

        // Tanda seru
        var label = this.add.text(wx, wy - 30, '!', {
            fontFamily: '"Courier New", monospace',
            fontSize:   '28px',
            fontStyle:  'bold',
            fill:       '#ff8800',
            stroke:     '#331100',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets:    label,
            y:          wy - 58,
            alpha:      0,
            duration:   700,
            ease:       'Quad.easeOut',
            onComplete: function() { label.destroy(); },
        });
        
        // Efek getaran ringan di obstacle
        this.tweens.add({
            targets: obs.container,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 100,
            yoyo: true,
            ease: 'Back.out'
        });
    }

    _destroyAllObstacles() {
        this.obstacles.forEach(function(o) { 
            if (o.destroy) o.destroy(); 
        });
        this.obstacles = [];
        
        // Hentikan timer spawn
        if (this._spawnTimer) {
            this._spawnTimer.remove();
            this._spawnTimer = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  Death effects
    // ─────────────────────────────────────────────────────────────────

    _triggerDeathFX(hitObstacle) {
        var head = this.snake.getBody()[0];
        var wx   = head.x * this.cellSize + this.cellSize / 2;
        var wy   = head.y * this.cellSize + this.cellSize / 2;

        screenShakeEffect(this, 0.018, 420);
        flashHitEffect(this);
        spawnHitParticles(this, wx, wy, 18);

        // Partikel ekstra di posisi obstacle yang ditabrak
        if (hitObstacle) {
            var cell = hitObstacle.getCell();
            spawnHitParticles(
                this,
                cell.x * this.cellSize + this.cellSize / 2,
                cell.y * this.cellSize + this.cellSize / 2,
                12
            );
            // Pop scale pada obstacle
            this.tweens.add({
                targets:  hitObstacle.container,
                scaleX:   1.9,
                scaleY:   1.9,
                duration: 120,
                yoyo:     true,
                ease:     'Back.out',
            });
        }

        // Micro zoom pulse
        var cam = this.cameras.main;
        this.tweens.add({
            targets:  cam,
            zoom:     1.05,
            duration: 110,
            yoyo:     true,
            ease:     'Quad.easeInOut',
        });

        // Chromatic aberration tipis (flash biru di atas)
        var self = this;
        this.time.delayedCall(80, function() {
            var w = cam.width, h = cam.height;
            var split = self.add.rectangle(w / 2, h / 2, w, h, 0x0033ff)
                .setDepth(998).setAlpha(0).setScrollFactor(0)
                .setBlendMode(Phaser.BlendModes.ADD);
            self.tweens.add({
                targets:    split,
                alpha:      { from: 0.09, to: 0 },
                duration:   220,
                onComplete: function() { split.destroy(); },
            });
        });

        this._playDeathSound();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Game over / restart
    // ─────────────────────────────────────────────────────────────────

    onGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;

        // Hentikan timer spawn obstacle
        if (this._spawnTimer) {
            this._spawnTimer.remove();
            this._spawnTimer = null;
        }

        if (this.moveInterval) {
            clearInterval(this.moveInterval);
            this.moveInterval = null;
        }

        var currentHigh = parseInt(localStorage.getItem('snakeHighScore') || '0');
        if (this.score > currentHigh) {
            localStorage.setItem('snakeHighScore', this.score);
        }

        var uiScene = this.scene.get('UIScene');
        if (uiScene) uiScene.showGameOver(this.score);
    }

    restartGame() {
        this.isRespawning = true;

        this._destroyAllObstacles();

        if (this.snake) this.snake.destroy();
        if (this.fruit && this.fruit.sprite) this.fruit.sprite.destroy();

        var self = this;
        this.children.list.forEach(function(child) {
            if (child && child.type !== 'TileSprite' && child.destroy && child !== self.cameras.main) {
                child.destroy();
            }
        });

        this.create();
        this.isRespawning = false;
    }

    // ─────────────────────────────────────────────────────────────────
    //  Phaser update (per-frame)
    // ─────────────────────────────────────────────────────────────────

    update() {
        if (this.gameOver) return;

        if (this.fruit) this.fruit.update();

        // Update visual shimmer obstacle
        this.obstacles.forEach(function(o) { 
            if (o.updateVisual) o.updateVisual(); 
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  Eat effect visual
    // ─────────────────────────────────────────────────────────────────

    createEatEffect() {
        if (!this.fruit) return;
        var pos = this.fruit.getPosition();
        if (!pos) return;

        var worldX = pos.x * this.cellSize + this.cellSize / 2;
        var worldY = pos.y * this.cellSize + this.cellSize / 2;

        for (var i = 0; i < 12; i++) {
            var particle = this.add.rectangle(worldX, worldY, 3, 3, 0xff6060);
            this.tweens.add({
                targets:    particle,
                x:          worldX + (Math.random() - 0.5) * 60,
                y:          worldY + (Math.random() - 0.5) * 60,
                alpha:      0,
                scale:      0,
                duration:   400,
                onComplete: function() { particle.destroy(); },
            });
        }

        var scoreText = this.add.text(worldX, worldY - 20, '+1', {
            fontFamily: '"Courier New", monospace',
            fontSize:   '24px',
            fill:       '#ffe0a0',
        }).setOrigin(0.5);

        this.tweens.add({
            targets:    scoreText,
            y:          worldY - 60,
            alpha:      0,
            duration:   600,
            onComplete: function() { scoreText.destroy(); },
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  Audio
    // ─────────────────────────────────────────────────────────────────

    _getCtx() {
        try {
            if (!this.game.audioContext) {
                this.game.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            var ctx = this.game.audioContext;
            if (ctx.state === 'suspended') {
                // Resume saat user pertama kali interaksi
                window.addEventListener('click', function resumeAudio() {
                    ctx.resume();
                    window.removeEventListener('click', resumeAudio);
                }, { once: true });
            }
            return ctx;
        } catch (e) {
            return null;
        }
    }

    playEatSound() {
        var ctx = this._getCtx();
        if (!ctx) return;

        var notes = [[880, 0], [1100, 0.07], [1320, 0.13]];
        notes.forEach(function(n) {
            var osc = ctx.createOscillator();
            var g   = ctx.createGain();
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
        var ctx = this._getCtx();
        if (!ctx) return;

        var notes = [
            [220, 0,    'sawtooth', 0.15],
            [165, 0.12, 'sawtooth', 0.18],
            [110, 0.26, 'square',   0.15],
            [82,  0.42, 'square',   0.20],
        ];
        notes.forEach(function(n) {
            var osc = ctx.createOscillator();
            var g   = ctx.createGain();
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
}