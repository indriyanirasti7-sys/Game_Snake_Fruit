export default class Fruit {
    constructor(scene, snake, offsetX, offsetY, cellSize) {
        this.scene = scene;
        this.snake = snake;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.cellSize = cellSize;
        this.position = { x: 0, y: 0 };
        this.sprite = null;
        this.respawn(snake);
    }
    
    respawn(snake) {
        const snakeBody = snake.getBody();
        const available = [];
        
        for(let i = 0; i < 20; i++) {
            for(let j = 0; j < 20; j++) {
                if(!snakeBody.some(segment => segment.x === i && segment.y === j)) {
                    available.push({ x: i, y: j });
                }
            }
        }
        
        if(available.length > 0) {
            const randomIndex = Math.floor(Math.random() * available.length);
            this.position = available[randomIndex];
            
            if(this.sprite) this.sprite.destroy();
            
            this.sprite = this.scene.add.sprite(
                this.offsetX + this.position.x * this.cellSize + this.cellSize/2,
                this.offsetY + this.position.y * this.cellSize + this.cellSize/2,
                'apple'
            );
            this.sprite.setOrigin(0.5);
            this.sprite.setDisplaySize(this.cellSize - 4, this.cellSize - 4);
            
            this.scene.tweens.add({
                targets: this.sprite,
                y: this.sprite.y - 4,
                duration: 1200,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    update() {
        if(this.sprite) {
            const rot = Math.sin(Date.now() * 0.003) * 0.1;
            this.sprite.setRotation(rot);
        }
    }
    
    getPosition() {
        return this.position;
    }
}