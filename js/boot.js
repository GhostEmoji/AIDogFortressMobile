// DOG FORTRESS - Boot Scene (texture generation)

// ============================================================
// BOOT SCENE - generate textures
// ============================================================
class BootScene extends Phaser.Scene {
    constructor() { super('Boot'); }

    create() {
        this.generateTextures();
        this.scene.start('Menu');
    }

    generateTextures() {
        // Coin
        let g = this.make.graphics({ add: false });
        g.fillStyle(0xFFD700); g.fillCircle(16, 16, 16);
        g.fillStyle(0xFFAA00); g.fillCircle(16, 16, 11);
        g.fillStyle(0xFFD700); g.fillCircle(16, 16, 8);
        g.generateTexture('coin', 32, 32); g.destroy();

        // Projectile - bullet
        g = this.make.graphics({ add: false });
        g.fillStyle(0xFFFF88); g.fillCircle(6, 6, 6);
        g.fillStyle(0xFFFFCC); g.fillCircle(6, 6, 3);
        g.generateTexture('bullet', 12, 12); g.destroy();

        // Projectile - cannonball
        g = this.make.graphics({ add: false });
        g.fillStyle(0x333333); g.fillCircle(10, 10, 10);
        g.fillStyle(0x555555); g.fillCircle(8, 8, 4);
        g.generateTexture('cannonball', 20, 20); g.destroy();

        // Particle
        g = this.make.graphics({ add: false });
        g.fillStyle(0xFFFFFF); g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8); g.destroy();

        // Star particle
        g = this.make.graphics({ add: false });
        g.fillStyle(0xFFFF00); g.fillCircle(6, 6, 6);
        g.generateTexture('star', 12, 12); g.destroy();

        // Dog textures for each breed + silhouettes for undiscovered
        DOG_BREEDS.forEach((breed, i) => {
            this.generateDog('dog_' + i, breed.color);
            this.generateDog('dog_sil_' + i, 0x333333);
        });

