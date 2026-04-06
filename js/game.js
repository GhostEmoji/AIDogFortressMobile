// ============================================================
// DOG FORTRESS - A Phaser 3 Mobile Tower Defense/Builder Game
// ============================================================

// --- GAME CONSTANTS ---
const GW = 1080;
const GH = 1920;
const WORLD_H = 12000;
const GROUND_Y = 10000;
const ROOM_W = 600;
const ROOM_H = 150;
const ROOM_GAP = 4;
const FORT_X = (GW - ROOM_W) / 2;
const FORT_CX = GW / 2;
const BASE_H = 180;

// --- ROOM DEFINITIONS ---
const ROOM_DEFS = {
    quarters: {
        name: 'Quarters', desc: 'Dog housing', color: 0xC4813D, colorDark: 0x8B5E2B,
        baseCost: 50, baseIncome: 2, category: 'income',
    },
    kitchen: {
        name: 'Kitchen', desc: 'Cook food for coins', color: 0xE8B84B, colorDark: 0xB8922E,
        baseCost: 120, baseIncome: 6, category: 'income',
    },
    workshop: {
        name: 'Workshop', desc: 'Craft goods', color: 0x7B8FA1, colorDark: 0x566A7A,
        baseCost: 250, baseIncome: 14, category: 'income',
    },
    radio: {
        name: 'Radio Tower', desc: 'Recruit dogs', color: 0x3DAE6F, colorDark: 0x2B7D50,
        baseCost: 200, baseIncome: 1, category: 'special',
        recruitInterval: 15000,
    },
    machinegun: {
        name: 'MG Turret', desc: 'Fast fire', color: 0xB83C3C, colorDark: 0x7A2828,
        baseCost: 150, baseIncome: 0, category: 'turret',
        baseDamage: 10, fireRate: 400, range: 550,
    },
    cannon: {
        name: 'Cannon', desc: 'Heavy damage', color: 0x6B2D2D, colorDark: 0x4A1A1A,
        baseCost: 300, baseIncome: 0, category: 'turret',
        baseDamage: 40, fireRate: 1600, range: 650,
    },
    sniper: {
        name: 'Sniper Nest', desc: 'Long range', color: 0x5B4B9E, colorDark: 0x3E336D,
        baseCost: 400, baseIncome: 0, category: 'turret',
        baseDamage: 60, fireRate: 2200, range: 950,
    },
};

// --- ENEMY DEFINITIONS ---
const ENEMY_DEFS = {
    wolf: { name: 'Wolf', color: 0x888888, hp: 40, speed: 70, steal: 8, reward: 12, size: 44 },
    cat: { name: 'Ninja Cat', color: 0xE87020, hp: 25, speed: 120, steal: 12, reward: 18, size: 36 },
    raccoon: { name: 'Raccoon', color: 0x606060, hp: 100, speed: 50, steal: 20, reward: 45, size: 50 },
    bear: { name: 'Bear', color: 0x8B5A2B, hp: 350, speed: 35, steal: 40, reward: 150, size: 70 },
};

// --- DOG DATA ---
const DOG_BREEDS = [
    { name: 'Labrador', color: 0xD4A843, bonus: 'income' },
    { name: 'German Shepherd', color: 0xA67B4B, bonus: 'combat' },
    { name: 'Corgi', color: 0xE8A040, bonus: 'speed' },
    { name: 'Husky', color: 0xB0B8C8, bonus: 'allround' },
    { name: 'Poodle', color: 0xE8DDD0, bonus: 'income' },
    { name: 'Dalmatian', color: 0xF0F0F0, bonus: 'combat' },
    { name: 'Bulldog', color: 0xC8A878, bonus: 'defense' },
    { name: 'Shiba Inu', color: 0xD4884A, bonus: 'speed' },
    { name: 'Beagle', color: 0xC89050, bonus: 'allround' },
    { name: 'Border Collie', color: 0x3A3A3A, bonus: 'income' },
];

const DOG_NAMES = [
    'Buddy','Max','Charlie','Cooper','Rocky','Bear','Duke','Tucker',
    'Jack','Toby','Finn','Scout','Biscuit','Milo','Oscar','Leo',
    'Gus','Hank','Louie','Rusty','Bruno','Ace','Rex','Atlas',
    'Maple','Luna','Daisy','Bella','Sadie','Rosie','Penny','Coco',
    'Winnie','Nala','Pepper','Hazel','Ruby','Ginger','Olive','Stella',
    'Waffles','Nugget','Pretzel','Nacho','Pickles','Mochi','Boba','Tater',
];

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

        // Dog textures for each breed
        DOG_BREEDS.forEach((breed, i) => {
            this.generateDog('dog_' + i, breed.color);
        });

        // Enemy textures
        this.generateEnemy('enemy_wolf', 0x888888, 44, false);
        this.generateEnemy('enemy_cat', 0xE87020, 36, false);
        this.generateEnemy('enemy_raccoon', 0x606060, 50, false);
        this.generateEnemy('enemy_bear', 0x8B5A2B, 70, true);
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

    generateEnemy(key, color, size, isBoss) {
        const g = this.make.graphics({ add: false });
        const s = size;

        // Body
        g.fillStyle(color);
        if (isBoss) {
            // Bear - upright, big
            g.fillRoundedRect(s * 0.15, s * 0.1, s * 0.7, s * 0.65, 8);
            // Head
            g.fillCircle(s * 0.5, s * 0.15, s * 0.18);
            // Ears
            g.fillCircle(s * 0.35, s * 0.05, s * 0.08);
            g.fillCircle(s * 0.65, s * 0.05, s * 0.08);
            // Arms
            g.fillRoundedRect(s * 0.05, s * 0.25, s * 0.15, s * 0.35, 4);
            g.fillRoundedRect(s * 0.8, s * 0.25, s * 0.15, s * 0.35, 4);
            // Legs
            g.fillRect(s * 0.2, s * 0.7, s * 0.18, s * 0.25);
            g.fillRect(s * 0.62, s * 0.7, s * 0.18, s * 0.25);
            // Eyes - angry
            g.fillStyle(0xFF0000);
            g.fillCircle(s * 0.42, s * 0.14, s * 0.04);
            g.fillCircle(s * 0.58, s * 0.14, s * 0.04);
            // Mouth
            g.lineStyle(2, 0x440000);
            g.beginPath(); g.moveTo(s * 0.4, s * 0.22); g.lineTo(s * 0.5, s * 0.25); g.lineTo(s * 0.6, s * 0.22); g.strokePath();
        } else {
            // Wolf/cat/raccoon - quadruped side view
            g.fillRoundedRect(s * 0.15, s * 0.2, s * 0.55, s * 0.35, 5);
            // Head
            g.fillCircle(s * 0.78, s * 0.3, s * 0.18);
            // Ears - pointy
            const earDark = Phaser.Display.Color.ValueToColor(color).darken(30).color;
            g.fillStyle(earDark);
            g.fillTriangle(s * 0.7, s * 0.08, s * 0.76, s * 0.18, s * 0.64, s * 0.18);
            g.fillTriangle(s * 0.85, s * 0.08, s * 0.9, s * 0.18, s * 0.78, s * 0.18);
            // Legs
            g.fillStyle(color);
            g.fillRect(s * 0.18, s * 0.5, s * 0.1, s * 0.3);
            g.fillRect(s * 0.32, s * 0.5, s * 0.1, s * 0.3);
            g.fillRect(s * 0.52, s * 0.5, s * 0.1, s * 0.3);
            // Tail
            g.lineStyle(4, earDark);
            g.beginPath(); g.moveTo(s * 0.15, s * 0.28); g.lineTo(s * 0.02, s * 0.15); g.strokePath();
            // Eye - angry red
            g.fillStyle(0xFF2200);
            g.fillCircle(s * 0.83, s * 0.27, s * 0.04);
            // Fangs
            g.fillStyle(0xFFFFFF);
            g.fillTriangle(s * 0.88, s * 0.35, s * 0.92, s * 0.35, s * 0.9, s * 0.44);
        }

        g.generateTexture(key, s, s);
        g.destroy();
    }
}

// ============================================================
// MENU SCENE
// ============================================================
class MenuScene extends Phaser.Scene {
    constructor() { super('Menu'); }

