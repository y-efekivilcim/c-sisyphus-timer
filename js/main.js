import { PhysicsEngine } from './PhysicsEngine.js';
import { Renderer } from './Renderer.js';

class App {
    constructor() {
        this.canvas = document.getElementById('scene-canvas');
        this.timerDisplay = document.getElementById('timer-display');
        this.toggleBtn = document.getElementById('toggleBtn');
        this.resetBtn = document.getElementById('resetBtn');

        this.physics = new PhysicsEngine();
        this.renderer = new Renderer(this.canvas, this.physics);
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.scaleFactor = 1;
        
        this.isRunning = false;
        this.elapsedTime = 0; 
        this.lastTimestamp = 0;
        this.animationFrame = null;
        
        this.boulderAngle = 0;
        this.lastWorldX = 0;
        this.lastWorldY = 0;
        this.cameraX = 0;
        this.cameraY = 0;

        this.bindEvents();
        this.resize();
        this.updateUI();
        this.animationFrame = requestAnimationFrame((t) => this.animate(t));
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        this.toggleBtn.addEventListener('click', () => {
            if (this.isRunning) {
                this.isRunning = false;
            } else {
                this.isRunning = true;
                this.lastTimestamp = performance.now(); 
            }
            this.updateUI();
        });

        this.resetBtn.addEventListener('click', () => {
            this.isRunning = false;
            this.elapsedTime = 0;
            this.lastWorldX = 0;
            this.lastWorldY = 0;
            this.boulderAngle = 0;
            
            this.cameraX = -this.width * 0.1; 
            this.cameraY = this.physics.getTerrainY(0) - this.height * 0.15;
            
            this.updateUI();
            
            if (!this.isRunning) {
                this.lastTimestamp = performance.now();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleBtn.click();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                this.resetBtn.click();
            }
        });
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        const scaleW = this.width < 600 ? this.width / 600 : 1;
        const scaleH = this.height < 500 ? this.height / 500 : 1;
        this.scaleFactor = Math.min(scaleW, scaleH);
    }

    formatTimer(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const milliseconds = Math.floor(ms % 1000);
        const pad = (num, digits = 2) => String(num).padStart(digits, '0');
        return `${pad(hours)}.${pad(minutes)}.${pad(seconds)}.${pad(milliseconds, 3)}`;
    }

    updateUI() {
        if (this.elapsedTime === 0 && !this.isRunning) {
            this.toggleBtn.textContent = 'Start';
        } else if (this.isRunning) {
            this.toggleBtn.textContent = 'Stop';
        } else if (this.elapsedTime > 0 && !this.isRunning) {
            this.toggleBtn.textContent = 'Resume';
        }
    }

    animate(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        if (this.isRunning) {
            this.elapsedTime += deltaTime;
        }

        this.timerDisplay.textContent = this.formatTimer(this.elapsedTime);

        const worldX = (this.elapsedTime / 1000) * this.physics.SPEED;
        const worldY = this.physics.getTerrainY(worldX);

        if (this.elapsedTime > 0) {
            const dx = worldX - this.lastWorldX;
            const dy = worldY - this.lastWorldY;
            const distTraveled = Math.hypot(dx, dy);
            this.boulderAngle += distTraveled / this.physics.BOULDER_RADIUS;
        }
        this.lastWorldX = worldX;
        this.lastWorldY = worldY;

        const targetCamX = worldX - (this.width / this.scaleFactor) * 0.1;
        const targetCamY = worldY - (this.height / this.scaleFactor) * 0.15; 
        
        if (Math.abs(targetCamX - this.cameraX) > this.width * 2) {
            this.cameraX = targetCamX;
            this.cameraY = targetCamY;
        } else {
            this.cameraX += (targetCamX - this.cameraX) * 0.06;
            this.cameraY += (targetCamY - this.cameraY) * 0.06;
        }

        const ctx = this.renderer.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr);
        
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2 - 60); 
        ctx.scale(this.scaleFactor, this.scaleFactor);

        const drawStart = this.cameraX - (this.width / this.scaleFactor);
        const drawEnd = this.cameraX + (this.width / this.scaleFactor) * 2;

        ctx.save();
        
        ctx.rotate(this.physics.SLOPE_ANGLE);
        ctx.translate(-this.cameraX, -this.cameraY);
        ctx.beginPath();
        ctx.moveTo(drawStart, this.physics.getTerrainY(drawStart));
        for (let x = drawStart; x <= drawEnd; x += 10) {
            ctx.lineTo(x, this.physics.getTerrainY(x));
        }
        ctx.lineTo(drawEnd, this.cameraY - this.height * 2); 
        ctx.lineTo(drawStart, this.cameraY - this.height * 2);
        ctx.closePath();
        ctx.clip(); 
        
        ctx.translate(this.cameraX, this.cameraY);
        ctx.rotate(-this.physics.SLOPE_ANGLE);

        ctx.fillStyle = this.renderer.BOULDER_LIGHT;
        ctx.strokeStyle = this.renderer.INK;
        ctx.lineJoin = 'round';
        
        this.renderer.clouds.forEach(cloud => {
            if (this.isRunning) {
                cloud.x += cloud.speedX;
            }
            
            const currentY = cloud.baseY + Math.sin(this.elapsedTime * cloud.bobSpeed + cloud.bobOffset) * 12;

            const wrapWidth = 3500; 
            let renderX = ((cloud.x - this.cameraX * cloud.parallaxX) % wrapWidth + wrapWidth) % wrapWidth - (wrapWidth / 2);
            let renderY = currentY - this.cameraY * cloud.parallaxY;
            
            ctx.save();
            ctx.translate(renderX, renderY);
            ctx.scale(cloud.scale, cloud.scale);
            
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-40, 0);
            ctx.quadraticCurveTo(0, 5, 40, 0); 
            ctx.bezierCurveTo(60, -5, 55, -35, 30, -30); 
            ctx.bezierCurveTo(15, -60, -15, -55, -20, -35); 
            ctx.bezierCurveTo(-45, -45, -65, -25, -50, -10); 
            ctx.bezierCurveTo(-60, 0, -50, 5, -40, 0); 
            ctx.fill();
            ctx.stroke();

            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-20, -5);
            ctx.quadraticCurveTo(0, -2, 20, -5);
            ctx.stroke();
            
            ctx.restore();
        });
        ctx.restore(); 

        ctx.rotate(this.physics.SLOPE_ANGLE);
        ctx.translate(-this.cameraX, -this.cameraY);

        this.renderer.drawGround(drawStart, drawEnd);

        ctx.save();
        ctx.translate(worldX, worldY - this.physics.BOULDER_RADIUS + 4); 
        ctx.rotate(this.boulderAngle);
        ctx.drawImage(this.renderer.boulderTexture, -this.renderer.boulderTexture.width / (2 * dpr), -this.renderer.boulderTexture.height / (2 * dpr), this.renderer.boulderTexture.width / dpr, this.renderer.boulderTexture.height / dpr);
        ctx.restore();

        ctx.restore();

        const compassMargin = 20 + 40 * this.scaleFactor;
        this.renderer.drawCompass(compassMargin, compassMargin, 26 * this.scaleFactor, this.elapsedTime, worldX, worldY);

        ctx.restore();

        this.animationFrame = requestAnimationFrame((t) => this.animate(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new App();
});
