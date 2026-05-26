/**
 * Obstacle.js
 * Moving obstacle untuk Pixel Snake game.
 * Letakkan di: src/objects/Obstacle.js
 *
 * Export utama  : class Obstacle (default)
 * Export helper : flashHitEffect, spawnHitParticles, screenShakeEffect
 */

export default class Obstacle {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} gridWidth   jumlah cell horizontal
     * @param {number} gridHeight  jumlah cell vertikal
     * @param {'thorn'|'rock'} type  varian visual
     */
    constructor(scene, gridWidth, gridHeight, type) {
        this.scene      = scene;
        this.gridWidth  = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize   = 32;
        this.type       = type || 'thorn';

        // Posisi grid (integer)
        this.gridX = Phaser.Math.Between(3, gridWidth  - 4);
        this.gridY = Phaser.Math.Between(3, gridHeight - 4);

        // Arah gerak: salah satu dari empat arah cardinal
        const dirs = [
            { dx:  1, dy:  0 },
            { dx: -1, dy:  0 },
            { dx:  0, dy:  1 },
            { dx:  0, dy: -1 },
        ];
        const picked = dirs[Phaser.Math.Between(0, 3)];
        this.dx = picked.dx;
        this.dy = picked.dy;

        // Bergerak setiap movePeriod game-tick
        this.movePeriod = Phaser.Math.Between(2, 4);
        this._tick      = 0;

        // Shimmer ref untuk animasi per-frame
        this._shimmerGfx = null;

        // Buat container visual
        this.container = this._buildSprite();

        // Bob tween
        this._bobTween = scene.tweens.add({
            targets:  this.container,
            y:        this.container.y - 4,
            duration: 900 + Phaser.Math.Between(-200, 200),
            ease:     'Sine.easeInOut',
            yoyo:     true,
            repeat:   -1,
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────────────────────────

    /**
     * Dipanggil setiap game-tick (di dalam setInterval GameScene).
     * @param {Snake} snake
     * @returns {boolean} true jika obstacle mengenai kepala ular
     */
    tick(snake) {
        this._tick++;
        if (this._tick >= this.movePeriod) {
            this._tick = 0;
            this._step();
            this._animateTo(
                this.gridX * this.cellSize + this.cellSize / 2,
                this.gridY * this.cellSize + this.cellSize / 2
            );
        }
        return this._hitsHead(snake);
    }

    /**
     * Dipanggil di Phaser update() untuk efek visual per-frame.
     */
    updateVisual() {
        if (this._shimmerGfx) {
            const alpha = 0.15 + Math.sin(Date.now() * 0.004) * 0.12;
            this._shimmerGfx.setAlpha(alpha);
        }
    }

    /** Posisi grid saat ini. */
    getCell() {
        return { x: this.gridX, y: this.gridY };
    }

    destroy() {
        if (this._bobTween)  this._bobTween.stop();
        if (this.container)  this.container.destroy();
    }

    // ─────────────────────────────────────────────────────────────────
    //  Private
    // ─────────────────────────────────────────────────────────────────

    _step() {
        let nx = this.gridX + this.dx;
        let ny = this.gridY + this.dy;

        if (nx < 0 || nx >= this.gridWidth)  { this.dx = -this.dx; nx = this.gridX + this.dx; }
        if (ny < 0 || ny >= this.gridHeight) { this.dy = -this.dy; ny = this.gridY + this.dy; }

        this.gridX = nx;
        this.gridY = ny;
    }

    _hitsHead(snake) {
        const head = snake.getBody()[0];
        return head && head.x === this.gridX && head.y === this.gridY;
    }

    _animateTo(wx, wy) {
        // Stop bob tween supaya tidak bertabrakan dengan tween posisi
        if (this._bobTween) this._bobTween.stop();

        this.scene.tweens.add({
            targets:  this.container,
            x:        wx,
            y:        wy,
            duration: 110,
            ease:     'Quad.easeOut',
            onComplete: () => {
                // Resume bob setelah sampai
                if (this._bobTween) this._bobTween.restart();
            },
        });
    }

    _buildSprite() {
        const s  = this.cellSize;
        const wx = this.gridX * s + s / 2;
        const wy = this.gridY * s + s / 2;
        const container = this.scene.add.container(wx, wy);
        container.setDepth(100);

        if (this.type === 'rock') {
            this._drawRock(container, s);
        } else {
            this._drawThorn(container, s);
        }

        return container;
    }

    _drawThorn(container, s) {
        const h = s / 2;
        const g = this.scene.add.graphics();

        // Bayangan
        g.fillStyle(0x061206, 0.5);
        g.fillRect(-h + 3, -h + 3, s - 2, s - 2);

        // Lingkaran dasar gelap
        g.fillStyle(0x1a3a0a);
        g.fillCircle(0, 1, h - 2);

        // Duri atas
        g.fillStyle(0x2a5a1a);
        g.fillRect(-2, -h + 1, 4, 9);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-1, -h + 1, 2, 3);

        // Duri bawah
        g.fillStyle(0x2a5a1a);
        g.fillRect(-2, h - 10, 4, 9);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-1, h - 4, 2, 3);

        // Duri kiri
        g.fillStyle(0x2a5a1a);
        g.fillRect(-h + 1, -2, 9, 4);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-h + 1, -1, 3, 2);

        // Duri kanan
        g.fillStyle(0x2a5a1a);
        g.fillRect(h - 10, -2, 9, 4);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(h - 4, -1, 3, 2);

        // Body isian utama
        g.fillStyle(0x2a5a0a);
        g.fillCircle(0, 1, h - 6);

        // Detail pixel di tengah
        const dots = [
            [-4, -3], [3, -4], [-3, 4], [4, 3], [0, 0],
        ];
        dots.forEach((d) => {
            g.fillStyle(0x3a7a1a);
            g.fillRect(d[0], d[1], 3, 3);
        });

        // Shimmer overlay (dianimasikan di updateVisual)
        const shimmer = this.scene.add.graphics();
        shimmer.fillStyle(0x8aba4a, 0.22);
        shimmer.fillCircle(0, 0, h - 7);
        this._shimmerGfx = shimmer;

        // Ring peringatan merah
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xdd3311, 0.55);
        ring.strokeCircle(0, 0, h);

        container.add([g, shimmer, ring]);
    }

    _drawRock(container, s) {
        const h = s / 2;
        const g = this.scene.add.graphics();

        // Bayangan
        g.fillStyle(0x061206, 0.45);
        g.fillRect(-h + 3, -h + 4, s - 2, s - 2);

        // Tubuh batu — beberapa rect overlap untuk kesan tidak beraturan
        g.fillStyle(0x404050);
        g.fillRect(-h + 2, -4, s - 4, 12);
        g.fillRect(-h + 5, -h + 3, s - 10, 10);
        g.fillRect(-h + 3, h - 8, s - 6, 5);

        // Wajah terang
        g.fillStyle(0x606070);
        g.fillRect(-4, -5, 7, 8);

        // Kilat highlight
        g.fillStyle(0x9090a0, 0.85);
        g.fillRect(-h + 5, -h + 4, 5, 3);

        // Detail retak
        g.fillStyle(0x28283a, 0.7);
        g.fillRect(-1, -3, 1, 6);
        g.fillRect(2, -1, 4, 1);

        // Ring peringatan oranye
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xee6611, 0.55);
        ring.strokeRect(-h + 1, -h + 1, s - 2, s - 2);

        container.add([g, ring]);
    }
}

