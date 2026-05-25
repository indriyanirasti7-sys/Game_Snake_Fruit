export default class Fruit {
    constructor(scene, snake) {
        this.scene = scene;
        this.snake = snake;
        this.position = { x: 0, y: 0 };
        this.sprite = null;
        
        this.respawn(snake);
        this.createFloatingAnimation();
    }
    
    respawn(snake) {
        const snakeBody = snake.getBody();
        const available = [];
        
        // Find empty cells
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
            
            if(this.sprite) {
                this.sprite.destroy();
            }
            
            this.sprite = this.scene.add.sprite(
                this.position.x * 32 + 16,
                this.position.y * 32 + 16,
                'apple'
            );
            this.sprite.setOrigin(0.5);
            this.sprite.setDisplaySize(28, 28);
            
            // Floating idle animation
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
    
    createFloatingAnimation() {
        // Add glow effect
        if(this.sprite) {
            this.scene.tweens.add({
                targets: this.sprite,
                alpha: 0.8,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
        }
    }
    
    update() {
        // Rotate apple slightly
        if(this.sprite) {
            // Subtle rotation
            const rot = Math.sin(Date.now() * 0.003) * 0.1;
            this.sprite.setRotation(rot);
        }
    }
    
    getPosition() {
        return this.position;
    }
}