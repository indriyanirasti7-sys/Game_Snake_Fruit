export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
        this._modalOpen = false;
    }

    create() {
        var W = 1280, H = 720;

        // ── Background ──────────────────────────────────────────────
        this.add.tileSprite(0, 0, W, H, 'grassTile').setOrigin(0, 0);

        // Vignette edges
        var vig = this.add.graphics();
        vig.fillStyle(0x061206, 0.55); vig.fillRect(0, 0, W, 90);
        vig.fillStyle(0x061206, 0.55); vig.fillRect(0, H - 90, W, 90);
        vig.fillStyle(0x061206, 0.30); vig.fillRect(0, 0, 100, H);
        vig.fillStyle(0x061206, 0.30); vig.fillRect(W - 100, 0, 100, H);

        // ── Title ────────────────────────────────────────────────────
        var titleY = 165;

        // Shadow
        this.add.text(W / 2 + 4, titleY + 4, 'LITTLE BIG SNAKE', {
            fontFamily: '"Courier New", monospace',
            fontSize:   '70px',
            fontStyle:  'bold',
            fill:       '#0a1e0a',
        }).setOrigin(0.5).setAlpha(0.55);

        var title = this.add.text(W / 2, titleY, 'LITTLE BIG SNAKE', {
            fontFamily: '"Courier New", monospace',
            fontSize:   '70px',
            fontStyle:  'bold',
            fill:       '#c8e8a8',
        }).setOrigin(0.5);

        // Underline
        var ul = this.add.graphics();
        ul.fillStyle(0x8aba6b, 0.55);
        ul.fillRect(W / 2 - 330, titleY + 42, 660, 2);

        // Tagline
        this.add.text(W / 2, titleY + 60, '~ retro arcade edition ~', {
            fontFamily: '"Courier New", monospace',
            fontSize:   '15px',
            fill:       '#5a8a3a',
            letterSpacing: 3,
        }).setOrigin(0.5);

        // Float animation
        this.tweens.add({
            targets: title, y: titleY - 6,
            duration: 2400, ease: 'Sine.easeInOut',
            yoyo: true, repeat: -1,
        });

        // ── High score badge ─────────────────────────────────────────
        var hs     = localStorage.getItem('snakeHighScore') || 0;
        var hsBadge = this.add.graphics();
        hsBadge.fillStyle(0x1a3a1a, 0.75);
        hsBadge.fillRoundedRect(W / 2 - 105, titleY + 84, 210, 34, 8);
        hsBadge.lineStyle(2, 0x5a8a3a, 0.9);
        hsBadge.strokeRoundedRect(W / 2 - 105, titleY + 84, 210, 34, 8);

        this.add.text(W / 2, titleY + 101, '\u2605  BEST: ' + hs, {
            fontFamily: '"Courier New", monospace',
            fontSize:   '16px',
            fill:       '#a8d878',
        }).setOrigin(0.5);

        // ── Buttons ──────────────────────────────────────────────────
        var self = this;
        this._createButton(W / 2, 356, 'START GAME',  function() { self._startGame();   });
        this._createButton(W / 2, 428, 'HOW TO PLAY', function() { self._showHowToPlay(); });

        // ── Decorative snake ─────────────────────────────────────────
        this._drawMenuSnake(W / 2 - 280, titleY - -360, 5, false);
        this._drawMenuSnake(W / 2 + 280, titleY - -360, 5, true);

        // ── Floating particles ───────────────────────────────────────
        this._spawnParticles();

        // ── Footer ───────────────────────────────────────────────────
        this.add.text(W / 2, H - 18, 'P  pause   \u2022   F  fullscreen   \u2022   M  mute', {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '12px',
            fill:          '#3a5a2a',
            letterSpacing: 2,
        }).setOrigin(0.5);

        this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    // ─────────────────────────────────────────────────────────────────

    _drawMenuSnake(startX, y, len, flipped) {
        var s = 26, gap = 4;
        for (var i = 0; i < len; i++) {
            var x = flipped
                ? startX - i * (s + gap)
                : startX + i * (s + gap);

            var g = this.add.graphics();
            // Shadow
            g.fillStyle(0x0a1e0a, 0.4);
            g.fillRect(x + 2, y + 2, s, s);
            // Body
            g.fillStyle(i === 0 ? 0x8aba6b : 0x5a8a3a);
            g.fillRect(x, y, s, s);
            // Highlight
            g.fillStyle(0xa8d878, 0.35);
            g.fillRect(x + 2, y + 2, s - 5, 3);
            // Border
            g.lineStyle(1, 0x2a5a1a, 0.6);
            g.strokeRect(x, y, s, s);

            if (i === 0) {
                var ex = flipped ? x + 4 : x + s - 10;
                g.fillStyle(0xffffff);
                g.fillRect(ex, y + 5,     4, 4);
                g.fillRect(ex, y + s - 9, 4, 4);
                g.fillStyle(0x1a3a0a);
                g.fillRect(ex + 1, y + 6,     2, 2);
                g.fillRect(ex + 1, y + s - 8, 2, 2);
            }
        }
    }

    _createButton(x, y, label, cb) {
        var BW = 280, BH = 52;
        var container = this.add.container(x, y);

        var shadow = this.add.graphics();
        shadow.fillStyle(0x0a1e0a, 0.5);
        shadow.fillRoundedRect(-BW / 2 + 4, -BH / 2 + 4, BW, BH, 6);

        var base = this.add.graphics();
        function draw(hovered) {
            base.clear();
            base.fillStyle(hovered ? 0x5a9a3a : 0x3a6a2a);
            base.fillRoundedRect(-BW / 2, -BH / 2, BW, BH, 6);
            base.lineStyle(2, hovered ? 0xa8d878 : 0x7aba5a, 1);
            base.strokeRoundedRect(-BW / 2, -BH / 2, BW, BH, 6);
            // Sheen
            base.fillStyle(0xffffff, 0.05);
            base.fillRoundedRect(-BW / 2 + 2, -BH / 2 + 2, BW - 4, BH / 2 - 2,
                { tl: 6, tr: 6, bl: 0, br: 0 });
        }
        draw(false);

        var txt = this.add.text(0, 1, label, {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '22px',
            fontStyle:     'bold',
            fill:          '#d8f0c8',
            letterSpacing: 3,
        }).setOrigin(0.5);

        container.add([shadow, base, txt]);

        var hit = this.add.zone(0, 0, BW, BH).setInteractive({ useHandCursor: true });
        container.add(hit);

        hit.on('pointerover',  function() { draw(true);  txt.setColor('#ffffff'); });
        hit.on('pointerout',   function() { draw(false); txt.setColor('#d8f0c8'); });
        hit.on('pointerdown',  function() {
            var origY = container.y;
            container.y += 3;
            setTimeout(function() { container.y = origY; cb(); }, 80);
        });
    }

    _spawnParticles() {
        for (var i = 0; i < 18; i++) {
            var px  = Phaser.Math.Between(40, 1240);
            var py  = Phaser.Math.Between(20, 700);
            var p   = this.add.rectangle(px, py, Phaser.Math.Between(2, 4), Phaser.Math.Between(2, 4), 0x7aba5a, 0.45);
            this.tweens.add({
                targets: p,
                y:       p.y - Phaser.Math.Between(15, 35),
                alpha:   0,
                duration: Phaser.Math.Between(2800, 5000),
                delay:   Phaser.Math.Between(0, 3000),
                repeat:  -1,
                onRepeat: function() {
                    p.x     = Phaser.Math.Between(40, 1240);
                    p.y     = Phaser.Math.Between(450, 720);
                    p.alpha = 0.45;
                },
            });
        }
    }

    _startGame() {
        var self = this;
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(250, function() {
            self.scene.start('GameScene');
            self.scene.start('UIScene');
            self.scene.stop('MainMenuScene');
        });
    }

    // ─────────────────────────────────────────────────────────────────
    //  HOW TO PLAY — Glassmorphism modal
    // ─────────────────────────────────────────────────────────────────

    _showHowToPlay() {
        if (this._modalOpen) return;
        this._modalOpen = true;

        var W = 1280, H = 720;
        var PW = 780, PH = 470;
        var PX = W / 2 - PW / 2, PY = H / 2 - PH / 2 - 10;
        var self   = this;
        var items  = []; // semua objek modal, untuk destroy bersama

        // ── Backdrop ─────────────────────────────────────────────────
        var backdrop = this.add.graphics().setDepth(200);
        backdrop.fillStyle(0x061206, 0.84);
        backdrop.fillRect(0, 0, W, H);
        items.push(backdrop);

        // ── Panel glass body ─────────────────────────────────────────
        var panel = this.add.graphics().setDepth(201);
        // Glow halo
        panel.fillStyle(0x7aba5a, 0.07);
        panel.fillRoundedRect(PX - 5, PY - 5, PW + 10, PH + 10, 15);
        // Main glass
        panel.fillStyle(0x0e260e, 0.90);
        panel.fillRoundedRect(PX, PY, PW, PH, 12);
        // Top sheen
        panel.fillStyle(0xffffff, 0.04);
        panel.fillRoundedRect(PX + 2, PY + 2, PW - 4, PH * 0.35, { tl: 12, tr: 12, bl: 0, br: 0 });
        // Border
        panel.lineStyle(2, 0x5a9a3a, 0.9);
        panel.strokeRoundedRect(PX, PY, PW, PH, 12);
        // Inner border
        panel.lineStyle(1, 0x2a4a2a, 0.5);
        panel.strokeRoundedRect(PX + 5, PY + 5, PW - 10, PH - 10, 9);
        items.push(panel);

        // ── Header ───────────────────────────────────────────────────
        var headerTxt = this.add.text(W / 2, PY + 32, 'HOW  TO  PLAY', {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '24px',
            fontStyle:     'bold',
            fill:          '#a8d878',
            letterSpacing: 6,
        }).setOrigin(0.5).setDepth(202);
        items.push(headerTxt);

        var headerLine = this.add.graphics().setDepth(202);
        headerLine.fillStyle(0x5a9a3a, 0.4);
        headerLine.fillRect(PX + 24, PY + 58, PW - 48, 1);
        items.push(headerLine);

        // ── 4 Step cards ─────────────────────────────────────────────
        var steps = [
            { icon: '\u2B06\u2B07\u2B05\u27A1', title: 'MOVE',    desc: 'WASD or Arrow Keys\nto steer the snake'       },
            { icon: '\uD83C\uDF4E',             title: 'EAT',     desc: 'Collect apples to\ngrow & score points'       },
            { icon: '\u26A1',                   title: 'SPEED',   desc: 'Snake speeds up\nevery 5 points'              },
            { icon: '\u2620',                   title: 'SURVIVE', desc: 'Avoid walls, yourself\nand moving obstacles!'  },
        ];

        var cardW  = 168, cardH = 152;
        var totalW = cardW * 4 + 12 * 3;
        var cardX0 = W / 2 - totalW / 2;
        var cardY  = PY + 74;

        steps.forEach(function(step, i) {
            var cx = cardX0 + i * (cardW + 12);

            // Card bg
            var card = self.add.graphics().setDepth(202);
            card.fillStyle(0x1a3a1a, 0.72);
            card.fillRoundedRect(cx, cardY, cardW, cardH, 8);
            card.lineStyle(1, 0x3a6a2a, 0.75);
            card.strokeRoundedRect(cx, cardY, cardW, cardH, 8);
            items.push(card);

            // Number badge
            var badge = self.add.graphics().setDepth(203);
            badge.fillStyle(0x4a8a2a, 1);
            badge.fillCircle(cx + 14, cardY + 14, 12);
            items.push(badge);

            var numTxt = self.add.text(cx + 14, cardY + 14, '' + (i + 1), {
                fontFamily: '"Courier New", monospace',
                fontSize:   '13px',
                fontStyle:  'bold',
                fill:       '#d8f0c8',
            }).setOrigin(0.5).setDepth(203);
            items.push(numTxt);

            // Icon
            var iconTxt = self.add.text(cx + cardW / 2, cardY + 42, step.icon, {
                fontSize: '26px',
            }).setOrigin(0.5).setDepth(203);
            items.push(iconTxt);

            // Title
            var titleTxt = self.add.text(cx + cardW / 2, cardY + 80, step.title, {
                fontFamily:    '"Courier New", monospace',
                fontSize:      '14px',
                fontStyle:     'bold',
                fill:          '#8aba6b',
                letterSpacing: 2,
            }).setOrigin(0.5).setDepth(203);
            items.push(titleTxt);

            // Divider
            var div = self.add.graphics().setDepth(203);
            div.fillStyle(0x3a6a2a, 0.5);
            div.fillRect(cx + 10, cardY + 93, cardW - 20, 1);
            items.push(div);

            // Description
            var descTxt = self.add.text(cx + cardW / 2, cardY + 102, step.desc, {
                fontFamily:  '"Courier New", monospace',
                fontSize:    '12px',
                fill:        '#6a9a5a',
                align:       'center',
                lineSpacing: 5,
            }).setOrigin(0.5, 0).setDepth(203);
            items.push(descTxt);
        });

        // ── Shortcut row ─────────────────────────────────────────────
        var scY    = PY + 240;
        var scBg   = this.add.graphics().setDepth(202);
        scBg.fillStyle(0x152815, 0.8);
        scBg.fillRoundedRect(PX + 24, scY, PW - 48, 62, 6);
        scBg.lineStyle(1, 0x2a4a2a, 0.7);
        scBg.strokeRoundedRect(PX + 24, scY, PW - 48, 62, 6);
        items.push(scBg);

        var scLabel = this.add.text(PX + 48, scY + 10, 'SHORTCUTS', {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '11px',
            fontStyle:     'bold',
            fill:          '#4a6a3a',
            letterSpacing: 3,
        }).setDepth(203);
        items.push(scLabel);

        var shortcuts = [
            ['P', 'Pause'],
            ['F', 'Fullscreen'],
            ['M', 'Mute / Music'],
        ];
        shortcuts.forEach(function(sc, i) {
            var kx = PX + 200 + i * 185;

            var keyCap = self.add.graphics().setDepth(203);
            keyCap.fillStyle(0x2a5a2a, 1);
            keyCap.fillRoundedRect(kx, scY + 14, 30, 28, 4);
            keyCap.lineStyle(1, 0x5a9a4a, 0.8);
            keyCap.strokeRoundedRect(kx, scY + 14, 30, 28, 4);
            keyCap.fillStyle(0xffffff, 0.05);
            keyCap.fillRoundedRect(kx + 1, scY + 15, 28, 12, { tl: 4, tr: 4, bl: 0, br: 0 });
            items.push(keyCap);

            var kTxt = self.add.text(kx + 15, scY + 28, sc[0], {
                fontFamily: '"Courier New", monospace',
                fontSize:   '14px',
                fontStyle:  'bold',
                fill:       '#a8d878',
            }).setOrigin(0.5).setDepth(203);
            items.push(kTxt);

            var dTxt = self.add.text(kx + 38, scY + 28, sc[1], {
                fontFamily: '"Courier New", monospace',
                fontSize:   '13px',
                fill:       '#5a8a4a',
            }).setOrigin(0, 0.5).setDepth(203);
            items.push(dTxt);
        });

        // ── Tip banner ───────────────────────────────────────────────
        var tipY   = PY + 318;
        var tipBg  = this.add.graphics().setDepth(202);
        tipBg.fillStyle(0x2a4a0a, 0.5);
        tipBg.fillRoundedRect(PX + 24, tipY, PW - 48, 32, 5);
        items.push(tipBg);

        var tipTxt = this.add.text(W / 2, tipY + 16,
            '\u2756  Moving obstacles appear after score 3  \u2014  avoid them!  \u2756', {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '13px',
            fill:          '#7aba3a',
            letterSpacing: 1,
        }).setOrigin(0.5).setDepth(203);
        items.push(tipTxt);

        // ── Close button ─────────────────────────────────────────────
        var closeBtnY  = PY + PH + 18;
        var closeBg    = this.add.graphics().setDepth(202);
        function drawClose(hover) {
            closeBg.clear();
            closeBg.fillStyle(hover ? 0x5a9a3a : 0x2a5a2a, 1);
            closeBg.fillRoundedRect(W / 2 - 90, closeBtnY, 180, 46, 7);
            closeBg.lineStyle(2, hover ? 0xa8d878 : 0x4a8a3a, 1);
            closeBg.strokeRoundedRect(W / 2 - 90, closeBtnY, 180, 46, 7);
        }
        drawClose(false);
        items.push(closeBg);

        var closeTxt = this.add.text(W / 2, closeBtnY + 23, 'CLOSE', {
            fontFamily:    '"Courier New", monospace',
            fontSize:      '18px',
            fontStyle:     'bold',
            fill:          '#c8e8a8',
            letterSpacing: 4,
        }).setOrigin(0.5).setDepth(203);
        items.push(closeTxt);

        var closeHit = this.add.zone(W / 2, closeBtnY + 23, 180, 46)
            .setInteractive({ useHandCursor: true })
            .setDepth(203);
        items.push(closeHit);

        closeHit.on('pointerover',  function() { drawClose(true);  });
        closeHit.on('pointerout',   function() { drawClose(false); });

        function closeModal() {
            if (!self._modalOpen) return;
            self._modalOpen = false;
            items.forEach(function(o) {
                if (o && o.destroy) o.destroy();
            });
        }

        closeHit.on('pointerdown', closeModal);

        // Klik backdrop juga menutup
        backdrop.setInteractive();
        backdrop.on('pointerdown', function(ptr) {
            // Hanya tutup bila klik di luar panel
            var ix = ptr.x, iy = ptr.y;
            if (ix < PX || ix > PX + PW || iy < PY || iy > PY + PH) {
                closeModal();
            }
        });

        // ── Slide-in entrance ─────────────────────────────────────────
        items.forEach(function(o) {
            if (o && o.setAlpha) {
                o.setAlpha(0);
                if (o.y !== undefined) o.y += 22;
            }
        });
        this.tweens.add({
            targets:  items.filter(function(o) { return o && o.setAlpha; }),
            alpha:    1,
            y:        function(target) { return target.y - 22; },
            duration: 270,
            ease:     'Quad.easeOut',
        });
    }
}