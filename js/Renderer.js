export class Renderer {
    constructor(canvas, physics) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.physics = physics;
        this.INK = '#e3dec9';
        this.BOULDER_LIGHT = '#2a2723';
        
        this.currentNeedleAngle = 0;
        this.boulderTexture = this.createBoulderTexture(this.physics.BOULDER_RADIUS);
        this.clouds = this.initClouds();
    }

    createBoulderTexture(radius) {
        const size = radius * 2 + 40;
        const c = document.createElement('canvas');
        const dpr = window.devicePixelRatio || 1;
        c.width = size * dpr; 
        c.height = size * dpr;
        const bCtx = c.getContext('2d');
        bCtx.scale(dpr, dpr);
        const center = size / 2;

        const segments = 60;
        bCtx.beginPath();
        for(let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = radius + Math.sin(angle * 5) * 2.5 + Math.cos(angle * 8.3) * 1.5;
            const x = center + Math.cos(angle) * r;
            const y = center + Math.sin(angle) * r;
            if(i === 0) bCtx.moveTo(x, y);
            else bCtx.lineTo(x, y);
        }
        bCtx.closePath();
        
        bCtx.fillStyle = this.BOULDER_LIGHT;
        bCtx.fill();
        bCtx.lineWidth = 4;
        bCtx.strokeStyle = this.INK;
        bCtx.stroke();

        bCtx.save();
        bCtx.clip();

        bCtx.fillStyle = this.INK;
        for(let i = 0; i < 200; i++) {
            let dx = (Math.random() - 0.5) * 2; 
            let dy = (Math.random() - 0.5) * 2;
            if (dx * dx + dy * dy <= 1) {
                if (Math.random() > 0.4) {
                    bCtx.beginPath();
                    bCtx.arc(center + dx * radius, center + dy * radius, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
                    bCtx.fill();
                }
            }
        }

        bCtx.restore();
        return c;
    }

    initClouds() {
        const clouds = [];
        const numClouds = 10;
        const skyWidth = 3500;
        for (let i = 0; i < numClouds; i++) {
            let speedX = (Math.random() - 0.5) * 0.5;
            if (Math.abs(speedX) < 0.1) speedX = speedX > 0 ? 0.15 : -0.15;

            clouds.push({
                x: (i * (skyWidth / numClouds)) + (Math.random() * 200), 
                baseY: -150 - Math.random() * 220, 
                scale: 0.4 + Math.random() * 0.45,
                speedX: speedX,
                bobSpeed: 0.0005 + Math.random() * 0.001,
                bobOffset: Math.random() * Math.PI * 2,
                parallaxX: 0.05 + Math.random() * 0.06, 
                parallaxY: 0.02 + Math.random() * 0.03
            });
        }
        return clouds;
    }

    drawGround(startX, endX) {
        this.ctx.save();
        this.ctx.strokeStyle = this.INK;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += 2) {
            if (x === startX) this.ctx.moveTo(x, this.physics.getTerrainY(x));
            else this.ctx.lineTo(x, this.physics.getTerrainY(x));
        }
        this.ctx.stroke();

        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        for (let x = startX; x <= endX; x += 4) {
            let p = this.physics.getTerrainPoint(x);
            let offX = p.x + p.nx * 8;
            let offY = p.y + p.ny * 8;
            if (x === startX) this.ctx.moveTo(offX, offY);
            else this.ctx.lineTo(offX, offY);
        }
        this.ctx.stroke();

        this.ctx.fillStyle = this.INK;
        const dotStep = 25;
        const alignedStart = Math.floor(startX / dotStep) * dotStep;
        
        for (let x = alignedStart; x <= endX; x += dotStep) {
            let r1 = Math.abs(Math.sin(x * 12.9898));
            let r2 = Math.abs(Math.cos(x * 78.233));
            
            if (r1 > 0.4) {
                let p = this.physics.getTerrainPoint(x);
                let gap = 14 + r2 * 16; 
                let dotX = p.x + p.nx * gap;
                let dotY = p.y + p.ny * gap;
                
                this.ctx.beginPath();
                this.ctx.arc(dotX, dotY, r1 * 1.5 + 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.restore();
    }

    drawCompass(x, y, radius, time, worldX, worldY) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        const displayAlt = this.physics.calculateAltitude(worldX, worldY);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#E85D33';
        this.ctx.fill();

        this.ctx.strokeStyle = this.INK;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * radius * 0.75, Math.sin(angle) * radius * 0.75);
            this.ctx.lineTo(Math.cos(angle) * radius * 0.9, Math.sin(angle) * radius * 0.9);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = this.INK;
        this.ctx.font = `bold ${radius * 0.3}px 'Space Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('ALT', 0, -radius * 0.35);

        this.ctx.fillStyle = this.INK;
        this.ctx.font = `bold ${radius * 0.65}px 'Space Mono', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${displayAlt}m`, 0, radius * 1.6);

        const rawAltY = worldX * Math.sin(Math.abs(this.physics.SLOPE_ANGLE)) - worldY * Math.cos(Math.abs(this.physics.SLOPE_ANGLE));
        const realisticAlt = rawAltY * 0.015;

        let targetAngle = (realisticAlt / 150) * Math.PI * 2;
        const wobble = Math.sin(time * 0.01) * 0.02 + Math.cos(time * 0.025) * 0.01;
        targetAngle += wobble;

        let diff = targetAngle - this.currentNeedleAngle;
        this.currentNeedleAngle += diff * 0.1;

        this.ctx.save();
        this.ctx.rotate(this.currentNeedleAngle);

        this.ctx.beginPath();
        this.ctx.moveTo(0, -radius * 0.8);
        this.ctx.lineTo(radius * 0.05, 0);
        this.ctx.lineTo(-radius * 0.05, 0);
        this.ctx.closePath();
        this.ctx.fillStyle = this.INK;
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
        this.ctx.fillStyle = this.INK; 
        this.ctx.fill();

        this.ctx.restore(); 
        this.ctx.restore(); 
    }
}
