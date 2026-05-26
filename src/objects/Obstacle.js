export default class Obstacle {
    constructor(scene, gridWidth, gridHeight, type, offsetX, offsetY, cellSize) {
        this.scene = scene;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.cellSize = cellSize;
        this.type = type || 'thorn';
        this.isDestroyed = false;  // TAMBAHKAN flag ini
        
        this.gridX = Phaser.Math.Between(2, gridWidth - 3);
        this.gridY = Phaser.Math.Between(2, gridHeight - 3);
        
        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];
        const picked = dirs[Phaser.Math.Between(0, 3)];
        this.dx = picked.dx;
        this.dy = picked.dy;
        
        this.movePeriod = Phaser.Math.Between(2, 4);
        this._tick = 0;
        this._shimmerGfx = null;
        this._moveTween = null;  // TAMBAHKAN untuk menyimpan tween
        
        this.container = this._buildSprite();
        
        this._bobTween = scene.tweens.add({
            targets: this.container,
            y: this.container.y - 4,
            duration: 900 + Phaser.Math.Between(-200, 200),
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
        });
    }
    
    tick(snake) {
        if(this.isDestroyed) return false;  // CEK jika sudah dihancurkan
        
        this._tick++;
        if(this._tick >= this.movePeriod) {
            this._tick = 0;
            this._step();
            this._animateTo(
                this.offsetX + this.gridX * this.cellSize + this.cellSize/2,
                this.offsetY + this.gridY * this.cellSize + this.cellSize/2
            );
        }
        return this._hitsHead(snake);
    }
    
    _step() {
        let nx = this.gridX + this.dx;
        let ny = this.gridY + this.dy;
        
        if(nx < 0 || nx >= this.gridWidth) { 
            this.dx = -this.dx; 
            nx = this.gridX + this.dx;
        }
        if(ny < 0 || ny >= this.gridHeight) { 
            this.dy = -this.dy; 
            ny = this.gridY + this.dy;
        }
        
        this.gridX = nx;
        this.gridY = ny;
    }
    
    _hitsHead(snake) {
        const head = snake.getBody()[0];
        return head && head.x === this.gridX && head.y === this.gridY;
    }
    
    _animateTo(wx, wy) {
        if(this.isDestroyed) return;  // CEK jika sudah dihancurkan
        
        // Hentikan bob tween sementara
        if(this._bobTween && this._bobTween.isPlaying()) {
            this._bobTween.pause();
        }
        
        // Hentikan tween sebelumnya jika ada
        if(this._moveTween && this._moveTween.isPlaying()) {
            this._moveTween.stop();
        }
        
        this._moveTween = this.scene.tweens.add({
            targets: this.container,
            x: wx,
            y: wy,
            duration: 110,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if(!this.isDestroyed && this._bobTween) {
                    this._bobTween.resume();
                }
            }
        });
    }
    
    getCell() { 
        return { x: this.gridX, y: this.gridY }; 
    }
    
    destroy() {
        this.isDestroyed = true;  // TANDAI sudah dihancurkan
        
        if(this._bobTween) {
            this._bobTween.stop();
            this._bobTween = null;
        }
        if(this._moveTween) {
            this._moveTween.stop();
            this._moveTween = null;
        }
        if(this.container) {
            this.container.destroy();
            this.container = null;
        }
    }
    
    updateVisual() {
        if(this.isDestroyed) return;
        if(this._shimmerGfx) {
            const alpha = 0.15 + Math.sin(Date.now() * 0.004) * 0.12;
            this._shimmerGfx.setAlpha(alpha);
        }
    }
    
    _buildSprite() {
        const wx = this.offsetX + this.gridX * this.cellSize + this.cellSize/2;
        const wy = this.offsetY + this.gridY * this.cellSize + this.cellSize/2;
        const container = this.scene.add.container(wx, wy);
        container.setDepth(100);
        
        if(this.type === 'rock') this._drawRock(container);
        else this._drawThorn(container);
        
        return container;
    }
    
    _drawThorn(container) {
        const h = this.cellSize/2;
        const g = this.scene.add.graphics();
        
        g.fillStyle(0x061206, 0.5);
        g.fillRect(-h + 3, -h + 3, this.cellSize - 2, this.cellSize - 2);
        g.fillStyle(0x1a3a0a);
        g.fillCircle(0, 1, h - 2);
        g.fillStyle(0x2a5a1a);
        g.fillRect(-2, -h + 1, 4, 9);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-1, -h + 1, 2, 3);
        g.fillStyle(0x2a5a1a);
        g.fillRect(-2, h - 10, 4, 9);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-1, h - 4, 2, 3);
        g.fillStyle(0x2a5a1a);
        g.fillRect(-h + 1, -2, 9, 4);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(-h + 1, -1, 3, 2);
        g.fillStyle(0x2a5a1a);
        g.fillRect(h - 10, -2, 9, 4);
        g.fillStyle(0x4a8a2a, 0.8);
        g.fillRect(h - 4, -1, 3, 2);
        g.fillStyle(0x2a5a0a);
        g.fillCircle(0, 1, h - 6);
        
        const shimmer = this.scene.add.graphics();
        shimmer.fillStyle(0x8aba4a, 0.22);
        shimmer.fillCircle(0, 0, h - 7);
        this._shimmerGfx = shimmer;
        
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xdd3311, 0.55);
        ring.strokeCircle(0, 0, h);
        
        container.add([g, shimmer, ring]);
    }
    
    _drawRock(container) {
        const h = this.cellSize/2;
        const g = this.scene.add.graphics();
        
        g.fillStyle(0x061206, 0.45);
        g.fillRect(-h + 3, -h + 4, this.cellSize - 2, this.cellSize - 2);
        g.fillStyle(0x404050);
        g.fillRect(-h + 2, -4, this.cellSize - 4, 12);
        g.fillRect(-h + 5, -h + 3, this.cellSize - 10, 10);
        g.fillRect(-h + 3, h - 8, this.cellSize - 6, 5);
        g.fillStyle(0x606070);
        g.fillRect(-4, -5, 7, 8);
        g.fillStyle(0x9090a0, 0.85);
        g.fillRect(-h + 5, -h + 4, 5, 3);
        g.fillStyle(0x28283a, 0.7);
        g.fillRect(-1, -3, 1, 6);
        g.fillRect(2, -1, 4, 1);
        
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xee6611, 0.55);
        ring.strokeRect(-h + 1, -h + 1, this.cellSize - 2, this.cellSize - 2);
        
        container.add([g, ring]);
    }
}

export function flashHitEffect(scene) {
    const flash = scene.add.rectangle(640, 360, 1280, 720, 0xcc1111).setDepth(999).setAlpha(0.5).setScrollFactor(0);
    scene.tweens.add({ targets: flash, alpha: 0, duration: 380, onComplete: () => flash.destroy() });
}

export function spawnHitParticles(scene, wx, wy, count = 14) {
    const colors = [0xff4444, 0xff8822, 0xffdd33, 0xffffff];
    for(let i = 0; i < count; i++) {
        const col = colors[Phaser.Math.Between(0, colors.length - 1)];
        const p = scene.add.rectangle(wx, wy, Phaser.Math.Between(3, 7), Phaser.Math.Between(3, 7), col).setDepth(900);
        const ang = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(35, 120);
        scene.tweens.add({
            targets: p,
            x: wx + Math.cos(ang) * dist,
            y: wy + Math.sin(ang) * dist,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: Phaser.Math.Between(280, 580),
            onComplete: () => p.destroy()
        });
    }
}

export function screenShakeEffect(scene, intensity = 0.013, duration = 380) {
    scene.cameras.main.shake(duration, intensity);
}