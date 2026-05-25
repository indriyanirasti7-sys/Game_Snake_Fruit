export default class Snake {
    constructor(scene, startX, startY, gridWidth, gridHeight) {
        this.scene = scene;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.cellSize = 32;
        this.body = [];
        this.direction = 'right';
        this.nextDirection = 'right';
        
        // Initialize snake with 3 segments
        for(let i = 0; i < 3; i++) {
            this.body.push({
                x: startX - i,
                y: startY,
                sprite: null
            });
        }
        
        // Create sprites
        this.createSprites();
    }
    
    createSprites() {
        this.body.forEach((segment, index) => {
            const isHead = index === 0;
            const texture = isHead ? 'snakeHead' : 'snakeBody';
            const sprite = this.scene.add.sprite(
                segment.x * this.cellSize + this.cellSize/2,
                segment.y * this.cellSize + this.cellSize/2,
                texture
            );
            sprite.setOrigin(0.5);
            sprite.setDisplaySize(this.cellSize - 2, this.cellSize - 2);
            segment.sprite = sprite;
            
            // Add idle animation for head
            if(isHead) {
                this.scene.tweens.add({
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
        const opposite = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };
        
        if(opposite[newDir] !== this.direction) {
            this.nextDirection = newDir;
        }
    }
    
    move(fruit) {
        this.direction = this.nextDirection;
        
        // Calculate new head position
        let newHead = { ...this.body[0] };
        
        switch(this.direction) {
            case 'right': newHead.x++; break;
            case 'left': newHead.x--; break;
            case 'up': newHead.y--; break;
            case 'down': newHead.y++; break;
        }
        
        // Check if fruit is eaten
        const fruitPos = fruit.getPosition();
        const ate = (newHead.x === fruitPos.x && newHead.y === fruitPos.y);
        
        // Insert new head
        this.body.unshift(newHead);
        
        if(!ate) {
            // Remove tail
            const tail = this.body.pop();
            tail.sprite.destroy();
        }
        
        // Create sprite for new head
        const newSprite = this.scene.add.sprite(
            newHead.x * this.cellSize + this.cellSize/2,
            newHead.y * this.cellSize + this.cellSize/2,
            'snakeHead'
        );
        newSprite.setOrigin(0.5);
        newSprite.setDisplaySize(this.cellSize - 2, this.cellSize - 2);
        this.body[0].sprite = newSprite;
        
        // Animate head
        this.scene.tweens.add({
            targets: newSprite,
            y: newSprite.y - 2,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Update all sprites positions and rotations
        this.updateSprites();
        
        return ate;
    }
    
    updateSprites() {
        this.body.forEach((segment, index) => {
            if(segment.sprite) {
                segment.sprite.x = segment.x * this.cellSize + this.cellSize/2;
                segment.sprite.y = segment.y * this.cellSize + this.cellSize/2;
                
                // Update texture for head
                if(index === 0) {
                    segment.sprite.setTexture('snakeHead');
                } else {
                    segment.sprite.setTexture('snakeBody');
                }
            }
        });
        
        this.updateSpritesRotation();
    }
    
    updateSpritesRotation() {
        for(let i = 0; i < this.body.length; i++) {
            const segment = this.body[i];
            if(!segment.sprite) continue;
            
            let angle = 0;
            
            if(i === 0) {
                // Head rotation
                switch(this.direction) {
                    case 'right': angle = 0; break;
                    case 'left': angle = 180; break;
                    case 'up': angle = -90; break;
                    case 'down': angle = 90; break;
                }
            } else {
                // Body rotation based on neighbors
                const prev = this.body[i-1];
                const next = this.body[i+1];
                
                if(prev && next) {
                    if(prev.x !== next.x && prev.y !== next.y) {
                        // Corner piece
                        if((prev.x < segment.x && next.y < segment.y) || (next.x < segment.x && prev.y < segment.y)) {
                            angle = 0;
                        } else if((prev.x > segment.x && next.y < segment.y) || (next.x > segment.x && prev.y < segment.y)) {
                            angle = 90;
                        } else if((prev.x > segment.x && next.y > segment.y) || (next.x > segment.x && prev.y > segment.y)) {
                            angle = 180;
                        } else {
                            angle = -90;
                        }
                    } else if(prev.x === next.x) {
                        angle = 90;
                    } else if(prev.y === next.y) {
                        angle = 0;
                    }
                }
            }
            
            segment.sprite.setRotation(Phaser.Math.DegToRad(angle));
        }
    }
    
    checkCollision() {
        const head = this.body[0];
        
        // Wall collision
        if(head.x < 0 || head.x >= this.gridWidth || head.y < 0 || head.y >= this.gridHeight) {
            return true;
        }
        
        // Self collision
        for(let i = 1; i < this.body.length; i++) {
            if(this.body[i].x === head.x && this.body[i].y === head.y) {
                return true;
            }
        }
        
        return false;
    }
    
    getBody() {
        return this.body.map(segment => ({ x: segment.x, y: segment.y }));
    }
}