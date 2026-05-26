export default class Snake {
    constructor(scene, startX, startY, gridWidth, gridHeight, offsetX, offsetY, cellSize) {
        this.scene = scene;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.cellSize = cellSize;
        this.body = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.headTween = null;
        
        for(let i = 0; i < 3; i++) {
            this.body.push({
                x: startX - i,
                y: startY,
                sprite: null
            });
        }
        
        this.createSprites();
    }
    
    destroy() {
        if(this.headTween) this.headTween.stop();
        this.body.forEach(segment => {
            if(segment.sprite && segment.sprite.destroy) segment.sprite.destroy();
        });
        this.body = [];
    }
    
    createSprites() {
        this.body.forEach((segment, index) => {
            const isHead = index === 0;
            const texture = isHead ? 'snakeHead' : 'snakeBody';
            const sprite = this.scene.add.sprite(
                this.offsetX + segment.x * this.cellSize + this.cellSize/2,
                this.offsetY + segment.y * this.cellSize + this.cellSize/2,
                texture
            );
            sprite.setOrigin(0.5);
            sprite.setDisplaySize(this.cellSize - 2, this.cellSize - 2);
            segment.sprite = sprite;
            
            if(isHead) {
                this.headTween = this.scene.tweens.add({
                    targets: sprite,
                    y: sprite.y - 2,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
        this.updateSpritesRotation();
    }
    
    setDirection(newDir) {
        const opposite = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
        if(opposite[newDir] !== this.direction) this.nextDirection = newDir;
    }
    
    move(fruit) {
        this.direction = this.nextDirection;
        let newHead = { ...this.body[0] };
        
        switch(this.direction) {
            case 'right': newHead.x++; break;
            case 'left': newHead.x--; break;
            case 'up': newHead.y--; break;
            case 'down': newHead.y++; break;
        }
        
        const fruitPos = fruit.getPosition();
        const ate = (newHead.x === fruitPos.x && newHead.y === fruitPos.y);
        
        this.body.unshift(newHead);
        
        if(!ate) {
            const tail = this.body.pop();
            if(tail.sprite && tail.sprite.destroy) tail.sprite.destroy();
        }
        
        const newSprite = this.scene.add.sprite(
            this.offsetX + newHead.x * this.cellSize + this.cellSize/2,
            this.offsetY + newHead.y * this.cellSize + this.cellSize/2,
            'snakeHead'
        );
        newSprite.setOrigin(0.5);
        newSprite.setDisplaySize(this.cellSize - 2, this.cellSize - 2);
        this.body[0].sprite = newSprite;
        
        if(this.headTween) this.headTween.stop();
        this.headTween = this.scene.tweens.add({
            targets: newSprite,
            y: newSprite.y - 2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.updateSprites();
        return ate;
    }
    
    updateSprites() {
        this.body.forEach((segment, index) => {
            if(segment.sprite && segment.sprite.active) {
                segment.sprite.x = this.offsetX + segment.x * this.cellSize + this.cellSize/2;
                segment.sprite.y = this.offsetY + segment.y * this.cellSize + this.cellSize/2;
                segment.sprite.setTexture(index === 0 ? 'snakeHead' : 'snakeBody');
            }
        });
        this.updateSpritesRotation();
    }
    
    updateSpritesRotation() {
        for(let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            if(!segment.sprite || !segment.sprite.active) continue;
            let angle = 0;
            
            if(i === 0) {
                switch(this.direction) {
                    case 'right': angle = 0; break;
                    case 'left': angle = 180; break;
                    case 'up': angle = -90; break;
                    case 'down': angle = 90; break;
                }
            } else {
                const prev = this.body[i-1];
                const next = this.body[i+1];
                if(prev && next) {
                    if(prev.x !== next.x && prev.y !== next.y) {
                        if((prev.x < segment.x && next.y < segment.y) || (next.x < segment.x && prev.y < segment.y)) angle = 0;
                        else if((prev.x > segment.x && next.y < segment.y) || (next.x > segment.x && prev.y < segment.y)) angle = 90;
                        else if((prev.x > segment.x && next.y > segment.y) || (next.x > segment.x && prev.y > segment.y)) angle = 180;
                        else angle = -90;
                    } else if(prev.x === next.x) angle = 90;
                    else if(prev.y === next.y) angle = 0;
                }
            }
            segment.sprite.setRotation(Phaser.Math.DegToRad(angle));
        }
    }
    
    checkCollision() {
        if(this.body.length === 0) return true;
        const head = this.body[0];
        if(head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) return true;
        for(let i = 1; i < this.body.length; i++) {
            if(this.body[i].x === head.x && this.body[i].y === head.y) return true;
        }
        return false;
    }
    
    getBody() {
        return this.body.map(segment => ({ x: segment.x, y: segment.y }));
    }
}