// ─────────────────────────────────────────────────────────────────────
//  Helper effects (dipanggil dari GameScene)
//  INI YANG PENTING - PASTIKAN FUNCTION INI DIEXPORT!
// ─────────────────────────────────────────────────────────────────────

/**
 * Flash layar merah sesaat — dipanggil saat snake mati.
 */
export function flashHitEffect(scene) {
    var cam = scene.cameras.main;
    var flash = scene.add.rectangle(
        cam.width / 2, cam.height / 2,
        cam.width, cam.height,
        0xcc1111
    ).setDepth(999).setAlpha(0).setScrollFactor(0);

    scene.tweens.add({
        targets:  flash,
        alpha:    { from: 0.5, to: 0 },
        duration: 380,
        ease:     'Quad.easeOut',
        onComplete: function() { flash.destroy(); },
    });
}

/**
 * Spawn partikel burst pada posisi world (wx, wy).
 */
export function spawnHitParticles(scene, wx, wy, count) {
    count = count || 14;
    var colors = [0xff4444, 0xff8822, 0xffdd33, 0xffffff];

    for (var i = 0; i < count; i++) {
        var col  = colors[Phaser.Math.Between(0, colors.length - 1)];
        var size = Phaser.Math.Between(3, 7);
        var p    = scene.add.rectangle(wx, wy, size, size, col).setDepth(900);
        var ang  = Math.random() * Math.PI * 2;
        var dist = Phaser.Math.Between(35, 120);

        scene.tweens.add({
            targets:  p,
            x:        wx + Math.cos(ang) * dist,
            y:        wy + Math.sin(ang) * dist,
            alpha:    0,
            scaleX:   0,
            scaleY:   0,
            duration: Phaser.Math.Between(280, 580),
            ease:     'Quad.easeOut',
            onComplete: function() { p.destroy(); },
        });
    }
}

/**
 * Screen shake — pembungkus praktis untuk camera.shake().
 */
export function screenShakeEffect(scene, intensity, duration) {
    scene.cameras.main.shake(duration || 380, intensity || 0.013);
}