    create() {
        const cx = GW / 2, cy = GH / 2;

        // Background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0a00, 0x1a0a00, 0x3D1F00, 0x3D1F00, 1);
        bg.fillRect(0, 0, GW, GH);

        // Fortress silhouette
        const fort = this.add.graphics();
        fort.fillStyle(0x2A1500);
        fort.fillRect(GW / 2 - 200, cy - 100, 400, 500);
        fort.fillRect(GW / 2 - 220, cy - 100, 440, 30);
        // Battlements
        for (let i = 0; i < 8; i++) {
            fort.fillRect(GW / 2 - 220 + i * 56, cy - 140, 36, 45);
        }
        // Windows
        fort.fillStyle(0xFFCC44, 0.6);
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                fort.fillRect(GW / 2 - 130 + col * 120, cy - 50 + row * 140, 60, 50);
            }
        }
        // Door
        fort.fillStyle(0x1A0800);
        fort.fillRoundedRect(GW / 2 - 50, cy + 300, 100, 100, { tl: 50, tr: 50, bl: 0, br: 0 });

        // Title
        const title = this.add.text(cx, cy - 350, 'DOG\nFORTRESS', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '120px',
            color: '#FFD700',
            stroke: '#4A2800',
            strokeThickness: 12,
            align: 'center',
            lineSpacing: -10,
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, cy - 210, 'Defend. Build. Recruit.', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '36px',
            color: '#C89050',
            fontStyle: 'italic',
        }).setOrigin(0.5);

        // Tap to play
        const tap = this.add.text(cx, GH - 300, 'TAP TO PLAY', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '52px',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: tap, alpha: 0.3, duration: 800,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        this.tweens.add({
            targets: title, y: title.y - 10, duration: 2000,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        // Dog silhouettes on ground
        for (let i = 0; i < 5; i++) {
            const dx = 150 + i * 200;
            const dog = this.add.image(dx, GH - 180, 'dog_' + (i % DOG_BREEDS.length));
            dog.setScale(2.5).setAlpha(0.4).setTint(0x884400);
        }

        this.input.once('pointerup', () => {
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => this.scene.start('Game'));
        });
    }
}