        // Robot enemy textures
        Object.keys(ENEMY_DEFS).forEach(key => {
            const def = ENEMY_DEFS[key];
            this.generateRobot('enemy_' + key, def.color, def.size, key === 'mega', def.flying);
        });
    }

    generateDog(key, bodyColor) {
        const g = this.make.graphics({ add: false });
        const bc = bodyColor;
        const w = 52, h = 42;

        // Body
        g.fillStyle(bc);
        g.fillRoundedRect(8, 14, 28, 16, 4);

        // Head
        g.fillStyle(bc);
        g.fillCircle(40, 16, 10);

        // Ears
        const earColor = Phaser.Display.Color.ValueToColor(bc).darken(25).color;
        g.fillStyle(earColor);
        g.fillTriangle(34, 4, 38, 12, 30, 12);
        g.fillTriangle(44, 4, 48, 12, 40, 12);

        // Legs
        g.fillStyle(bc);
        g.fillRect(12, 28, 5, 12);
        g.fillRect(20, 28, 5, 12);
        g.fillRect(28, 28, 5, 12);

        // Tail
        g.lineStyle(4, earColor);
        g.beginPath(); g.moveTo(8, 16); g.lineTo(2, 6); g.strokePath();

        // Eye
        g.fillStyle(0x000000);
        g.fillCircle(43, 14, 2.5);
        g.fillStyle(0xFFFFFF);
        g.fillCircle(43.5, 13.5, 1);

        // Nose
        g.fillStyle(0x222222);
        g.fillCircle(49, 17, 2);

        // Mouth
        g.lineStyle(1.5, 0x222222);
        g.beginPath(); g.moveTo(49, 19); g.lineTo(46, 21); g.strokePath();

        g.generateTexture(key, w, h);
        g.destroy();
    }

    generateRobot(key, color, size, isBoss, isFlying) {
        const g = this.make.graphics({ add: false });
        const s = size;
        const dark = Phaser.Display.Color.ValueToColor(color).darken(30).color;

        if (isFlying) {
            // --- DRONE / GUNSHIP ---
            // Central body
            g.fillStyle(color);
            g.fillRoundedRect(s * 0.3, s * 0.35, s * 0.4, s * 0.25, 4);
            // Cockpit / sensor dome
            g.fillStyle(0x222222);
            g.fillRoundedRect(s * 0.38, s * 0.32, s * 0.24, s * 0.12, 6);
            // Eye / sensor
            g.fillStyle(0xFF0000);
            g.fillCircle(s * 0.5, s * 0.38, s * 0.05);
            // Wings / rotors
            g.fillStyle(dark);
            g.fillRect(s * 0.02, s * 0.4, s * 0.3, s * 0.06);
            g.fillRect(s * 0.68, s * 0.4, s * 0.3, s * 0.06);
            // Rotor circles
            g.lineStyle(2, 0x888888, 0.7);
            g.strokeCircle(s * 0.15, s * 0.43, s * 0.12);
            g.strokeCircle(s * 0.85, s * 0.43, s * 0.12);
            // Gun mount (gunship is bigger)
            if (s > 40) {
                g.fillStyle(0x444444);
                g.fillRect(s * 0.42, s * 0.58, s * 0.16, s * 0.12);
                g.fillRect(s * 0.46, s * 0.68, s * 0.08, s * 0.1);
            }
            // Antenna
            g.lineStyle(2, 0xAAAAAA);
            g.beginPath(); g.moveTo(s * 0.5, s * 0.32); g.lineTo(s * 0.5, s * 0.18); g.strokePath();
            g.fillStyle(0xFF4400);
            g.fillCircle(s * 0.5, s * 0.17, s * 0.03);
        } else if (isBoss) {
            // --- MEGA BOT --- upright, big, boxy
            g.fillStyle(color);
            g.fillRoundedRect(s * 0.2, s * 0.15, s * 0.6, s * 0.5, 6);
            // Head
            g.fillStyle(dark);
            g.fillRoundedRect(s * 0.3, s * 0.02, s * 0.4, s * 0.18, 4);
            // Eyes - glowing red
            g.fillStyle(0xFF0000);
            g.fillRect(s * 0.35, s * 0.07, s * 0.1, s * 0.06);
            g.fillRect(s * 0.55, s * 0.07, s * 0.1, s * 0.06);
            // Antenna
            g.lineStyle(3, 0xAAAAAA);
            g.beginPath(); g.moveTo(s * 0.5, s * 0.02); g.lineTo(s * 0.5, -s * 0.05); g.strokePath();
            g.fillStyle(0xFF4400);
            g.fillCircle(s * 0.5, -s * 0.05, s * 0.03);
            // Arms - weapon arms
            g.fillStyle(0x555555);
            g.fillRoundedRect(s * 0.05, s * 0.2, s * 0.18, s * 0.4, 4);
            g.fillRoundedRect(s * 0.77, s * 0.2, s * 0.18, s * 0.4, 4);
            // Gun barrels on arms
            g.fillStyle(0x333333);
            g.fillRect(s * 0.08, s * 0.55, s * 0.12, s * 0.06);
            g.fillRect(s * 0.8, s * 0.55, s * 0.12, s * 0.06);
            // Legs - treads
            g.fillStyle(0x444444);
            g.fillRoundedRect(s * 0.2, s * 0.65, s * 0.2, s * 0.3, 4);
            g.fillRoundedRect(s * 0.6, s * 0.65, s * 0.2, s * 0.3, 4);
            // Tread lines
            g.lineStyle(2, 0x333333);
            for (let i = 0; i < 4; i++) {
                const ty = s * 0.68 + i * s * 0.07;
                g.beginPath(); g.moveTo(s * 0.22, ty); g.lineTo(s * 0.38, ty); g.strokePath();
                g.beginPath(); g.moveTo(s * 0.62, ty); g.lineTo(s * 0.78, ty); g.strokePath();
            }
            // Chest panel
            g.fillStyle(0x222222);
            g.fillRect(s * 0.35, s * 0.25, s * 0.3, s * 0.15);
            g.fillStyle(0x00FF00, 0.5);
            g.fillRect(s * 0.37, s * 0.27, s * 0.06, s * 0.04);
            g.fillStyle(0xFF0000, 0.5);
            g.fillRect(s * 0.45, s * 0.27, s * 0.06, s * 0.04);
        } else {
            // --- GROUND BOTS --- side view, wheeled/treaded
            // Body - boxy
            g.fillStyle(color);
            g.fillRoundedRect(s * 0.15, s * 0.15, s * 0.6, s * 0.4, 5);
            // Head / sensor unit
            g.fillStyle(dark);
            g.fillRoundedRect(s * 0.6, s * 0.08, s * 0.25, s * 0.25, 4);
            // Eye - glowing
            g.fillStyle(0xFF0000);
            g.fillCircle(s * 0.75, s * 0.18, s * 0.05);
            g.fillStyle(0xFF4400, 0.4);
            g.fillCircle(s * 0.75, s * 0.18, s * 0.08);
            // Antenna
            g.lineStyle(2, 0xAAAAAA);
            g.beginPath(); g.moveTo(s * 0.7, s * 0.08); g.lineTo(s * 0.65, -s * 0.02); g.strokePath();
            // Gun barrel
            g.fillStyle(0x444444);
            g.fillRect(s * 0.75, s * 0.28, s * 0.2, s * 0.06);
            // Wheels / treads
            g.fillStyle(0x333333);
            g.fillCircle(s * 0.28, s * 0.6, s * 0.12);
            g.fillCircle(s * 0.55, s * 0.6, s * 0.12);
            g.fillStyle(0x555555);
            g.fillCircle(s * 0.28, s * 0.6, s * 0.06);
            g.fillCircle(s * 0.55, s * 0.6, s * 0.06);
            // Tread connection
            g.fillStyle(0x333333);
            g.fillRect(s * 0.2, s * 0.55, s * 0.45, s * 0.1);
            // Panel details
            g.lineStyle(1, 0x000000, 0.3);
            g.strokeRect(s * 0.2, s * 0.2, s * 0.15, s * 0.1);
            g.strokeRect(s * 0.38, s * 0.2, s * 0.15, s * 0.1);
        }

        g.generateTexture(key, s, s);
        g.destroy();
    }
}
