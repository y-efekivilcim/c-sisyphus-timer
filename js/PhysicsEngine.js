export class PhysicsEngine {
    constructor() {
        this.SPEED = 130; 
        this.CYCLE_DURATION = 20000;    
        this.DIP_START_TIME = 10000;    
        this.CYCLE_DIST = (this.CYCLE_DURATION / 1000) * this.SPEED; 
        this.DIP_START_DIST = (this.DIP_START_TIME / 1000) * this.SPEED;
        this.SLOPE_ANGLE = -18 * (Math.PI / 180); 
        this.BOULDER_RADIUS = 55;
    }

    getTerrainY(x) {
        let cycleX = (x % this.CYCLE_DIST + this.CYCLE_DIST) % this.CYCLE_DIST; 
        
        let y = Math.sin(x * 0.015) * 4 + Math.cos(x * 0.04) * 3 + Math.sin(x * 0.12) * 1.5;

        if (cycleX > this.DIP_START_DIST) {
            let progress = (cycleX - this.DIP_START_DIST) / (this.CYCLE_DIST - this.DIP_START_DIST);
            
            let dipDepth = 520; 
            let smoothDip = 0;
            
            if (progress < 0.18) {
                let p = progress / 0.18;
                smoothDip = (1 - Math.cos(p * Math.PI)) / 2;
            } else if (progress < 0.35) {
                smoothDip = 1.0;
            } else {
                let p = (progress - 0.35) / 0.65;
                smoothDip = (1 + Math.cos(p * Math.PI)) / 2;
            }
            
            y += smoothDip * dipDepth;
        }

        return y;
    }

    getTerrainPoint(x) {
        let y = this.getTerrainY(x);
        let dy = this.getTerrainY(x + 1) - y;
        let len = Math.hypot(1, dy);
        return { x: x, y: y, nx: -dy / len, ny: 1 / len };
    }

    calculateAltitude(worldX, worldY) {
        const rawAltY = worldX * Math.sin(Math.abs(this.SLOPE_ANGLE)) - worldY * Math.cos(Math.abs(this.SLOPE_ANGLE));
        const realisticAlt = rawAltY * 0.015;
        return Math.max(0, Math.floor(realisticAlt));
    }
}