// ============================================================
// GAME SCENE - Main gameplay
// ============================================================
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    create() {
        // --- State ---
        this.coins = 300;
        this.rooms = [];
        this.dogs = [];
        this.enemies = [];
        this.projectiles = [];
        this.wave = 0;
        this.waveActive = false;
        this.enemiesAlive = 0;
        this.selectedRoom = -1;
        this.totalRoomsBuilt = 0;
        this.notifications = [];
        this.buildMenuOpen = false;
        this.roomPanelOpen = false;

        // Scrolling state
        this.isDragging = false;
        this.dragStartY = 0;
        this.lastPointerY = 0;
        this.scrollVel = 0;

        // Camera
        this.cameras.main.setBounds(0, 0, GW, WORLD_H);
        this.cameras.main.scrollY = GROUND_Y - GH + 350;

        // --- Create world ---
        this.createBackground();
        this.createFortressBase();
        this.createHUD();
        this.createBuildBar();
        this.createRoomPanel();
        this.setupInput();
        this.setupTimers();

        // Give starter dog
        this.addDog();

        // Fade in
        this.cameras.main.fadeIn(500);

        // Welcome notification
        this.time.delayedCall(600, () => {
            this.showNotification('Welcome to Dog Fortress!', '#FFD700');
            this.time.delayedCall(1500, () => {
                this.showNotification('Build rooms to earn coins!', '#88CCFF');
            });
        });
    }

    // --- BACKGROUND ---
    createBackground() {
        // Sky gradient (drawn high up in world)
        const sky = this.add.graphics();
        sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x4A6FA5, 0x4A6FA5, 1);
        sky.fillRect(0, GROUND_Y - 5000, GW, 5000);
        sky.setDepth(0);

        // Clouds
        for (let i = 0; i < 12; i++) {
            const cx = Phaser.Math.Between(50, GW - 50);
            const cy = Phaser.Math.Between(GROUND_Y - 4500, GROUND_Y - 800);
            const cloud = this.add.graphics();
            cloud.fillStyle(0xFFFFFF, 0.5);
            const cw = Phaser.Math.Between(80, 200);
            cloud.fillRoundedRect(-cw / 2, -20, cw, 40, 20);
            cloud.fillRoundedRect(-cw / 3, -35, cw * 0.5, 35, 18);
            cloud.setPosition(cx, cy).setDepth(1);
            // Gentle drift
            this.tweens.add({
                targets: cloud, x: cx + Phaser.Math.Between(-100, 100),
                duration: Phaser.Math.Between(15000, 30000),
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        }

        // Distant hills
        const hills = this.add.graphics();
        hills.fillStyle(0x5A8F5A, 0.6);
        hills.beginPath();
        hills.moveTo(0, GROUND_Y);
        for (let x = 0; x <= GW; x += 60) {
            hills.lineTo(x, GROUND_Y - 150 - Math.sin(x * 0.005) * 80 - Math.sin(x * 0.012) * 40);
        }
        hills.lineTo(GW, GROUND_Y);
        hills.closePath(); hills.fillPath();
        hills.setDepth(2);

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0x5D8A3C);
        ground.fillRect(0, GROUND_Y - 10, GW, 30);
        ground.fillStyle(0x8B6914);
        ground.fillRect(0, GROUND_Y + 20, GW, 400);
        ground.fillStyle(0x6B4F12);
        ground.fillRect(0, GROUND_Y + 100, GW, 320);
        ground.setDepth(3);

        // Deep underground
        const deep = this.add.graphics();
        deep.fillStyle(0x3D2B0A);
        deep.fillRect(0, GROUND_Y + 300, GW, WORLD_H - GROUND_Y);
        deep.setDepth(2);
    }

    // --- FORTRESS BASE ---
    createFortressBase() {
        this.fortressBase = this.add.container(FORT_CX, GROUND_Y - BASE_H / 2);
        this.fortressBase.setDepth(10);

        const bg = this.add.graphics();
        // Stone wall base
        bg.fillStyle(0x6B5B4B);
        bg.fillRoundedRect(-ROOM_W / 2 - 20, -BASE_H / 2, ROOM_W + 40, BASE_H, { tl: 8, tr: 8, bl: 0, br: 0 });
        // Darker stone pattern
        bg.fillStyle(0x5A4A3A);
        const stoneW = 72, stoneH = 48;
        const cols = Math.floor((ROOM_W + 20) / (stoneW + 6));
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < cols; col++) {
                const bx = -ROOM_W / 2 - 10 + col * (stoneW + 6) + (row % 2) * ((stoneW + 6) / 2);
                const by = -BASE_H / 2 + 10 + row * 55;
                bg.fillRoundedRect(bx, by, stoneW, stoneH, 3);
            }
        }
        // Door
        bg.fillStyle(0x3D2200);
        bg.fillRoundedRect(-55, -20, 110, BASE_H / 2 + 20, { tl: 55, tr: 55, bl: 0, br: 0 });
        bg.fillStyle(0x2A1700);
        bg.fillRoundedRect(-45, -10, 90, BASE_H / 2 + 10, { tl: 45, tr: 45, bl: 0, br: 0 });
        // Door handle
        bg.fillStyle(0xDAA520);
        bg.fillCircle(25, 30, 8);

        // Sign
        bg.fillStyle(0x8B6914);
        bg.fillRoundedRect(-140, -BASE_H / 2 - 30, 280, 45, 6);
        bg.lineStyle(3, 0x5A4A1A);
        bg.strokeRoundedRect(-140, -BASE_H / 2 - 30, 280, 45, 6);

        this.fortressBase.add(bg);

        const sign = this.add.text(0, -BASE_H / 2 - 10, 'DOG FORTRESS', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '32px', color: '#FFD700',
            stroke: '#3D1F00', strokeThickness: 4,
        }).setOrigin(0.5);
        this.fortressBase.add(sign);

        // Fortress wall extensions (side towers)
        const leftTower = this.add.graphics();
        leftTower.fillStyle(0x5A4A3A);
        leftTower.fillRect(-ROOM_W / 2 - 40, -BASE_H / 2, 25, BASE_H);
        this.fortressBase.add(leftTower);

        const rightTower = this.add.graphics();
        rightTower.fillStyle(0x5A4A3A);
        rightTower.fillRect(ROOM_W / 2 + 15, -BASE_H / 2, 25, BASE_H);
        this.fortressBase.add(rightTower);
    }

    // --- HUD (fixed to camera) ---
    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0);

        // Top bar background
        const topBar = this.add.graphics();
        topBar.fillStyle(0x1A0A00, 0.9);
        topBar.fillRoundedRect(10, 10, GW - 20, 100, 16);
        topBar.lineStyle(3, 0x8B6914);
        topBar.strokeRoundedRect(10, 10, GW - 20, 100, 16);
        this.hudContainer.add(topBar);

        // Coin icon
        const coinIcon = this.add.image(60, 60, 'coin').setScale(1.8);
        this.hudContainer.add(coinIcon);

        // Coin text
        this.coinText = this.add.text(90, 60, '300', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px', color: '#FFD700',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0, 0.5);
        this.hudContainer.add(this.coinText);

        // Dog count
        this.dogIcon = this.add.text(420, 50, 'Dogs:', {
            fontFamily: 'Arial Black', fontSize: '28px', color: '#C4813D',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.hudContainer.add(this.dogIcon);

        this.dogText = this.add.text(480, 60, '1', {
            fontFamily: 'Arial Black', fontSize: '36px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0, 0.5);
        this.hudContainer.add(this.dogText);

        // Wave indicator
        this.waveText = this.add.text(GW - 40, 42, 'Wave 0', {
            fontFamily: 'Arial Black', fontSize: '32px', color: '#FF8844',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(1, 0);
        this.hudContainer.add(this.waveText);

        this.waveTimerText = this.add.text(GW - 40, 78, '', {
            fontFamily: 'Arial', fontSize: '24px', color: '#CCAA88',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(1, 0);
        this.hudContainer.add(this.waveTimerText);

        // Collect all button - draw visuals, use zone for input
        const collectBtnGfx = this.add.graphics();
        collectBtnGfx.fillStyle(0x2E7D32);
        collectBtnGfx.fillRoundedRect(GW / 2 - 100, 125, 200, 55, 12);
        collectBtnGfx.lineStyle(2, 0x4CAF50);
        collectBtnGfx.strokeRoundedRect(GW / 2 - 100, 125, 200, 55, 12);
        collectBtnGfx.setDepth(500).setScrollFactor(0);

        const collectText = this.add.text(GW / 2, 152, 'Collect All', {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(501).setScrollFactor(0);

        const collectZone = this.add.zone(GW / 2, 152, 200, 55)
            .setDepth(502).setScrollFactor(0).setInteractive();
        collectZone.on('pointerdown', () => collectBtnGfx.setAlpha(0.7));
        collectZone.on('pointerup', () => {
            collectBtnGfx.setAlpha(1);
            this.collectAllCoins();
        });
        collectZone.on('pointerout', () => collectBtnGfx.setAlpha(1));
    }

    // --- BUILD BAR ---
    createBuildBar() {
        // Build menu - drawn as standalone graphics + zones (no nested containers for input)
        const types = Object.keys(ROOM_DEFS);
        const PANEL_H = 340;
        const cardW = 240, cardH = 130, cardGap = 12;
        const cardsPerRow = 4;
        const row1Count = 4; // quarters, kitchen, workshop, radio
        const row2Count = 3; // mg, cannon, sniper
        const row1W = row1Count * (cardW + cardGap) - cardGap;
        const row2W = row2Count * (cardW + cardGap) - cardGap;

        this.buildBarContainer = this.add.container(0, GH + PANEL_H + 20).setDepth(510).setScrollFactor(0);

        // Background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1A0A00, 0.95);
        barBg.fillRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        barBg.lineStyle(3, 0x8B6914);
        barBg.strokeRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        this.buildBarContainer.add(barBg);

        // Title
        const barTitle = this.add.text(GW / 2, -PANEL_H + 20, 'BUILD ROOM', {
            fontFamily: 'Arial Black', fontSize: '32px', color: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.buildBarContainer.add(barTitle);

        // Close button visual (in container for positioning)
        const closeTxt = this.add.text(GW - 50, -PANEL_H + 20, 'X', {
            fontFamily: 'Arial Black', fontSize: '36px', color: '#FF6644',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.buildBarContainer.add(closeTxt);

        // Card data for layout updates
        this.buildCards = [];

        // Compute screen positions for cards when menu is OPEN (container.y = GH)
        // Card relative cy within container → screen y = GH + cy
        const openY = GH; // container y when open

        types.forEach((key, i) => {
            const def = ROOM_DEFS[key];
            const row = i < row1Count ? 0 : 1;
            const col = row === 0 ? i : i - row1Count;
            const rowW = row === 0 ? row1W : row2W;
            const rowStartX = (GW - rowW) / 2;
            const cx = rowStartX + col * (cardW + cardGap) + cardW / 2;
            const cy = -PANEL_H + 70 + row * (cardH + 12) + cardH / 2;

            // Card visuals (in container so they animate with menu)
            const g = this.add.graphics();
            g.fillStyle(def.color, 0.9);
            g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
            g.lineStyle(2, 0xFFFFFF, 0.3);
            g.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 10);
            this.buildBarContainer.add(g);

            const nameText = this.add.text(cx, cy - cardH / 2 + 22, def.name, {
                fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5);
            this.buildBarContainer.add(nameText);

            const costText = this.add.text(cx, cy + 8, '', {
                fontFamily: 'Arial Black', fontSize: '28px', color: '#FFD700',
                stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5);
            this.buildBarContainer.add(costText);

            const statText = this.add.text(cx, cy + cardH / 2 - 18, '', {
                fontFamily: 'Arial', fontSize: '20px', color: '#EEEEEE',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5);
            this.buildBarContainer.add(statText);

            // Screen position when menu is open
            const screenX = cx;
            const screenY = openY + cy;

            this.buildCards.push({ key, costText, statText, gfx: g, screenX, screenY });
        });

        // Scene-level interactive zones for cards (NOT inside any container)
        this.buildCardZones = [];
        this.buildCards.forEach((card, i) => {
            const zone = this.add.zone(card.screenX, card.screenY, cardW, cardH)
                .setDepth(520).setScrollFactor(0).setInteractive();
            zone.on('pointerdown', () => {
                if (this.buildMenuOpen) card.gfx.setAlpha(0.6);
            });
            zone.on('pointerup', () => {
                card.gfx.setAlpha(1);
                if (this.buildMenuOpen) this.buildRoom(card.key);
            });
            zone.on('pointerout', () => card.gfx.setAlpha(1));
            zone.disableInteractive(); // start disabled — enabled when menu opens
            this.buildCardZones.push(zone);
        });

        // Scene-level close button zone
        this.buildCloseZone = this.add.zone(GW - 50, openY + (-PANEL_H + 20), 80, 60)
            .setDepth(520).setScrollFactor(0).setInteractive();
        this.buildCloseZone.on('pointerup', () => {
            if (this.buildMenuOpen) this.toggleBuildMenu();
        });
        this.buildCloseZone.disableInteractive(); // start disabled

        // Build button (always visible)
        this.buildBtnGfx = this.add.graphics().setDepth(505).setScrollFactor(0);
        this.drawBuildButton();

        this.buildBtnText = this.add.text(GW / 2, GH - 60, 'BUILD', {
            fontFamily: 'Arial Black', fontSize: '38px', color: '#FFFFFF',
            stroke: '#4A2800', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(506).setScrollFactor(0);

        this.buildBtnZone = this.add.zone(GW / 2, GH - 60, 260, 75)
            .setDepth(507).setScrollFactor(0).setInteractive();
        this.buildBtnZone.on('pointerdown', () => this.buildBtnGfx.setAlpha(0.7));
        this.buildBtnZone.on('pointerup', () => {
            this.buildBtnGfx.setAlpha(1);
            this.toggleBuildMenu();
        });
        this.buildBtnZone.on('pointerout', () => this.buildBtnGfx.setAlpha(1));
    }

    drawBuildButton(y) {
        const by = y !== undefined ? y : (this.buildBtnY || (GH - 60));
        this.buildBtnY = by;
        this.buildBtnGfx.clear();
        this.buildBtnGfx.fillStyle(0xDAA520);
        this.buildBtnGfx.fillRoundedRect(GW / 2 - 120, by - 35, 240, 70, 16);
        this.buildBtnGfx.lineStyle(3, 0xFFD700);
        this.buildBtnGfx.strokeRoundedRect(GW / 2 - 120, by - 35, 240, 70, 16);
    }

    moveBuildButton(targetY) {
        const startY = this.buildBtnY || (GH - 60);
        const duration = 250;
        this.tweens.addCounter({
            from: startY, to: targetY, duration, ease: 'Power2',
            onUpdate: (tween) => {
                const y = tween.getValue();
                this.buildBtnY = y;
                this.buildBtnText.y = y;
                this.buildBtnZone.y = y;
                this.drawBuildButton(y);
            },
        });
    }

    setBuildButtonAlpha(alpha) {
        const dur = 200;
        this.tweens.add({ targets: this.buildBtnGfx, alpha, duration: dur });
        this.tweens.add({ targets: this.buildBtnText, alpha, duration: dur });
        this.tweens.add({ targets: this.buildBtnZone, alpha, duration: dur });
    }

    // --- ROOM PANEL (room details/upgrade) ---
    createRoomPanel() {
        this.roomPanel = this.add.container(GW / 2, GH + 300).setDepth(520).setScrollFactor(0);

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2A1500, 0.95);
        panelBg.fillRoundedRect(-GW / 2 + 20, -150, GW - 40, 300, 16);
        panelBg.lineStyle(3, 0xDAA520);
        panelBg.strokeRoundedRect(-GW / 2 + 20, -150, GW - 40, 300, 16);
        this.roomPanel.add(panelBg);

        this.rpName = this.add.text(0, -130, '', {
            fontFamily: 'Arial Black', fontSize: '34px', color: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpName);

        this.rpLevel = this.add.text(0, -90, '', {
            fontFamily: 'Arial', fontSize: '26px', color: '#CCC',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpLevel);

        this.rpStats = this.add.text(0, -50, '', {
            fontFamily: 'Arial', fontSize: '24px', color: '#AADDAA',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpStats);

        this.rpDogs = this.add.text(0, -15, '', {
            fontFamily: 'Arial', fontSize: '22px', color: '#C4813D',
            stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpDogs);

        // Upgrade button (visuals in container, zones at scene level)
        const upgBg = this.add.graphics();
        upgBg.fillStyle(0x2E7D32);
        upgBg.fillRoundedRect(-200, 20, 190, 60, 10);
        upgBg.lineStyle(2, 0x4CAF50);
        upgBg.strokeRoundedRect(-200, 20, 190, 60, 10);
        this.roomPanel.add(upgBg);

        this.rpUpgText = this.add.text(-105, 50, 'Upgrade', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpUpgText);

        // Assign dog button
        const assignBg = this.add.graphics();
        assignBg.fillStyle(0xC4813D);
        assignBg.fillRoundedRect(10, 20, 190, 60, 10);
        assignBg.lineStyle(2, 0xE8A040);
        assignBg.strokeRoundedRect(10, 20, 190, 60, 10);
        this.roomPanel.add(assignBg);

        this.rpAssignText = this.add.text(105, 50, 'Assign Dog', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpAssignText);

        // Close button
        const rpCloseTxt = this.add.text(GW / 2 - 50, -145, 'X', {
            fontFamily: 'Arial Black', fontSize: '34px', color: '#FF6644',
            stroke: '#000', strokeThickness: 4,
        });
        this.roomPanel.add(rpCloseTxt);

        // Collect from room button
        const collectPanelBg = this.add.graphics();
        collectPanelBg.fillStyle(0xDAA520);
        collectPanelBg.fillRoundedRect(-95, 95, 190, 50, 10);
        collectPanelBg.lineStyle(2, 0xFFD700);
        collectPanelBg.strokeRoundedRect(-95, 95, 190, 50, 10);
        this.roomPanel.add(collectPanelBg);

        this.rpCollectText = this.add.text(0, 120, 'Collect', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpCollectText);

        // Scene-level zones for room panel buttons (positioned for panel at GH - 180)
        const rpOpenY = GH - 180; // panel y when open
        const rpCX = GW / 2;     // panel center x

        this.rpUpgZone = this.add.zone(rpCX - 105, rpOpenY + 50, 190, 60)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpUpgZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.upgradeSelectedRoom();
        });

        this.rpAssignZone = this.add.zone(rpCX + 105, rpOpenY + 50, 190, 60)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpAssignZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.assignDogToSelectedRoom();
        });

        this.rpCloseZone = this.add.zone(rpCX + GW / 2 - 50, rpOpenY - 140, 60, 50)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpCloseZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.hideRoomPanel();
        });

        this.rpCollectZone = this.add.zone(rpCX, rpOpenY + 120, 190, 50)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpCollectZone.on('pointerup', () => {
            if (this.roomPanelOpen && this.selectedRoom >= 0) this.collectCoins(this.selectedRoom);
        });

        // Start all room panel zones disabled
        this.rpUpgZone.disableInteractive();
        this.rpAssignZone.disableInteractive();
        this.rpCloseZone.disableInteractive();
        this.rpCollectZone.disableInteractive();
    }

    // --- INPUT ---
    setupInput() {
        this.input.on('pointerdown', (pointer) => {
            // Ignore if on UI elements with scrollFactor 0
            const screenY = pointer.y;
            if (screenY < 120 || screenY > GH - 100) return;
            if (this.buildMenuOpen && screenY > GH - 250) return;
            if (this.roomPanelOpen && screenY > GH - 350) return;

            this.dragStartY = pointer.y;
            this.lastPointerY = pointer.y;
            this.isDragging = false;
            this.scrollVel = 0;
        });

        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            const dy = pointer.y - this.lastPointerY;
            if (Math.abs(pointer.y - this.dragStartY) > 12) {
                this.isDragging = true;
            }
            if (this.isDragging) {
                this.cameras.main.scrollY -= dy;
                this.scrollVel = -dy;
            }
            this.lastPointerY = pointer.y;
        });

        this.input.on('pointerup', (pointer) => {
            if (!this.isDragging) {
                // Check if tap was on a room (use world coordinates)
                this.handleRoomTap(pointer.worldX, pointer.worldY);
            }
        });
    }

    handleRoomTap(worldX, worldY) {
        for (let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const ry = this.getRoomY(i);
            if (worldX >= FORT_X && worldX <= FORT_X + ROOM_W &&
                worldY >= ry && worldY <= ry + ROOM_H) {
                this.selectRoom(i);
                return;
            }
        }
        // Tapped elsewhere - deselect
        if (this.roomPanelOpen) this.hideRoomPanel();
    }

    // --- TIMERS ---
    setupTimers() {
        // Economy tick every second
        this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => this.economyTick(),
        });

        // Wave countdown
        this.waveCountdown = 60;
        this.time.addEvent({
            delay: 1000, loop: true,
            callback: () => this.waveCountdownTick(),
        });

        // Dog recruitment check
        this.time.addEvent({
            delay: 5000, loop: true,
            callback: () => this.tryRecruitDog(),
        });

        // Auto-save
        this.time.addEvent({
            delay: 30000, loop: true,
            callback: () => this.saveGame(),
        });
    }

    // --- ROOM POSITIONS ---
    getRoomY(index) {
        return GROUND_Y - BASE_H - (index + 1) * (ROOM_H + ROOM_GAP);
    }

    // --- BUILD ROOM ---
    buildRoom(typeKey) {
        const def = ROOM_DEFS[typeKey];
        const cost = this.getRoomCost(typeKey);

        if (this.coins < cost) {
            this.showNotification('Not enough coins!', '#FF4444');
            return;
        }

        this.coins -= cost;
        this.totalRoomsBuilt++;

        const room = {
            type: typeKey,
            level: 1,
            dogs: [],
            accumulated: 0,
            lastFire: 0,
            container: null,
            coinIcon: null,
        };

        const index = this.rooms.length;
        this.rooms.push(room);

        this.createRoomVisual(room, index);

        // Animate room appearing
        room.container.setScale(1, 0);
        this.tweens.add({
            targets: room.container,
            scaleY: 1, duration: 400, ease: 'Back.easeOut',
        });

        // Scroll camera to show new room
        const ry = this.getRoomY(index);
        this.tweens.add({
            targets: this.cameras.main,
            scrollY: ry - GH / 2 + ROOM_H, duration: 600, ease: 'Power2',
        });

        this.showNotification(`Built ${def.name}!`, '#44FF88');
        this.updateHUD();

        // Close build menu
        if (this.buildMenuOpen) this.toggleBuildMenu();
    }

    getRoomCost(typeKey) {
        const def = ROOM_DEFS[typeKey];
        return Math.floor(def.baseCost * (1 + 0.12 * this.totalRoomsBuilt));
    }

    // --- CREATE ROOM VISUAL ---
    createRoomVisual(room, index) {
        const def = ROOM_DEFS[room.type];
        const ry = this.getRoomY(index);
        const container = this.add.container(FORT_CX, ry + ROOM_H / 2).setDepth(20);

        // Room background - cross section / open interior style
        const bg = this.add.graphics();
        // Back wall
        bg.fillStyle(def.colorDark);
        bg.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        // Floor
        bg.fillStyle(def.color);
        bg.fillRect(-ROOM_W / 2, ROOM_H / 2 - 20, ROOM_W, 20);
        // Interior fill (lighter)
        const light = Phaser.Display.Color.ValueToColor(def.color).lighten(20).color;
        bg.fillStyle(light, 0.35);
        bg.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H - 20);
        // Thin side walls (structural edges)
        bg.fillStyle(0x5A4A3A);
        bg.fillRect(-ROOM_W / 2 - 6, -ROOM_H / 2, 6, ROOM_H);
        bg.fillRect(ROOM_W / 2, -ROOM_H / 2, 6, ROOM_H);
        // Top/bottom lines
        bg.lineStyle(2, 0x3A2A1A, 0.6);
        bg.strokeRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        container.add(bg);

        // Room interior details
        this.drawRoomDetails(container, room.type, ROOM_W, ROOM_H);

        // Room name
        const nameTag = this.add.text(-ROOM_W / 2 + 12, -ROOM_H / 2 + 6, def.name, {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 4,
        });
        container.add(nameTag);

        // Level badge
        const lvlBg = this.add.graphics();
        lvlBg.fillStyle(0x000000, 0.5);
        lvlBg.fillRoundedRect(ROOM_W / 2 - 75, -ROOM_H / 2 + 5, 65, 32, 8);
        container.add(lvlBg);

        const lvlText = this.add.text(ROOM_W / 2 - 42, -ROOM_H / 2 + 21, 'Lv.1', {
            fontFamily: 'Arial Black', fontSize: '22px', color: '#FFD700',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        container.add(lvlText);
        room.lvlText = lvlText;

        // Coin indicator (for income rooms)
        if (def.baseIncome > 0) {
            const coinContainer = this.add.container(ROOM_W / 2 - 80, 20);
            const cIcon = this.add.image(0, 0, 'coin').setScale(1.2);
            coinContainer.add(cIcon);
            const cText = this.add.text(20, 0, '0', {
                fontFamily: 'Arial Black', fontSize: '24px', color: '#FFD700',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0, 0.5);
            coinContainer.add(cText);
            coinContainer.setAlpha(0);
            container.add(coinContainer);
            room.coinIcon = coinContainer;
            room.coinText = cText;

            // Pulsing animation for coin icon
            this.tweens.add({
                targets: cIcon, scaleX: 1.4, scaleY: 1.4,
                duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        }

        // Turret barrel (for turret rooms)
        if (def.category === 'turret') {
            const barrel = this.add.graphics();
            barrel.fillStyle(0x333333);
            if (room.type === 'cannon') {
                barrel.fillRoundedRect(0, -8, 70, 16, 4);
                barrel.fillCircle(0, 0, 14);
                barrel.fillStyle(0x222222);
                barrel.fillCircle(70, 0, 8);
            } else if (room.type === 'sniper') {
                barrel.fillRect(0, -4, 80, 8);
                barrel.fillCircle(0, 0, 10);
                barrel.fillStyle(0x5555CC);
                barrel.fillCircle(80, 0, 5);
            } else {
                barrel.fillRect(0, -5, 50, 10);
                barrel.fillCircle(0, 0, 12);
                barrel.fillStyle(0x222222);
                barrel.fillCircle(50, 0, 4);
            }
            barrel.setPosition(ROOM_W / 2 - 30, 15);
            container.add(barrel);
            room.barrel = barrel;
            room.barrelSide = 1; // 1 = right, -1 = left
        }

        room.container = container;
    }

    drawRoomDetails(container, type, w, h) {
        const g = this.add.graphics();
        const hw = w / 2, hh = h / 2;

        switch (type) {
            case 'quarters':
                // Bunk beds
                for (let i = 0; i < 3; i++) {
                    const bx = -hw + 40 + i * Math.floor((w - 120) / 2);
                    g.fillStyle(0x6B3A1A);
                    g.fillRect(bx, -20, 60, 55); // frame
                    g.fillStyle(0x8B5A3A);
                    g.fillRect(bx + 5, -15, 50, 22); // top bunk
                    g.fillRect(bx + 5, 15, 50, 22); // bottom bunk
                    g.fillStyle(0xDDCCBB);
                    g.fillRect(bx + 8, -12, 18, 16); // pillow top
                    g.fillRect(bx + 8, 18, 18, 16); // pillow bottom
                }
                // Rug
                g.fillStyle(0x993333, 0.5);
                g.fillRoundedRect(-50, 25, 100, 20, 4);
                break;

            case 'kitchen':
                // Stove
                g.fillStyle(0x444444);
                g.fillRoundedRect(-hw + 60, -10, 120, 60, 4);
                g.fillStyle(0x222222);
                g.fillCircle(-hw + 90, 5, 15);
                g.fillCircle(-hw + 140, 5, 15);
                g.fillStyle(0xFF4400, 0.6);
                g.fillCircle(-hw + 90, 5, 8);
                // Counter
                g.fillStyle(0xAA8855);
                g.fillRect(hw - 160, 5, 120, 50);
                g.fillStyle(0xBB9966);
                g.fillRect(hw - 158, 5, 116, 8);
                // Plates
                g.fillStyle(0xEEEEEE);
                g.fillCircle(0, 20, 18);
                g.fillCircle(40, 20, 18);
                g.fillStyle(0xDDDDDD);
                g.fillCircle(0, 20, 12);
                g.fillCircle(40, 20, 12);
                break;

            case 'workshop':
                // Workbench
                g.fillStyle(0x8B6914);
                g.fillRect(-hw + 80, 5, 200, 45);
                g.fillStyle(0x6B4F12);
                g.fillRect(-hw + 80, 5, 200, 8);
                // Gears
                g.lineStyle(3, 0xBBBBBB);
                g.strokeCircle(hw - 120, -10, 20);
                g.strokeCircle(hw - 90, 10, 15);
                // Tools on wall
                g.lineStyle(3, 0x888888);
                g.beginPath(); g.moveTo(-hw + 50, -30); g.lineTo(-hw + 50, 5); g.strokePath();
                g.beginPath(); g.moveTo(-hw + 70, -25); g.lineTo(-hw + 70, 5); g.strokePath();
                // Anvil
                g.fillStyle(0x555555);
                g.fillRect(0, 20, 40, 25);
                g.fillRect(-5, 15, 50, 10);
                break;

            case 'radio':
                // Antenna
                g.lineStyle(4, 0xCCCCCC);
                g.beginPath(); g.moveTo(0, -hh + 15); g.lineTo(0, -10); g.strokePath();
                // Antenna top
                g.fillStyle(0xFF0000);
                g.fillCircle(0, -hh + 15, 6);
                // Signal waves
                g.lineStyle(2, 0x44FF88, 0.6);
                for (let r = 1; r <= 3; r++) {
                    g.beginPath();
                    g.arc(0, -hh + 15, r * 25, -0.8, 0.8, false);
                    g.strokePath();
                    g.beginPath();
                    g.arc(0, -hh + 15, r * 25, Math.PI - 0.8, Math.PI + 0.8, false);
                    g.strokePath();
                }
                // Console
                g.fillStyle(0x2A2A2A);
                g.fillRoundedRect(-hw + 60, 0, 160, 50, 6);
                g.fillStyle(0x003300);
                g.fillRect(-hw + 70, 8, 80, 35);
                // Blinking lights
                g.fillStyle(0x00FF00);
                g.fillCircle(-hw + 170, 15, 5);
                g.fillStyle(0xFF0000);
                g.fillCircle(-hw + 190, 15, 5);
                g.fillStyle(0xFFFF00);
                g.fillCircle(-hw + 180, 15, 5);
                break;

            case 'machinegun':
                // Ammo boxes
                g.fillStyle(0x556B2F);
                g.fillRect(-hw + 60, 15, 50, 35);
                g.fillRect(-hw + 120, 15, 50, 35);
                g.lineStyle(2, 0x333300);
                g.strokeRect(-hw + 60, 15, 50, 35);
                g.strokeRect(-hw + 120, 15, 50, 35);
                // Sandbags
                g.fillStyle(0xC2B280);
                for (let i = 0; i < 4; i++) {
                    g.fillRoundedRect(hw - 220 + i * 50, 25, 45, 22, 6);
                }
                break;

            case 'cannon':
                // Cannonballs stacked
                g.fillStyle(0x222222);
                g.fillCircle(-hw + 100, 35, 14);
                g.fillCircle(-hw + 130, 35, 14);
                g.fillCircle(-hw + 115, 18, 14);
                // Reinforced walls
                g.fillStyle(0x444444, 0.4);
                g.fillRect(-hw + 5, -hh + 5, 30, h - 10);
                g.fillRect(hw - 35, -hh + 5, 30, h - 10);
                // Powder kegs
                g.fillStyle(0x5A2D0C);
                g.fillRoundedRect(hw - 180, 10, 40, 45, 8);
                g.fillStyle(0x000000);
                g.fillRect(hw - 170, 5, 20, 8);
                break;

            case 'sniper':
                // Scope/binoculars
                g.fillStyle(0x333355);
                g.fillRect(-hw + 80, -20, 60, 30);
                g.fillStyle(0x5555AA);
                g.fillCircle(-hw + 80, -5, 12);
                g.fillCircle(-hw + 140, -5, 12);
                // Camo netting
                g.lineStyle(2, 0x556B2F, 0.6);
                for (let i = 0; i < 6; i++) {
                    g.beginPath();
                    g.moveTo(-hw + 200 + i * 40, -hh + 5);
                    g.lineTo(-hw + 220 + i * 40, hh - 5);
                    g.strokePath();
                }
                // Ammo belt
                g.fillStyle(0x888844);
                g.fillRect(hw - 250, 30, 120, 12);
                for (let i = 0; i < 8; i++) {
                    g.fillStyle(0xAAAA44);
                    g.fillRect(hw - 248 + i * 15, 28, 10, 16);
                }
                break;
        }

        container.add(g);
    }

    // --- ECONOMY ---
    economyTick() {
        this.rooms.forEach((room, i) => {
            const def = ROOM_DEFS[room.type];
            if (def.baseIncome <= 0) return;

            const dogBonus = 1 + room.dogs.length * 0.15;
            const income = def.baseIncome * room.level * dogBonus;
            room.accumulated += income;

            // Update coin indicator
            if (room.coinIcon) {
                const amt = Math.floor(room.accumulated);
                if (amt > 0) {
                    room.coinIcon.setAlpha(1);
                    room.coinText.setText(amt.toString());
                } else {
                    room.coinIcon.setAlpha(0);
                }
            }
        });
    }

    collectCoins(roomIndex) {
        const room = this.rooms[roomIndex];
        if (!room || room.accumulated < 1) return;

        const amount = Math.floor(room.accumulated);
        room.accumulated = 0;
        this.coins += amount;

        // Visual feedback
        if (room.coinIcon) room.coinIcon.setAlpha(0);

        // Floating text
        const ry = this.getRoomY(roomIndex);
        const floatText = this.add.text(FORT_CX, ry + ROOM_H / 2, `+${amount}`, {
            fontFamily: 'Arial Black', fontSize: '36px', color: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: floatText, y: ry - 20, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => floatText.destroy(),
        });

        this.updateHUD();

        // Update panel if open
        if (this.roomPanelOpen && this.selectedRoom === roomIndex) {
            this.updateRoomPanel();
        }
    }

    collectAllCoins() {
        let total = 0;
        this.rooms.forEach((room, i) => {
            if (room.accumulated >= 1) {
                total += Math.floor(room.accumulated);
                room.accumulated = 0;
                if (room.coinIcon) room.coinIcon.setAlpha(0);
            }
        });

        if (total > 0) {
            this.coins += total;
            this.showNotification(`Collected ${total} coins!`, '#FFD700');
            this.updateHUD();

            // Big floating text at center of screen
            const camY = this.cameras.main.scrollY + GH / 2;
            const floatText = this.add.text(FORT_CX, camY, `+${total}`, {
                fontFamily: 'Arial Black', fontSize: '52px', color: '#FFD700',
                stroke: '#000', strokeThickness: 6,
            }).setOrigin(0.5).setDepth(100);

            this.tweens.add({
                targets: floatText, y: camY - 80, alpha: 0, scaleX: 1.5, scaleY: 1.5,
                duration: 1000, ease: 'Power2',
                onComplete: () => floatText.destroy(),
            });
        }
    }

    // --- ROOM SELECTION ---
    selectRoom(index) {
        this.selectedRoom = index;
        this.showRoomPanel();
    }

    showRoomPanel() {
        if (this.selectedRoom < 0) return;
        this.roomPanelOpen = true;
        this.updateRoomPanel();

        this.tweens.add({
            targets: this.roomPanel, y: GH - 180,
            duration: 300, ease: 'Power2',
        });

        // Hide build button
        this.setBuildButtonAlpha(0);

        // Enable room panel zones
        this.rpUpgZone.setInteractive();
        this.rpAssignZone.setInteractive();
        this.rpCloseZone.setInteractive();
        this.rpCollectZone.setInteractive();

        // Highlight selected room
        const room = this.rooms[this.selectedRoom];
        if (room && room.container) {
            // Flash effect
            this.tweens.add({
                targets: room.container, alpha: 0.7,
                duration: 100, yoyo: true, repeat: 1,
            });
        }
    }

    updateRoomPanel() {
        const room = this.rooms[this.selectedRoom];
        if (!room) return;
        const def = ROOM_DEFS[room.type];

        this.rpName.setText(def.name);
        this.rpLevel.setText(`Level ${room.level}`);

        if (def.category === 'turret') {
            const dmg = def.baseDamage * room.level * (1 + room.dogs.length * 0.2);
            this.rpStats.setText(`Damage: ${Math.floor(dmg)}  |  Rate: ${(def.fireRate / 1000).toFixed(1)}s  |  Range: ${def.range}`);
        } else if (def.baseIncome > 0) {
            const dogBonus = 1 + room.dogs.length * 0.15;
            const income = def.baseIncome * room.level * dogBonus;
            this.rpStats.setText(`Income: ${income.toFixed(1)}/s  |  Stored: ${Math.floor(room.accumulated)}`);
        } else {
            this.rpStats.setText(def.desc);
        }

        this.rpDogs.setText(`Dogs: ${room.dogs.length} assigned`);

        const upgCost = this.getUpgradeCost(room);
        this.rpUpgText.setText(`Upgrade: ${upgCost}c`);
        this.rpCollectText.setText(`Collect: ${Math.floor(room.accumulated)}c`);
    }

    hideRoomPanel() {
        this.roomPanelOpen = false;
        this.selectedRoom = -1;

        this.tweens.add({
            targets: this.roomPanel, y: GH + 300,
            duration: 300, ease: 'Power2',
        });

        this.setBuildButtonAlpha(1);

        // Disable room panel zones
        this.rpUpgZone.disableInteractive();
        this.rpAssignZone.disableInteractive();
        this.rpCloseZone.disableInteractive();
        this.rpCollectZone.disableInteractive();
    }

    // --- UPGRADES ---
    getUpgradeCost(room) {
        const def = ROOM_DEFS[room.type];
        return Math.floor(def.baseCost * 0.6 * room.level * (1 + room.level * 0.1));
    }

    upgradeSelectedRoom() {
        if (this.selectedRoom < 0) return;
        const room = this.rooms[this.selectedRoom];
        const cost = this.getUpgradeCost(room);

        if (this.coins < cost) {
            this.showNotification('Not enough coins!', '#FF4444');
            return;
        }

        this.coins -= cost;
        room.level++;

        // Update visual
        room.lvlText.setText(`Lv.${room.level}`);

        // Flash room
        if (room.container) {
            this.tweens.add({
                targets: room.container, scaleX: 1.03, scaleY: 1.03,
                duration: 150, yoyo: true, ease: 'Power2',
            });
        }

        // Particles
        const ry = this.getRoomY(this.selectedRoom);
        this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0xFFD700, 15);

        this.showNotification(`Upgraded to Lv.${room.level}!`, '#44FF88');
        this.updateHUD();
        this.updateRoomPanel();
    }

    // --- BUILD MENU ---
    toggleBuildMenu() {
        this.buildMenuOpen = !this.buildMenuOpen;

        // Update costs on cards
        this.buildCards.forEach(card => {
            const cost = this.getRoomCost(card.key);
            const def = ROOM_DEFS[card.key];
            card.costText.setText(`${cost}c`);
            card.costText.setColor(this.coins >= cost ? '#FFD700' : '#FF4444');
            if (def.baseIncome > 0) {
                card.statText.setText(`+${def.baseIncome}/s`);
            } else if (def.baseDamage) {
                card.statText.setText(`Dmg: ${def.baseDamage}`);
            } else {
                card.statText.setText('Recruit dogs');
            }
        });

        if (this.buildMenuOpen) {
            if (this.roomPanelOpen) this.hideRoomPanel();
            this.tweens.add({
                targets: this.buildBarContainer, y: GH,
                duration: 300, ease: 'Back.easeOut',
            });
            this.moveBuildButton(GH - 410);
            // Enable card & close zones
            this.buildCardZones.forEach(z => z.setInteractive());
            this.buildCloseZone.setInteractive();
        } else {
            this.tweens.add({
                targets: this.buildBarContainer, y: GH + 400,
                duration: 200, ease: 'Power2',
            });
            this.moveBuildButton(GH - 60);
            // Disable card & close zones
            this.buildCardZones.forEach(z => z.disableInteractive());
            this.buildCloseZone.disableInteractive();
        }
    }

    // --- DOGS ---
    addDog() {
        const breed = DOG_BREEDS[Phaser.Math.Between(0, DOG_BREEDS.length - 1)];
        const breedIndex = DOG_BREEDS.indexOf(breed);
        const name = DOG_NAMES[Phaser.Math.Between(0, DOG_NAMES.length - 1)];

        const dog = {
            name: name,
            breed: breed.name,
            breedIndex: breedIndex,
            bonus: breed.bonus,
            assignedRoom: -1,
            sprite: null,
        };

        this.dogs.push(dog);
        this.updateHUD();
        return dog;
    }

    tryRecruitDog() {
        // Need a radio tower
        const radioRooms = this.rooms.filter(r => r.type === 'radio');
        if (radioRooms.length === 0) return;

        // Higher chance with more/better radio rooms
        const totalLevel = radioRooms.reduce((sum, r) => sum + r.level, 0);
        const chance = 0.15 + totalLevel * 0.05;

        if (Math.random() < chance) {
            const dog = this.addDog();
            this.showNotification(`${dog.name} the ${dog.breed} joined!`, '#44FF88');

            // Celebration particles at radio rooms
            radioRooms.forEach(r => {
                const idx = this.rooms.indexOf(r);
                const ry = this.getRoomY(idx);
                this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0x44FF88, 10);
            });
        }
    }

    assignDogToSelectedRoom() {
        if (this.selectedRoom < 0) return;
        const room = this.rooms[this.selectedRoom];

        // Find unassigned dog
        const freeDog = this.dogs.find(d => d.assignedRoom === -1);
        if (!freeDog) {
            this.showNotification('No free dogs! Build a Radio Tower.', '#FF8844');
            return;
        }

        // Max 3 dogs per room
        if (room.dogs.length >= 3) {
            this.showNotification('Room is full! (max 3 dogs)', '#FF8844');
            return;
        }

        freeDog.assignedRoom = this.selectedRoom;
        room.dogs.push(freeDog);

        // Add dog sprite inside room
        const ry = this.getRoomY(this.selectedRoom);
        const dogX = FORT_CX - ROOM_W / 3 + room.dogs.length * 80;
        const dogSprite = this.add.image(dogX, ry + ROOM_H - 25, 'dog_' + freeDog.breedIndex);
        dogSprite.setScale(1.5).setDepth(25);
        freeDog.sprite = dogSprite;

        // Idle animation
        this.tweens.add({
            targets: dogSprite, x: dogX + 30,
            duration: Phaser.Math.Between(1500, 2500),
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        this.showNotification(`${freeDog.name} assigned!`, '#C4813D');
        this.updateRoomPanel();
    }

    // --- WAVES / COMBAT ---
    waveCountdownTick() {
        if (this.waveActive) {
            this.waveTimerText.setText(`${this.enemiesAlive} enemies left`);
            return;
        }

        this.waveCountdown--;
        if (this.waveCountdown <= 10) {
            this.waveTimerText.setText(`Next wave: ${this.waveCountdown}s`);
            this.waveTimerText.setColor(this.waveCountdown <= 5 ? '#FF4444' : '#FFAA44');
        } else {
            this.waveTimerText.setText(`Next wave: ${this.waveCountdown}s`);
            this.waveTimerText.setColor('#CCAA88');
        }

        if (this.waveCountdown <= 0) {
            this.startWave();
        }
    }

    startWave() {
        this.wave++;
        this.waveActive = true;
        this.waveText.setText(`Wave ${this.wave}`);

        // Show wave warning
        const warnText = this.add.text(GW / 2, GH / 2, `WAVE ${this.wave}`, {
            fontFamily: 'Arial Black', fontSize: '72px', color: '#FF4444',
            stroke: '#000', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(600).setScrollFactor(0);

        this.tweens.add({
            targets: warnText, scaleX: 1.5, scaleY: 1.5, alpha: 0,
            duration: 1500, ease: 'Power2',
            onComplete: () => warnText.destroy(),
        });

        // Determine enemies for this wave
        const numEnemies = Math.min(3 + this.wave * 2, 30);
        this.enemiesAlive = numEnemies;

        const spawnDelay = Math.max(400, 2000 - this.wave * 50);

        for (let i = 0; i < numEnemies; i++) {
            this.time.delayedCall(i * spawnDelay, () => {
                let type = 'wolf';
                const roll = Math.random();
                if (this.wave >= 3 && roll < 0.3) type = 'cat';
                if (this.wave >= 5 && roll < 0.15) type = 'raccoon';
                if (this.wave >= 8 && this.wave % 5 === 0 && i === numEnemies - 1) type = 'bear';

                const side = Math.random() < 0.5 ? 'left' : 'right';
                this.spawnEnemy(type, side);
            });
        }
    }

    spawnEnemy(type, side) {
        const def = ENEMY_DEFS[type];
        const hpScale = 1 + (this.wave - 1) * 0.2;
        const speedScale = 1 + (this.wave - 1) * 0.05;

        const texKey = 'enemy_' + type;
        const x = side === 'left' ? -def.size : GW + def.size;
        const y = GROUND_Y - def.size / 2 - 5;

        const sprite = this.add.image(x, y, texKey).setDepth(15);
        sprite.setScale(1.8);
        if (side === 'right') sprite.setFlipX(true);

        // Health bar background
        const hpBarBg = this.add.graphics();
        hpBarBg.fillStyle(0x000000, 0.7);
        hpBarBg.fillRect(-25, -def.size - 10, 50, 8);
        hpBarBg.setPosition(x, y).setDepth(16);

        // Health bar fill
        const hpBar = this.add.graphics();
        hpBar.fillStyle(0xFF0000);
        hpBar.fillRect(-24, -def.size - 9, 48, 6);
        hpBar.setPosition(x, y).setDepth(17);

        const enemy = {
            type, sprite, hpBarBg, hpBar,
            x, y,
            hp: def.hp * hpScale,
            maxHp: def.hp * hpScale,
            speed: def.speed * speedScale,
            steal: def.steal,
            reward: Math.floor(def.reward * (1 + this.wave * 0.1)),
            size: def.size,
            side,
            atFortress: false,
            stealTimer: 0,
        };

        this.enemies.push(enemy);

        // Bob animation
        this.tweens.add({
            targets: sprite, y: y - 6,
            duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
    }

    updateEnemies(delta) {
        const fortLeft = FORT_CX - ROOM_W / 2 - 20;
        const fortRight = FORT_CX + ROOM_W / 2 + 20;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (!e.atFortress) {
                // Move toward fortress
                if (e.side === 'left') {
                    e.x += e.speed * delta / 1000;
                    if (e.x >= fortLeft) {
                        e.atFortress = true;
                        e.x = fortLeft;
                    }
                } else {
                    e.x -= e.speed * delta / 1000;
                    if (e.x <= fortRight) {
                        e.atFortress = true;
                        e.x = fortRight;
                    }
                }

                e.sprite.x = e.x;
                e.hpBarBg.x = e.x;
                e.hpBar.x = e.x;
            } else {
                // Stealing coins
                e.stealTimer += delta;
                if (e.stealTimer >= 1000) {
                    e.stealTimer = 0;
                    const stolen = Math.min(e.steal, this.coins);
                    if (stolen > 0) {
                        this.coins -= stolen;
                        this.updateHUD();

                        // Visual - red floating text
                        const ft = this.add.text(e.x, e.y - 40, `-${stolen}`, {
                            fontFamily: 'Arial Black', fontSize: '28px', color: '#FF4444',
                            stroke: '#000', strokeThickness: 3,
                        }).setOrigin(0.5).setDepth(100);
                        this.tweens.add({
                            targets: ft, y: ft.y - 30, alpha: 0,
                            duration: 600, onComplete: () => ft.destroy(),
                        });
                    }
                }

                // Shake when attacking
                e.sprite.x = e.x + Math.sin(this.time.now * 0.02) * 3;
            }
        }
    }

    updateTurrets(time) {
        this.rooms.forEach((room, i) => {
            const def = ROOM_DEFS[room.type];
            if (def.category !== 'turret') return;
            if (this.enemies.length === 0) return;

            // Cooldown check
            if (time - room.lastFire < def.fireRate) return;

            // Find nearest enemy in range
            const ry = this.getRoomY(i) + ROOM_H / 2;
            let nearest = null;
            let nearestDist = Infinity;

            this.enemies.forEach(e => {
                const dx = e.x - FORT_CX;
                const dy = e.y - ry;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < def.range && dist < nearestDist) {
                    nearest = e;
                    nearestDist = dist;
                }
            });

            if (nearest) {
                room.lastFire = time;
                this.fireProjectile(room, i, nearest);

                // Rotate barrel toward target
                if (room.barrel) {
                    const angle = Phaser.Math.Angle.Between(FORT_CX, ry, nearest.x, nearest.y);
                    room.barrel.setRotation(angle);
                    room.barrelSide = nearest.x > FORT_CX ? 1 : -1;
                    room.barrel.x = (ROOM_W / 2 - 30) * room.barrelSide;
                }
            }
        });
    }

    fireProjectile(room, roomIndex, target) {
        const def = ROOM_DEFS[room.type];
        const ry = this.getRoomY(roomIndex) + ROOM_H / 2;
        const startX = FORT_CX + (ROOM_W / 2) * (target.x > FORT_CX ? 1 : -1);
        const startY = ry;

        const texKey = room.type === 'cannon' ? 'cannonball' : 'bullet';
        const sprite = this.add.image(startX, startY, texKey).setDepth(30);
        sprite.setScale(room.type === 'cannon' ? 1.5 : 1);

        const dogBonus = 1 + room.dogs.length * 0.2;
        const damage = def.baseDamage * room.level * dogBonus;

        const proj = {
            sprite, damage,
            targetX: target.x,
            targetY: target.y,
            speed: room.type === 'cannon' ? 600 : room.type === 'sniper' ? 1200 : 800,
            target: target,
            type: room.type,
        };

        this.projectiles.push(proj);

        // Muzzle flash
        const flash = this.add.graphics();
        flash.fillStyle(0xFFFF44, 0.8);
        flash.fillCircle(startX, startY, room.type === 'cannon' ? 20 : 12);
        flash.setDepth(31);
        this.tweens.add({
            targets: flash, alpha: 0, duration: 100,
            onComplete: () => flash.destroy(),
        });

        // Screen shake for cannon
        if (room.type === 'cannon') {
            this.cameras.main.shake(100, 0.005);
        }
    }

    updateProjectiles(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const tx = p.target.x || p.targetX;
            const ty = p.target.y || p.targetY;

            const angle = Math.atan2(ty - p.sprite.y, tx - p.sprite.x);
            p.sprite.x += Math.cos(angle) * p.speed * delta / 1000;
            p.sprite.y += Math.sin(angle) * p.speed * delta / 1000;

            // Check if reached target area
            const dx = tx - p.sprite.x;
            const dy = ty - p.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) {
                // Hit! Find enemy to damage
                let hitEnemy = null;

                // Try to hit the targeted enemy first
                if (this.enemies.includes(p.target)) {
                    hitEnemy = p.target;
                } else {
                    // Find closest enemy to impact point
                    let closestDist = 50;
                    this.enemies.forEach(e => {
                        const d = Math.sqrt((e.x - p.sprite.x) ** 2 + (e.y - p.sprite.y) ** 2);
                        if (d < closestDist) {
                            closestDist = d;
                            hitEnemy = e;
                        }
                    });
                }

                if (hitEnemy) {
                    this.damageEnemy(hitEnemy, p.damage);

                    // Cannon splash damage
                    if (p.type === 'cannon') {
                        this.enemies.forEach(e => {
                            if (e === hitEnemy) return;
                            const d = Math.sqrt((e.x - p.sprite.x) ** 2 + (e.y - p.sprite.y) ** 2);
                            if (d < 100) {
                                this.damageEnemy(e, p.damage * 0.4);
                            }
                        });
                    }
                }

                // Impact effect
                this.spawnParticles(p.sprite.x, p.sprite.y, 0xFFAA00, p.type === 'cannon' ? 12 : 5);

                p.sprite.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }

            // Remove if off screen
            if (p.sprite.x < -100 || p.sprite.x > GW + 100 || p.sprite.y < -100 || p.sprite.y > GROUND_Y + 200) {
                p.sprite.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }

    damageEnemy(enemy, damage) {
        enemy.hp -= damage;

        // Update HP bar
        const pct = Math.max(0, enemy.hp / enemy.maxHp);
        enemy.hpBar.clear();
        const color = pct > 0.5 ? 0x00FF00 : pct > 0.25 ? 0xFFAA00 : 0xFF0000;
        enemy.hpBar.fillStyle(color);
        enemy.hpBar.fillRect(-24, -enemy.size - 9, 48 * pct, 6);

        // Flash white
        enemy.sprite.setTint(0xFFFFFF);
        this.time.delayedCall(80, () => {
            if (enemy.sprite && enemy.sprite.active) enemy.sprite.clearTint();
        });

        if (enemy.hp <= 0) {
            this.killEnemy(enemy);
        }
    }

    killEnemy(enemy) {
        // Reward
        this.coins += enemy.reward;
        this.updateHUD();

        // Floating reward text
        const ft = this.add.text(enemy.x, enemy.y - 30, `+${enemy.reward}`, {
            fontFamily: 'Arial Black', fontSize: '30px', color: '#44FF88',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(100);
        this.tweens.add({
            targets: ft, y: ft.y - 50, alpha: 0,
            duration: 700, onComplete: () => ft.destroy(),
        });

        // Death particles
        const eColor = ENEMY_DEFS[enemy.type].color;
        this.spawnParticles(enemy.x, enemy.y, eColor, 15);

        // Cleanup
        enemy.sprite.destroy();
        enemy.hpBarBg.destroy();
        enemy.hpBar.destroy();

        const idx = this.enemies.indexOf(enemy);
        if (idx >= 0) this.enemies.splice(idx, 1);

        this.enemiesAlive--;

        // Check if wave complete
        if (this.enemiesAlive <= 0 && this.waveActive) {
            this.waveComplete();
        }
    }

    waveComplete() {
        this.waveActive = false;
        this.waveCountdown = Math.max(20, 35 - this.wave);

        const bonus = this.wave * 15;
        this.coins += bonus;
        this.updateHUD();

        this.showNotification(`Wave ${this.wave} complete! +${bonus} bonus!`, '#44FF88');

        // Victory text
        const vText = this.add.text(GW / 2, GH / 2, 'WAVE CLEARED!', {
            fontFamily: 'Arial Black', fontSize: '56px', color: '#44FF88',
            stroke: '#000', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(600).setScrollFactor(0);

        this.tweens.add({
            targets: vText, scaleX: 1.3, scaleY: 1.3, alpha: 0,
            duration: 1500, ease: 'Power2', delay: 500,
            onComplete: () => vText.destroy(),
        });
    }

    // --- PARTICLES ---
    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const p = this.add.graphics();
            const size = Phaser.Math.Between(3, 8);
            p.fillStyle(color);
            p.fillCircle(0, 0, size);
            p.setPosition(x, y).setDepth(99);

            const angle = Math.random() * Math.PI * 2;
            const speed = Phaser.Math.Between(80, 250);
            const tx = x + Math.cos(angle) * speed;
            const ty = y + Math.sin(angle) * speed - Phaser.Math.Between(20, 60);

            this.tweens.add({
                targets: p, x: tx, y: ty, alpha: 0, scaleX: 0, scaleY: 0,
                duration: Phaser.Math.Between(300, 700), ease: 'Power2',
                onComplete: () => p.destroy(),
            });
        }
    }

    // --- NOTIFICATIONS ---
    showNotification(text, color) {
        const notif = this.add.text(GW / 2, 200, text, {
            fontFamily: 'Arial Black', fontSize: '28px', color: color || '#FFFFFF',
            stroke: '#000000', strokeThickness: 4,
            align: 'center',
        }).setOrigin(0.5).setDepth(550).setScrollFactor(0);

        // Push existing notifications down
        this.notifications.forEach((n, i) => {
            this.tweens.add({ targets: n, y: n.y + 45, duration: 200 });
        });
        this.notifications.push(notif);

        // Remove after delay
        this.tweens.add({
            targets: notif, alpha: 0, y: notif.y - 30,
            duration: 500, delay: 2500, ease: 'Power2',
            onComplete: () => {
                notif.destroy();
                const idx = this.notifications.indexOf(notif);
                if (idx >= 0) this.notifications.splice(idx, 1);
            },
        });

        // Limit notifications
        if (this.notifications.length > 5) {
            const old = this.notifications.shift();
            if (old && old.active) old.destroy();
        }
    }

    // --- HUD UPDATE ---
    updateHUD() {
        this.coinText.setText(Math.floor(this.coins).toLocaleString());
        this.dogText.setText(this.dogs.length.toString());

        // Pulse coin text on change
        this.tweens.add({
            targets: this.coinText, scaleX: 1.2, scaleY: 1.2,
            duration: 100, yoyo: true,
        });
    }

    // --- SAVE/LOAD ---
    saveGame() {
        const data = {
            coins: this.coins,
            wave: this.wave,
            totalRoomsBuilt: this.totalRoomsBuilt,
            rooms: this.rooms.map(r => ({
                type: r.type, level: r.level,
                accumulated: r.accumulated,
                dogCount: r.dogs.length,
            })),
            dogs: this.dogs.map(d => ({
                name: d.name, breed: d.breed,
                breedIndex: d.breedIndex, bonus: d.bonus,
                assignedRoom: d.assignedRoom,
            })),
        };
        try {
            localStorage.setItem('dogFortress_save', JSON.stringify(data));
        } catch (e) { /* ignore */ }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('dogFortress_save');
            if (!raw) return false;
            const data = JSON.parse(raw);
            // TODO: restore state from save
            return true;
        } catch (e) {
            return false;
        }
    }

    // --- MAIN UPDATE LOOP ---
    update(time, delta) {
        // Camera momentum scrolling
        if (!this.input.activePointer.isDown && Math.abs(this.scrollVel) > 0.5) {
            this.cameras.main.scrollY += this.scrollVel;
            this.scrollVel *= 0.9;
        } else if (!this.input.activePointer.isDown) {
            this.scrollVel = 0;
        }

        // Clamp camera
        const topRoom = this.rooms.length > 0
            ? this.getRoomY(this.rooms.length - 1) - 200
            : GROUND_Y - BASE_H - 400;
        const minScroll = Math.min(topRoom, GROUND_Y - GH);
        const maxScroll = GROUND_Y - GH + 400;
        this.cameras.main.scrollY = Phaser.Math.Clamp(this.cameras.main.scrollY, minScroll, maxScroll);

        // Update combat
        this.updateEnemies(delta);
        this.updateTurrets(time);
        this.updateProjectiles(delta);

        // Update build menu card costs if open
        if (this.buildMenuOpen && this.buildCards) {
            this.buildCards.forEach(card => {
                const cost = this.getRoomCost(card.key);
                card.costText.setColor(this.coins >= cost ? '#FFD700' : '#FF4444');
            });
        }
    }
}

// ============================================================
// PHASER CONFIG & LAUNCH
// ============================================================
const config = {
    type: Phaser.AUTO,
    backgroundColor: '#1a0a00',
    scale: {
        parent: 'game-container',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GW,
        height: GH,
    },
    scene: [BootScene, MenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { debug: false },
    },
    input: {
        activePointers: 3,
    },
    render: {
        pixelArt: false,
        antialias: true,
    },
};

const game = new Phaser.Game(config);
