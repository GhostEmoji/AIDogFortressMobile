// ============================================================
// DOG FORTRESS - A Phaser 3 Mobile Tower Defense/Builder Game
// ============================================================

// --- GAME CONSTANTS ---
const GW = 1080;
const GH = 1920;
const WORLD_H = 12000;
const GROUND_Y = 10000;
const ROOM_W = 500;
const ROOM_H = 150;
const ROOM_GAP = 4;
const FORT_X = (GW - ROOM_W) / 2;
const FORT_CX = GW / 2;
const BASE_H = 180;

// --- ROOM DEFINITIONS ---
const ROOM_DEFS = {
    quarters: {
        name: 'Quarters', desc: '+3 dog capacity', color: 0xC4813D, colorDark: 0x8B5E2B,
        baseCost: 40, baseIncome: 0, category: 'housing',
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
        baseCost: 150, baseIncome: 1, category: 'special',
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

// --- BUILD CATEGORIES ---
const ROOM_POOLS = {
    income: ['quarters', 'kitchen', 'workshop'],
    turret: ['machinegun', 'cannon', 'sniper'],
};
const CATEGORY_INFO = {
    income: { name: 'Income', desc: 'Random income room', color: 0xC4993D, cost: 100 },
    turret: { name: 'Combat', desc: 'Random turret', color: 0xB83C3C, cost: 200 },
};

// --- ENEMY DEFINITIONS ---
const ENEMY_DEFS = {
    scout:   { name: 'Scout Bot',   color: 0x88AACC, hp: 55,  speed: 80,  damage: 8,  reward: 10,  size: 44, flying: false },
    assault: { name: 'Assault Bot', color: 0xCC6622, hp: 35,  speed: 130, damage: 12, reward: 15,  size: 36, flying: false },
    tank:    { name: 'Tank Bot',    color: 0x667788, hp: 140, speed: 55,  damage: 20, reward: 40,  size: 50, flying: false },
    mega:    { name: 'Mega Bot',    color: 0x994444, hp: 500, speed: 40,  damage: 40, reward: 120, size: 70, flying: false },
    drone:   { name: 'Scout Drone', color: 0x6688BB, hp: 20,  speed: 100, damage: 5,  reward: 10,  size: 32, flying: true, flyHeight: 2 },
    gunship: { name: 'Gunship',     color: 0x883333, hp: 60,  speed: 65,  damage: 15, reward: 35,  size: 46, flying: true, flyHeight: 3 },
};

// --- ROOM HP ---
const ROOM_MAX_HP = { income: 100, special: 80, turret: 120, housing: 80 };
const ROOM_HP_PER_LEVEL = 20;
const ENEMY_ATTACK_INTERVAL = 1500;
const FLYING_ATTACK_INTERVAL = 2000;

// --- DOG DATA ---
// Skill categories: combat, production, repair, communication
// Each breed has a primary skill affinity (higher random range for that skill)
const DOG_BREEDS = [
    { name: 'Labrador', color: 0xD4A843, affinity: 'production' },
    { name: 'German Shepherd', color: 0xA67B4B, affinity: 'combat' },
    { name: 'Corgi', color: 0xE8A040, affinity: 'repair' },
    { name: 'Husky', color: 0xB0B8C8, affinity: 'combat' },
    { name: 'Poodle', color: 0xE8DDD0, affinity: 'production' },
    { name: 'Dalmatian', color: 0xF0F0F0, affinity: 'combat' },
    { name: 'Bulldog', color: 0xC8A878, affinity: 'repair' },
    { name: 'Shiba Inu', color: 0xD4884A, affinity: 'communication' },
    { name: 'Beagle', color: 0xC89050, affinity: 'production' },
    { name: 'Border Collie', color: 0x3A3A3A, affinity: 'communication' },
];

// Maps room types to their skill category
const ROOM_SKILL_MAP = {
    quarters: 'production', kitchen: 'production', workshop: 'production',
    radio: 'communication',
    machinegun: 'combat', cannon: 'combat', sniper: 'combat',
};


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

        // Check for existing save
        const hasSave = !!localStorage.getItem('dogFortress_save');

        const startGame = (newGame) => {
            if (newGame) localStorage.removeItem('dogFortress_save');
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.time.delayedCall(400, () => this.scene.start('Game'));
        };

        // Button layout
        const btnW = 400, btnH = 80;

        if (hasSave) {
            // Continue button
            const contBg = this.add.graphics();
            contBg.fillStyle(0xDAA520);
            contBg.fillRoundedRect(cx - btnW / 2, GH - 380, btnW, btnH, 16);
            contBg.lineStyle(3, 0xFFD700);
            contBg.strokeRoundedRect(cx - btnW / 2, GH - 380, btnW, btnH, 16);

            this.add.text(cx, GH - 340, 'Continue', {
                fontFamily: 'Arial Black', fontSize: '42px', color: '#FFFFFF',
                stroke: '#4A2800', strokeThickness: 5,
            }).setOrigin(0.5);

            const contZone = this.add.zone(cx, GH - 340, btnW, btnH).setInteractive();
            contZone.on('pointerdown', () => contBg.setAlpha(0.7));
            contZone.on('pointerup', () => startGame(false));
            contZone.on('pointerout', () => contBg.setAlpha(1));
        }

        // New Game button
        const newY = hasSave ? GH - 270 : GH - 320;
        const newBg = this.add.graphics();
        newBg.fillStyle(hasSave ? 0x555555 : 0xDAA520);
        newBg.fillRoundedRect(cx - btnW / 2, newY, btnW, btnH, 16);
        newBg.lineStyle(3, hasSave ? 0x888888 : 0xFFD700);
        newBg.strokeRoundedRect(cx - btnW / 2, newY, btnW, btnH, 16);

        this.add.text(cx, newY + btnH / 2, 'New Game', {
            fontFamily: 'Arial Black', fontSize: '42px', color: '#FFFFFF',
            stroke: hasSave ? '#333333' : '#4A2800', strokeThickness: 5,
        }).setOrigin(0.5);

        const newZone = this.add.zone(cx, newY + btnH / 2, btnW, btnH).setInteractive();
        newZone.on('pointerdown', () => newBg.setAlpha(0.7));
        newZone.on('pointerup', () => startGame(true));
        newZone.on('pointerout', () => newBg.setAlpha(1));
    }
}

// ============================================================
// GAME SCENE - Main gameplay
// ============================================================
class GameScene extends Phaser.Scene {
    constructor() { super('Game'); }

    create() {
        // --- State ---
        this.coins = 500;
        this.rooms = [];
        this.dogs = [];
        this.enemies = [];
        this.projectiles = [];
        this.wave = 0;
        this.waveActive = false;
        this.enemiesAlive = 0;
        this.selectedRoom = -1;
        this.totalRoomsBuilt = 0;
        this.bones = 0;
        this.shieldMedals = 0;
        this.lostDogActive = false;
        this.lostDogRoom = -1;
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

        // Try loading saved game
        const loaded = this.loadGame();

        if (!loaded) {
            // New game: give starter dogs
            this.addDog();
            this.addDog();
            this.addDog();
            this.updateLobbyDogs();

            this.time.delayedCall(600, () => {
                this.showNotification('Welcome to Dog Fortress!', '#FFD700');
                this.time.delayedCall(1500, () => {
                    this.showNotification('Build rooms and assign dogs to them!', '#88CCFF');
                });
            });
        }

        // Fade in
        this.cameras.main.fadeIn(500);

        // Save when tab goes to background
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this.saveGame();
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

    // --- FORTRESS LOBBY (ground floor) ---
    createFortressBase() {
        this.fortressBase = this.add.container(FORT_CX, GROUND_Y - BASE_H / 2);
        this.fortressBase.setDepth(10);
        this.lobbyDogSprites = [];

        const bg = this.add.graphics();

        // Back wall - warm interior
        bg.fillStyle(0x5A4030);
        bg.fillRect(-ROOM_W / 2, -BASE_H / 2, ROOM_W, BASE_H);

        // Floor - wood planks
        bg.fillStyle(0x8B6914);
        bg.fillRect(-ROOM_W / 2, BASE_H / 2 - 25, ROOM_W, 25);
        bg.lineStyle(1, 0x6B4F12, 0.4);
        for (let fx = -ROOM_W / 2; fx < ROOM_W / 2; fx += 60) {
            bg.beginPath(); bg.moveTo(fx, BASE_H / 2 - 25); bg.lineTo(fx, BASE_H / 2); bg.strokePath();
        }

        // Interior warm glow
        const light = Phaser.Display.Color.ValueToColor(0xC4813D).lighten(25).color;
        bg.fillStyle(light, 0.2);
        bg.fillRect(-ROOM_W / 2, -BASE_H / 2, ROOM_W, BASE_H - 25);

        // Thin structural edges
        bg.fillStyle(0x5A4A3A);
        bg.fillRect(-ROOM_W / 2 - 6, -BASE_H / 2, 6, BASE_H);
        bg.fillRect(ROOM_W / 2, -BASE_H / 2, 6, BASE_H);
        bg.lineStyle(2, 0x3A2A1A, 0.6);
        bg.strokeRect(-ROOM_W / 2, -BASE_H / 2, ROOM_W, BASE_H);

        // Interior details - welcome mat, dog bowls, notice board
        // Welcome mat
        bg.fillStyle(0x993333, 0.5);
        bg.fillRoundedRect(-50, BASE_H / 2 - 40, 100, 18, 4);

        // Dog bowls
        bg.fillStyle(0xAAAAAA);
        bg.fillRoundedRect(-ROOM_W / 2 + 30, BASE_H / 2 - 40, 30, 15, 6);
        bg.fillRoundedRect(-ROOM_W / 2 + 70, BASE_H / 2 - 40, 30, 15, 6);
        bg.fillStyle(0x4488CC);
        bg.fillRect(-ROOM_W / 2 + 34, BASE_H / 2 - 37, 22, 8);

        // Notice board on back wall
        bg.fillStyle(0x6B4F12);
        bg.fillRoundedRect(ROOM_W / 2 - 100, -BASE_H / 2 + 15, 70, 55, 4);
        bg.fillStyle(0xDDCCAA);
        bg.fillRect(ROOM_W / 2 - 95, -BASE_H / 2 + 20, 25, 18);
        bg.fillRect(ROOM_W / 2 - 65, -BASE_H / 2 + 20, 25, 18);
        bg.fillRect(ROOM_W / 2 - 80, -BASE_H / 2 + 44, 30, 18);

        this.fortressBase.add(bg);


        // Lobby label
        const lobbyLabel = this.add.text(-ROOM_W / 2 + 15, -BASE_H / 2 + 8, 'Entrance', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 4,
        });
        this.fortressBase.add(lobbyLabel);

        // Initial lobby dogs
        this.updateLobbyDogs();
    }

    updateLobbyDogs() {
        // Remove old lobby sprites
        this.lobbyDogSprites.forEach(s => s.destroy());
        this.lobbyDogSprites = [];

        // Find unassigned dogs
        const freeDogs = this.dogs.filter(d => d.assignedRoom === -1);
        const maxShow = Math.min(freeDogs.length, 6);
        const lobbyY = GROUND_Y - BASE_H / 2;

        for (let i = 0; i < maxShow; i++) {
            const dog = freeDogs[i];
            const startX = FORT_CX - ROOM_W / 3 + Phaser.Math.Between(0, ROOM_W * 0.6);
            const dogSprite = this.add.image(startX, lobbyY + BASE_H / 2 - 30, 'dog_' + dog.breedIndex);
            dogSprite.setScale(1.4).setDepth(11).setInteractive();

            dogSprite.on('pointerup', () => {
                if (!this.isDragging) { this.dogTapped = true; this.showDogInfo(dog); }
            });

            // Wander randomly in the lobby
            const wanderLeft = FORT_CX - ROOM_W / 3;
            const wanderRight = FORT_CX + ROOM_W / 3;
            const wanderTo = () => {
                if (!dogSprite.active) return;
                const targetX = Phaser.Math.Between(wanderLeft, wanderRight);
                dogSprite.setFlipX(targetX < dogSprite.x);
                this.tweens.add({
                    targets: dogSprite, x: targetX,
                    duration: Phaser.Math.Between(2000, 4000),
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        this.time.delayedCall(Phaser.Math.Between(500, 2000), wanderTo);
                    },
                });
            };
            this.time.delayedCall(i * 300, wanderTo);

            this.lobbyDogSprites.push(dogSprite);
        }

        // Show count if more dogs than can display
        if (freeDogs.length > maxShow) {
            const moreText = this.add.text(
                FORT_CX + ROOM_W / 2 - 20, lobbyY + BASE_H / 2 - 30,
                `+${freeDogs.length - maxShow}`, {
                    fontFamily: 'Arial Black', fontSize: '24px', color: '#AAAAAA',
                    stroke: '#000', strokeThickness: 3,
                }
            ).setOrigin(1, 0.5).setDepth(11);
            this.lobbyDogSprites.push(moreText);
        }
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
        this.coinText = this.add.text(90, 60, '500', {
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

        // Bones display
        this.bonesText = this.add.text(GW / 2 + 60, 60, 'Bones: 0', {
            fontFamily: 'Arial Black', fontSize: '28px', color: '#EEDDCC',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0, 0.5);
        this.hudContainer.add(this.bonesText);

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
        // Show all 7 rooms directly — 4 on top row, 3 on bottom
        const allRooms = Object.keys(ROOM_DEFS);
        const PANEL_H = 380;
        const cardW = 240, cardH = 140, cardGap = 12;
        const row1 = allRooms.slice(0, 4); // quarters, kitchen, workshop, radio
        const row2 = allRooms.slice(4);     // machinegun, cannon, sniper

        this.buildBarContainer = this.add.container(0, GH + PANEL_H + 20).setDepth(510).setScrollFactor(0);

        // Background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1A0A00, 0.95);
        barBg.fillRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        barBg.lineStyle(3, 0x8B6914);
        barBg.strokeRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        this.buildBarContainer.add(barBg);

        // Title
        this.buildBarContainer.add(this.add.text(GW / 2, -PANEL_H + 25, 'BUILD ROOM', {
            fontFamily: 'Arial Black', fontSize: '32px', color: '#FFD700',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5));

        // Close button
        this.buildBarContainer.add(this.add.text(GW - 50, -PANEL_H + 25, 'X', {
            fontFamily: 'Arial Black', fontSize: '36px', color: '#FF6644',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5));

        this.buildCards = [];
        const openY = GH;

        const makeRow = (keys, rowIndex) => {
            const rowW = keys.length * (cardW + cardGap) - cardGap;
            const rowStartX = (GW - rowW) / 2;
            const cy = -PANEL_H + 70 + rowIndex * (cardH + 14) + cardH / 2;

            keys.forEach((key, col) => {
                const def = ROOM_DEFS[key];
                const cx = rowStartX + col * (cardW + cardGap) + cardW / 2;

                const g = this.add.graphics();
                g.fillStyle(def.color, 0.9);
                g.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
                g.lineStyle(2, 0xFFFFFF, 0.3);
                g.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
                this.buildBarContainer.add(g);

                // Name
                this.buildBarContainer.add(this.add.text(cx, cy - 35, def.name, {
                    fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5));

                // Cost
                const costText = this.add.text(cx, cy + 5, '', {
                    fontFamily: 'Arial Black', fontSize: '28px', color: '#FFD700',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5);
                this.buildBarContainer.add(costText);

                // Stat
                let stat = def.desc;
                if (def.baseIncome > 0) stat = `+${def.baseIncome}/s`;
                else if (def.baseDamage) stat = `Dmg: ${def.baseDamage}`;
                this.buildBarContainer.add(this.add.text(cx, cy + 42, stat, {
                    fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
                    stroke: '#000', strokeThickness: 3,
                }).setOrigin(0.5));

                this.buildCards.push({ key, costText, gfx: g, screenX: cx, screenY: openY + cy });
            });
        };

        makeRow(row1, 0);
        makeRow(row2, 1);

        // Scene-level interactive zones
        this.buildCardZones = [];
        this.buildCards.forEach(card => {
            const zone = this.add.zone(card.screenX, card.screenY, cardW, cardH)
                .setDepth(520).setScrollFactor(0).setInteractive();
            zone.on('pointerdown', () => { if (this.buildMenuOpen) card.gfx.setAlpha(0.6); });
            zone.on('pointerup', () => {
                card.gfx.setAlpha(1);
                if (this.buildMenuOpen) this.buildRoom(card.key);
            });
            zone.on('pointerout', () => card.gfx.setAlpha(1));
            zone.disableInteractive();
            this.buildCardZones.push(zone);
        });

        // Close zone
        this.buildCloseZone = this.add.zone(GW - 50, openY + (-PANEL_H + 25), 80, 60)
            .setDepth(520).setScrollFactor(0).setInteractive();
        this.buildCloseZone.on('pointerup', () => { if (this.buildMenuOpen) this.toggleBuildMenu(); });
        this.buildCloseZone.disableInteractive();

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
        panelBg.fillRoundedRect(-GW / 2 + 20, -170, GW - 40, 370, 16);
        panelBg.lineStyle(3, 0xDAA520);
        panelBg.strokeRoundedRect(-GW / 2 + 20, -170, GW - 40, 370, 16);
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

        // Repair button
        const repairBg = this.add.graphics();
        repairBg.fillStyle(0x2277CC);
        repairBg.fillRoundedRect(-200, 155, 400, 55, 10);
        repairBg.lineStyle(2, 0x44AAFF);
        repairBg.strokeRoundedRect(-200, 155, 400, 55, 10);
        this.roomPanel.add(repairBg);

        this.rpRepairText = this.add.text(0, 182, 'Repair: 0c', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFF',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpRepairText);

        // Scene-level zones for room panel buttons
        const rpOpenY = GH - 210; // panel y when open
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

        this.rpRepairZone = this.add.zone(rpCX, rpOpenY + 182, 400, 55)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpRepairZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.repairSelectedRoom();
        });

        // Start all room panel zones disabled
        this.rpUpgZone.disableInteractive();
        this.rpAssignZone.disableInteractive();
        this.rpCloseZone.disableInteractive();
        this.rpCollectZone.disableInteractive();
        this.rpRepairZone.disableInteractive();
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
        // Skip if a dog sprite was just tapped
        if (this.dogTapped) { this.dogTapped = false; return; }
        for (let i = 0; i < this.rooms.length; i++) {
            const room = this.rooms[i];
            const ry = this.getRoomY(i);
            if (worldX >= FORT_X && worldX <= FORT_X + ROOM_W &&
                worldY >= ry && worldY <= ry + ROOM_H) {
                // Check lost dog mission first
                if (this.handleRoomTapForLostDog(i)) return;
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

        // Lost dog missions
        this.time.addEvent({
            delay: 60000, loop: true,
            callback: () => this.tryLostDogMission(),
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
    buildRoom(typeKey, overrideCost) {
        const def = ROOM_DEFS[typeKey];
        if (!def) return;

        const cost = overrideCost || Math.floor(def.baseCost * (1 + 0.12 * this.totalRoomsBuilt));
        if (this.coins < cost) {
            this.showNotification('Not enough coins!', '#FF4444');
            return;
        }

        this.coins -= cost;
        this.totalRoomsBuilt++;

        const baseMaxHp = ROOM_MAX_HP[def.category] || 100;
        const buildTime = Math.min(120, 10 + this.totalRoomsBuilt * 5);
        const room = {
            type: typeKey,
            level: 1,
            dogs: [],
            accumulated: 0,
            lastFire: 0,
            container: null,
            coinIcon: null,
            hp: baseMaxHp,
            maxHp: baseMaxHp,
            damageState: 0,
            damageOverlay: null,
            hpBarGfx: null,
            constructing: true,
            constructionTime: buildTime,
            constructionLeft: buildTime,
            constructionGfx: null,
            constructionText: null,
            constructionOverlay: null,
            revealed: false,
        };

        const index = this.rooms.length;
        this.rooms.push(room);

        // Build a generic grey placeholder during construction
        this.createConstructionPlaceholder(room, index);

        // Add radial construction indicator
        this.createConstructionIndicator(room);

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

        this.showNotification(`Building ${def.name}...`, '#FFAA44');
        this.updateHUD();

        if (this.buildMenuOpen) this.toggleBuildMenu();
    }

    getCategoryCost(category) {
        const base = CATEGORY_INFO[category].cost;
        return Math.floor(base * (1 + 0.12 * this.totalRoomsBuilt));
    }

    // --- ROOM PICKER (choose from 3) ---
    showRoomPicker(category) {
        const pool = ROOM_POOLS[category];
        if (!pool) return;

        const catInfo = CATEGORY_INFO[category];
        const cost = this.getCategoryCost(category);

        if (this.coins < cost) {
            this.showNotification('Not enough coins!', '#FF4444');
            return;
        }

        // Close build menu
        if (this.buildMenuOpen) this.toggleBuildMenu();

        // Pick up to 3 random options (shuffle pool)
        const options = Phaser.Utils.Array.Shuffle([...pool]).slice(0, 3);

        const popup = this.add.container(GW / 2, GH / 2).setDepth(700).setScrollFactor(0);
        this.roomPickerPopup = popup;

        // Dim
        const dim = this.add.graphics();
        dim.fillStyle(0x000000, 0.6);
        dim.fillRect(-GW / 2, -GH / 2, GW, GH);
        popup.add(dim);

        // Panel
        const cardW = 280, cardH = 280, cardGap = 24;
        const totalW = options.length * (cardW + cardGap) - cardGap;
        const panelW = totalW + 80;
        const panelH = cardH + 140;

        const panel = this.add.graphics();
        panel.fillStyle(0x1A0A00, 0.95);
        panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
        panel.lineStyle(3, 0xDAA520);
        panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
        popup.add(panel);

        // Title
        popup.add(this.add.text(0, -panelH / 2 + 28, 'Choose a Room', {
            fontFamily: 'Arial Black', fontSize: '34px', color: '#FFD700',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5));

        popup.add(this.add.text(0, -panelH / 2 + 68, `${cost} coins`, {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#CCCCCC',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5));

        // Room option cards
        this.roomPickerZones = [];
        const startX = -totalW / 2 + cardW / 2;
        const cardY = 30;

        options.forEach((typeKey, i) => {
            const def = ROOM_DEFS[typeKey];
            const cx = startX + i * (cardW + cardGap);

            // Card background
            const g = this.add.graphics();
            g.fillStyle(def.color, 0.9);
            g.fillRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
            g.lineStyle(3, 0xFFFFFF, 0.3);
            g.strokeRoundedRect(cx - cardW / 2, cardY - cardH / 2, cardW, cardH, 14);
            popup.add(g);

            // Room name
            popup.add(this.add.text(cx, cardY - cardH / 2 + 35, def.name, {
                fontFamily: 'Arial Black', fontSize: '28px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 5,
            }).setOrigin(0.5));

            // Stats
            if (def.baseIncome > 0) {
                popup.add(this.add.text(cx, cardY + 10, `${def.baseIncome}/s`, {
                    fontFamily: 'Arial Black', fontSize: '36px', color: '#FFD700',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5));
                popup.add(this.add.text(cx, cardY + 50, 'income', {
                    fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5));
            } else if (def.baseDamage) {
                popup.add(this.add.text(cx, cardY - 10, `${def.baseDamage}`, {
                    fontFamily: 'Arial Black', fontSize: '40px', color: '#FF6644',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5));
                popup.add(this.add.text(cx, cardY + 30, 'damage', {
                    fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
                    stroke: '#000', strokeThickness: 4,
                }).setOrigin(0.5));
                popup.add(this.add.text(cx, cardY + 60, `${(def.fireRate / 1000).toFixed(1)}s  |  ${def.range}px`, {
                    fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
                    stroke: '#000', strokeThickness: 3,
                }).setOrigin(0.5));
            }

            // Description
            popup.add(this.add.text(cx, cardY + cardH / 2 - 25, def.desc, {
                fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5));

            // Scene-level zone
            const zone = this.add.zone(GW / 2 + cx, GH / 2 + cardY, cardW, cardH)
                .setDepth(701).setScrollFactor(0).setInteractive();
            zone.on('pointerdown', () => g.setAlpha(0.6));
            zone.on('pointerup', () => {
                g.setAlpha(1);
                this.closeRoomPicker();
                this.buildRoom(typeKey, cost);
            });
            zone.on('pointerout', () => g.setAlpha(1));
            this.roomPickerZones.push(zone);
        });

        // Close zone behind
        this.roomPickerCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
            .setDepth(699).setScrollFactor(0).setInteractive();
        this.roomPickerCloseZone.on('pointerup', () => this.closeRoomPicker());

        // Animate
        popup.setScale(0.8).setAlpha(0);
        this.tweens.add({
            targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
            duration: 200, ease: 'Back.easeOut',
        });
    }

    closeRoomPicker() {
        if (this.roomPickerPopup) { this.roomPickerPopup.destroy(); this.roomPickerPopup = null; }
        if (this.roomPickerCloseZone) { this.roomPickerCloseZone.destroy(); this.roomPickerCloseZone = null; }
        if (this.roomPickerZones) {
            this.roomPickerZones.forEach(z => z.destroy());
            this.roomPickerZones = null;
        }
    }

    createConstructionPlaceholder(room, index) {
        const ry = this.getRoomY(index);
        const container = this.add.container(FORT_CX, ry + ROOM_H / 2).setDepth(20);

        // Grey placeholder room
        const bg = this.add.graphics();
        bg.fillStyle(0x444444);
        bg.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        bg.fillStyle(0x555555);
        bg.fillRect(-ROOM_W / 2, ROOM_H / 2 - 20, ROOM_W, 20);
        // Scaffolding lines
        bg.lineStyle(2, 0x666666, 0.5);
        for (let x = -ROOM_W / 2 + 40; x < ROOM_W / 2; x += 80) {
            bg.beginPath(); bg.moveTo(x, -ROOM_H / 2); bg.lineTo(x + 40, ROOM_H / 2); bg.strokePath();
            bg.beginPath(); bg.moveTo(x + 40, -ROOM_H / 2); bg.lineTo(x, ROOM_H / 2); bg.strokePath();
        }
        // Thin edges
        bg.fillStyle(0x5A4A3A);
        bg.fillRect(-ROOM_W / 2 - 6, -ROOM_H / 2, 6, ROOM_H);
        bg.fillRect(ROOM_W / 2, -ROOM_H / 2, 6, ROOM_H);
        bg.lineStyle(2, 0x3A2A1A, 0.6);
        bg.strokeRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        container.add(bg);

        // "?" label
        const label = this.add.text(- ROOM_W / 2 + 15, -ROOM_H / 2 + 8, 'Building...', {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#AAAAAA',
            stroke: '#000', strokeThickness: 4,
        });
        container.add(label);

        room.container = container;
        room.placeholderLabel = label;
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

        // Dark "inactive" overlay — shown when no dogs assigned
        const inactiveOverlay = this.add.graphics();
        inactiveOverlay.fillStyle(0x000000, 0.55);
        inactiveOverlay.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        container.add(inactiveOverlay);
        room.inactiveOverlay = inactiveOverlay;

        room.container = container;
    }

    updateRoomActiveState(room) {
        const def = ROOM_DEFS[room.type];
        // Housing rooms work without dogs
        const needsDog = def.category !== 'housing';
        const active = (!needsDog || room.dogs.length > 0) && !room.constructing;
        if (room.inactiveOverlay) room.inactiveOverlay.setVisible(!active);
    }

    createConstructionIndicator(room) {
        // Grey out the room during construction
        const greyOverlay = this.add.graphics();
        greyOverlay.fillStyle(0x555566, 0.65);
        greyOverlay.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        room.container.add(greyOverlay);
        room.constructionOverlay = greyOverlay;

        // Radial arc
        const g = this.add.graphics();
        room.constructionGfx = g;
        room.container.add(g);

        // Countdown number
        const t = this.add.text(0, 0, '', {
            fontFamily: 'Arial Black', fontSize: '32px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);
        room.constructionText = t;
        room.container.add(t);

        this.drawConstructionArc(room);
    }

    drawConstructionArc(room) {
        if (!room.constructionGfx) return;
        const g = room.constructionGfx;
        g.clear();

        const r = 45;
        const progress = 1 - (room.constructionLeft / room.constructionTime);

        // Background circle
        g.fillStyle(0x000000, 0.6);
        g.fillCircle(0, 0, r + 4);

        // Track ring
        g.lineStyle(8, 0x333333);
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.strokePath();

        // Progress arc (clockwise from top)
        if (progress > 0) {
            g.lineStyle(8, 0xFF8800);
            g.beginPath();
            g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            g.strokePath();
        }

        if (room.constructionText) {
            room.constructionText.setText(`${Math.ceil(room.constructionLeft)}`);
        }
    }

    finishConstruction(room, index) {
        room.constructing = false;
        room.constructionLeft = 0;
        room.revealed = true;

        // Destroy the entire placeholder container
        if (room.container) { room.container.destroy(); room.container = null; }

        // Build the real room visual
        this.createRoomVisual(room, index);

        // Update overlay (still needs dog)
        this.updateRoomActiveState(room);

        // Reveal animation - flash white then settle
        const ry = this.getRoomY(index);
        this.spawnParticles(FORT_CX, ry + ROOM_H / 2, ROOM_DEFS[room.type].color, 25);

        const def = ROOM_DEFS[room.type];
        this.showNotification(`Revealed: ${def.name}!`, '#FFD700');

        if (room.container) {
            room.container.setAlpha(0);
            this.tweens.add({
                targets: room.container, alpha: 1,
                duration: 400, ease: 'Power2',
            });
            this.tweens.add({
                targets: room.container, scaleX: 1.05, scaleY: 1.05,
                duration: 200, yoyo: true, ease: 'Power2',
            });
        }
    }

    speedUpConstruction() {
        if (this.selectedRoom < 0) return;
        const room = this.rooms[this.selectedRoom];
        if (!room || !room.constructing) return;

        const cost = Math.ceil(room.constructionLeft / 5);
        if (this.bones < cost) {
            this.showNotification('Not enough Bones!', '#FF4444');
            return;
        }

        this.bones -= cost;
        this.finishConstruction(room, this.selectedRoom);
        this.updateHUD();
        this.hideRoomPanel();
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
        // Construction progress
        this.rooms.forEach((room, i) => {
            if (!room.constructing) return;
            room.constructionLeft--;
            this.drawConstructionArc(room);
            if (room.constructionLeft <= 0) {
                this.finishConstruction(room, i);
            }
        });

        this.rooms.forEach((room, i) => {
            const def = ROOM_DEFS[room.type];
            if (def.baseIncome <= 0) return;
            if (room.constructing) return; // under construction
            if (room.dogs.length === 0) return; // rooms need a dog to operate

            const dogBonus = this.getRoomDogBonus(room);
            const hpMult = 0.1 + 0.9 * (room.hp / room.maxHp);
            const income = def.baseIncome * room.level * dogBonus * hpMult * this.getPrestigeMultiplier();
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

        // Dog auto-repair: dogs heal their room based on repair skill
        this.rooms.forEach((room, i) => {
            if (room.hp >= room.maxHp) return;
            const repairRate = this.getRoomRepairRate(room);
            if (repairRate <= 0) return;

            const oldState = room.damageState;
            room.hp = Math.min(room.maxHp, room.hp + repairRate);

            const hpPct = room.hp / room.maxHp;
            room.damageState = hpPct > 0.75 ? 0 : hpPct > 0.5 ? 1 : hpPct > 0.25 ? 2 : 3;

            if (room.damageState !== oldState) {
                this.updateRoomDamageVisual(room);
            }
            this.updateRoomHpBar(room);
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
            targets: this.roomPanel, y: GH - 210,
            duration: 300, ease: 'Power2',
        });

        // Hide build button
        this.setBuildButtonAlpha(0);

        // Enable room panel zones
        this.rpUpgZone.setInteractive();
        this.rpAssignZone.setInteractive();
        this.rpCloseZone.setInteractive();
        this.rpCollectZone.setInteractive();
        this.rpRepairZone.setInteractive();

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

        // --- UNDER CONSTRUCTION ---
        if (room.constructing) {
            this.rpName.setText(def.name);
            this.rpLevel.setText('Under Construction');
            this.rpLevel.setColor('#FFAA44');
            this.rpStats.setText(`Time remaining: ${Math.ceil(room.constructionLeft)}s`);
            this.rpDogs.setText('');
            this.rpUpgText.setText('');
            this.rpAssignText.setText('');
            this.rpCollectText.setText('');
            const speedCost = Math.ceil(room.constructionLeft / 5);
            this.rpRepairText.setText(`Speed Up: ${speedCost} Bones`);
            this.rpRepairText.setColor(this.bones >= speedCost ? '#FFFFFF' : '#FF4444');
            return;
        }

        // --- NORMAL ---
        const hpMult = 0.1 + 0.9 * (room.hp / room.maxHp);
        const hpPct = Math.floor((room.hp / room.maxHp) * 100);

        this.rpName.setText(def.name);
        this.rpLevel.setText(`Level ${room.level}  |  HP: ${room.hp}/${room.maxHp} (${hpPct}%)`);
        const hpColor = hpPct > 75 ? '#CCCCCC' : hpPct > 50 ? '#FFAA44' : hpPct > 25 ? '#FF8844' : '#FF4444';
        this.rpLevel.setColor(hpColor);

        if (def.category === 'turret') {
            const dmg = Math.floor(def.baseDamage * room.level * this.getRoomDogBonus(room) * hpMult);
            this.rpStats.setText(`Damage: ${dmg}  |  Rate: ${(def.fireRate / 1000).toFixed(1)}s  |  Range: ${def.range}`);
        } else if (def.baseIncome > 0) {
            const dogBonus = this.getRoomDogBonus(room);
            const income = def.baseIncome * room.level * dogBonus * hpMult * this.getPrestigeMultiplier();
            this.rpStats.setText(`Income: ${income.toFixed(1)}/s  |  Stored: ${Math.floor(room.accumulated)}`);
        } else {
            this.rpStats.setText(def.desc);
        }

        const roomSkill = ROOM_SKILL_MAP[room.type] || 'production';
        const dreamCount = room.dogs.filter(d => d.dreamSkill === roomSkill).length;
        const repairRate = this.getRoomRepairRate(room);
        let dogInfo = `Dogs: ${room.dogs.length}`;
        if (dreamCount > 0) dogInfo += ` (${dreamCount} in dream room)`;
        if (repairRate > 0) dogInfo += ` | Repair: ${repairRate.toFixed(1)} HP/s`;
        this.rpDogs.setText(dogInfo);

        const upgCost = this.getUpgradeCost(room);
        this.rpUpgText.setText(`Upgrade: ${upgCost}c`);
        this.rpAssignText.setText('Assign Dog');
        this.rpCollectText.setText(`Collect: ${Math.floor(room.accumulated)}c`);

        // Repair button
        const costPerHp = def.baseCost / 100;
        const repairCost = Math.ceil((room.maxHp - room.hp) * costPerHp);
        if (room.hp >= room.maxHp) {
            this.rpRepairText.setText('Full Health');
            this.rpRepairText.setColor('#88FF88');
        } else {
            this.rpRepairText.setText(`Repair: ${repairCost}c`);
            this.rpRepairText.setColor(this.coins >= repairCost ? '#FFFFFF' : '#FF4444');
        }
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
        this.rpRepairZone.disableInteractive();
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

        // Increase maxHp on upgrade
        const baseMaxHp = ROOM_MAX_HP[ROOM_DEFS[room.type].category] || 100;
        room.maxHp = baseMaxHp + (room.level - 1) * ROOM_HP_PER_LEVEL;

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

    repairSelectedRoom() {
        if (this.selectedRoom < 0) return;
        const room = this.rooms[this.selectedRoom];

        // Double-duty: speed up construction if constructing
        if (room.constructing) {
            this.speedUpConstruction();
            return;
        }

        if (room.hp >= room.maxHp) {
            this.showNotification('Room is at full health!', '#88CCFF');
            return;
        }
        const def = ROOM_DEFS[room.type];
        const costPerHp = def.baseCost / 100;
        const repairCost = Math.ceil((room.maxHp - room.hp) * costPerHp);

        if (this.coins < repairCost) {
            this.showNotification('Not enough coins!', '#FF4444');
            return;
        }

        this.coins -= repairCost;
        room.hp = room.maxHp;
        room.damageState = 0;
        this.updateRoomDamageVisual(room);
        this.updateRoomHpBar(room);

        const ry = this.getRoomY(this.selectedRoom);
        this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0x44AAFF, 15);
        this.showNotification('Room repaired!', '#44AAFF');
        this.updateHUD();
        this.updateRoomPanel();
    }

    // --- BUILD MENU ---
    toggleBuildMenu() {
        this.buildMenuOpen = !this.buildMenuOpen;

        // Update costs on cards
        this.buildCards.forEach(card => {
            const def = ROOM_DEFS[card.key];
            const cost = Math.floor(def.baseCost * (1 + 0.12 * this.totalRoomsBuilt));
            card.costText.setText(`${cost}c`);
            card.costText.setColor(this.coins >= cost ? '#FFD700' : '#FF4444');
        });

        if (this.buildMenuOpen) {
            if (this.roomPanelOpen) this.hideRoomPanel();
            this.tweens.add({
                targets: this.buildBarContainer, y: GH,
                duration: 300, ease: 'Back.easeOut',
            });
            this.moveBuildButton(GH - 450);
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

        // Generate skills (1-5). Affinity skill gets +2 bonus (capped at 5)
        const rollSkill = (isAffinity) => {
            const base = Phaser.Math.Between(1, isAffinity ? 5 : 3);
            return Math.min(5, base + (isAffinity ? 1 : 0));
        };
        const skills = {
            combat: rollSkill(breed.affinity === 'combat'),
            production: rollSkill(breed.affinity === 'production'),
            repair: rollSkill(breed.affinity === 'repair'),
            communication: rollSkill(breed.affinity === 'communication'),
        };

        // Dream room = skill category where this dog is strongest
        const bestSkill = Object.keys(skills).reduce((a, b) => skills[a] >= skills[b] ? a : b);

        const dog = {
            name, breed: breed.name, breedIndex,
            skills, dreamSkill: bestSkill,
            assignedRoom: -1,
            sprite: null,
        };

        this.dogs.push(dog);
        this.updateHUD();
        return dog;
    }

    // Calculate total dog bonus for a room. Dream room dogs give 2x.
    getDogCapacity() {
        const quartersCount = this.rooms.filter(r => r.type === 'quarters' && !r.constructing).length;
        return 3 + quartersCount * 3;
    }

    getRoomDogBonus(room) {
        const roomSkill = ROOM_SKILL_MAP[room.type] || 'production';
        let bonus = 1;
        room.dogs.forEach(dog => {
            const skill = dog.skills ? (dog.skills[roomSkill] || 1) : 1;
            const isDream = dog.dreamSkill === roomSkill;
            bonus += (skill * 0.04) * (isDream ? 2 : 1); // 4-20% per skill point, doubled for dream
        });
        return bonus;
    }

    // Calculate total repair rate for a room from dogs' repair skill
    getRoomRepairRate(room) {
        let rate = 0;
        room.dogs.forEach(dog => {
            const repairSkill = dog.skills ? dog.skills.repair : 0;
            rate += repairSkill * 0.5; // 0.5 HP/s per repair skill point
        });
        return rate;
    }

    tryRecruitDog() {
        // Check capacity
        if (this.dogs.length >= this.getDogCapacity()) return;

        // Need a radio tower
        const radioRooms = this.rooms.filter(r => r.type === 'radio' && r.dogs.length > 0);
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
            this.updateLobbyDogs();
        }
    }

    assignDogToSelectedRoom() {
        // Open the dog picker instead of auto-assigning
        this.showDogPicker();
    }

    // --- DOG INFO POPUP ---
    showDogInfo(dog) {
        // Remove existing popup if any
        if (this.dogInfoPopup) this.dogInfoPopup.destroy();

        const s = dog.skills || { combat: 1, production: 1, repair: 1, communication: 1 };
        const roomSkill = dog.assignedRoom >= 0 ? (ROOM_SKILL_MAP[this.rooms[dog.assignedRoom]?.type] || '') : '';
        const isDream = roomSkill && dog.dreamSkill === roomSkill;

        // Build popup as a container fixed to camera
        const popup = this.add.container(GW / 2, GH / 2).setDepth(700).setScrollFactor(0);
        this.dogInfoPopup = popup;

        // Dim background
        const dim = this.add.graphics();
        dim.fillStyle(0x000000, 0.5);
        dim.fillRect(-GW / 2, -GH / 2, GW, GH);
        popup.add(dim);

        // Panel
        const panel = this.add.graphics();
        panel.fillStyle(0x2A1500, 0.95);
        panel.fillRoundedRect(-280, -220, 560, 440, 20);
        panel.lineStyle(3, 0xDAA520);
        panel.strokeRoundedRect(-280, -220, 560, 440, 20);
        popup.add(panel);

        // Dog name & breed
        const nameText = this.add.text(0, -190, `${dog.name}`, {
            fontFamily: 'Arial Black', fontSize: '38px', color: '#FFD700',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5);
        popup.add(nameText);

        const breedText = this.add.text(0, -145, `${dog.breed}`, {
            fontFamily: 'Arial', fontSize: '28px', color: '#C4813D',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        popup.add(breedText);

        if (isDream) {
            const dreamText = this.add.text(0, -110, 'IN DREAM ROOM! x2 BONUS', {
                fontFamily: 'Arial Black', fontSize: '24px', color: '#FFD700',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5);
            popup.add(dreamText);
        }

        // Skills as bars
        const skillNames = [
            { key: 'combat', label: 'Combat', color: 0xFF4444 },
            { key: 'production', label: 'Production', color: 0x44CC44 },
            { key: 'repair', label: 'Repair', color: 0x44AAFF },
            { key: 'communication', label: 'Comms', color: 0xCC88FF },
        ];
        const barStartY = -70;

        skillNames.forEach((sk, i) => {
            const y = barStartY + i * 65;
            const val = s[sk.key] || 1;
            const isRoomSkill = sk.key === roomSkill;

            // Label
            const label = this.add.text(-240, y, sk.label, {
                fontFamily: 'Arial Black', fontSize: '24px',
                color: isRoomSkill ? '#FFFFFF' : '#AAAAAA',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0, 0.5);
            popup.add(label);

            // Bar background
            const barBg = this.add.graphics();
            barBg.fillStyle(0x333333);
            barBg.fillRoundedRect(-30, y - 12, 260, 24, 6);
            popup.add(barBg);

            // Bar fill
            const barFill = this.add.graphics();
            barFill.fillStyle(sk.color);
            barFill.fillRoundedRect(-30, y - 12, (260 * val / 5), 24, 6);
            popup.add(barFill);

            // Value text
            const valText = this.add.text(240, y, `${val}/5`, {
                fontFamily: 'Arial Black', fontSize: '22px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5);
            popup.add(valText);

            // Dream indicator
            if (sk.key === dog.dreamSkill) {
                const star = this.add.text(-260, y, '*', {
                    fontFamily: 'Arial Black', fontSize: '28px', color: '#FFD700',
                    stroke: '#000', strokeThickness: 3,
                }).setOrigin(0.5);
                popup.add(star);
            }
        });

        // Unassign button (only if dog is assigned)
        if (dog.assignedRoom >= 0) {
            const unBg = this.add.graphics();
            unBg.fillStyle(0x993333);
            unBg.fillRoundedRect(-150, 160, 300, 55, 10);
            unBg.lineStyle(2, 0xCC4444);
            unBg.strokeRoundedRect(-150, 160, 300, 55, 10);
            popup.add(unBg);

            const unText = this.add.text(0, 187, 'Unassign Dog', {
                fontFamily: 'Arial Black', fontSize: '26px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5);
            popup.add(unText);
        } else {
            const closeText = this.add.text(0, 190, 'TAP TO CLOSE', {
                fontFamily: 'Arial Black', fontSize: '26px', color: '#AAAAAA',
                stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5);
            popup.add(closeText);
        }

        // Scene-level zones for close + unassign
        this.dogInfoCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
            .setDepth(699).setScrollFactor(0).setInteractive();

        if (dog.assignedRoom >= 0) {
            // Unassign zone on top of the button area
            this.dogInfoUnassignZone = this.add.zone(GW / 2, GH / 2 + 187, 300, 55)
                .setDepth(701).setScrollFactor(0).setInteractive();
            this.dogInfoUnassignZone.on('pointerup', () => {
                this.unassignDog(dog);
                this.closeDogInfo();
            });
        }

        this.dogInfoCloseZone.on('pointerup', () => this.closeDogInfo());

        // Entrance animation
        popup.setScale(0.8).setAlpha(0);
        this.tweens.add({
            targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
            duration: 200, ease: 'Back.easeOut',
        });
    }

    closeDogInfo() {
        if (this.dogInfoPopup) { this.dogInfoPopup.destroy(); this.dogInfoPopup = null; }
        if (this.dogInfoCloseZone) { this.dogInfoCloseZone.destroy(); this.dogInfoCloseZone = null; }
        if (this.dogInfoUnassignZone) { this.dogInfoUnassignZone.destroy(); this.dogInfoUnassignZone = null; }
    }

    unassignDog(dog) {
        if (dog.assignedRoom < 0) return;
        const room = this.rooms[dog.assignedRoom];
        if (room) {
            const idx = room.dogs.indexOf(dog);
            if (idx >= 0) room.dogs.splice(idx, 1);
            this.updateRoomActiveState(room);
        }
        if (dog.sprite) { dog.sprite.destroy(); dog.sprite = null; }
        dog.assignedRoom = -1;
        this.showNotification(`${dog.name} unassigned!`, '#AAAAAA');
        if (this.roomPanelOpen) this.updateRoomPanel();
        this.updateLobbyDogs();
    }

    // --- DOG PICKER (for assigning) ---
    showDogPicker() {
        if (this.selectedRoom < 0) return;
        const targetRoomIndex = this.selectedRoom;
        const room = this.rooms[targetRoomIndex];

        if (ROOM_DEFS[room.type].category === 'housing') {
            this.showNotification('Quarters provide housing automatically!', '#88CCFF');
            return;
        }

        if (room.constructing) {
            this.showNotification('Room is still under construction!', '#FF8844');
            return;
        }

        if (room.dogs.length >= 3) {
            this.showNotification('Room is full! (max 3 dogs)', '#FF8844');
            return;
        }

        const freeDogs = this.dogs.filter(d => d.assignedRoom === -1);
        if (freeDogs.length === 0) {
            this.showNotification('No free dogs! Build a Radio Tower.', '#FF8844');
            return;
        }

        if (this.roomPanelOpen) this.hideRoomPanel();

        const roomSkill = ROOM_SKILL_MAP[room.type] || 'production';

        // Sort: dream matches first, then by relevant skill descending
        freeDogs.sort((a, b) => {
            const aDream = a.dreamSkill === roomSkill ? 1 : 0;
            const bDream = b.dreamSkill === roomSkill ? 1 : 0;
            if (bDream !== aDream) return bDream - aDream;
            return (b.skills?.[roomSkill] || 1) - (a.skills?.[roomSkill] || 1);
        });

        const popup = this.add.container(GW / 2, GH / 2).setDepth(700).setScrollFactor(0);
        this.dogPickerPopup = popup;

        // Dim background
        const dim = this.add.graphics();
        dim.fillStyle(0x000000, 0.6);
        dim.fillRect(-GW / 2, -GH / 2, GW, GH);
        popup.add(dim);

        // Skill color map
        const SKILL_COLORS = { combat: '#FF5555', production: '#55CC55', repair: '#55AAFF', communication: '#CC88FF' };

        // Card layout
        const maxVisible = Math.min(freeDogs.length, 4);
        const ROW_H = 120;
        const panelW = GW - 60;
        const panelH = 110 + maxVisible * ROW_H + (freeDogs.length > maxVisible ? 50 : 0);
        const panelTop = -panelH / 2;

        // Panel
        const panel = this.add.graphics();
        panel.fillStyle(0x1A0A00, 0.95);
        panel.fillRoundedRect(-panelW / 2, panelTop, panelW, panelH, 16);
        panel.lineStyle(3, 0xDAA520);
        panel.strokeRoundedRect(-panelW / 2, panelTop, panelW, panelH, 16);
        popup.add(panel);

        // Title
        popup.add(this.add.text(0, panelTop + 25, 'Choose a Dog', {
            fontFamily: 'Arial Black', fontSize: '34px', color: '#FFD700',
            stroke: '#000', strokeThickness: 5,
        }).setOrigin(0.5));

        // Column headers
        const headerY = panelTop + 70;
        const colX = { name: -panelW / 2 + 30, com: 80, pro: 200, rep: 320, cmm: 440 };
        const hdrs = [
            { x: colX.com, label: 'Combat', skill: 'combat', color: SKILL_COLORS.combat },
            { x: colX.pro, label: 'Produce', skill: 'production', color: SKILL_COLORS.production },
            { x: colX.rep, label: 'Repair', skill: 'repair', color: SKILL_COLORS.repair },
            { x: colX.cmm, label: 'Comms', skill: 'communication', color: SKILL_COLORS.communication },
        ];
        hdrs.forEach(h => {
            const isNeeded = h.skill === roomSkill;
            popup.add(this.add.text(h.x, headerY, h.label, {
                fontFamily: 'Arial Black', fontSize: '26px',
                color: isNeeded ? '#FFFFFF' : '#999999',
                stroke: '#000', strokeThickness: 4,
            }).setOrigin(0.5));
            if (isNeeded) {
                // Underline the needed skill
                const underline = this.add.graphics();
                underline.lineStyle(3, 0xFFD700);
                underline.beginPath(); underline.moveTo(h.x - 30, headerY + 15); underline.lineTo(h.x + 30, headerY + 15); underline.strokePath();
                popup.add(underline);
            }
        });

        // Dog rows
        this.dogPickerZones = [];
        const listTop = panelTop + 95;

        for (let i = 0; i < maxVisible; i++) {
            const dog = freeDogs[i];
            const y = listTop + i * ROW_H + ROW_H / 2;
            const s = dog.skills || {};
            const isDream = dog.dreamSkill === roomSkill;

            // Row bg
            const row = this.add.graphics();
            row.fillStyle(isDream ? 0x3D2800 : 0x2A1A0A);
            row.fillRoundedRect(-panelW / 2 + 15, y - ROW_H / 2 + 4, panelW - 30, ROW_H - 8, 10);
            if (isDream) {
                row.lineStyle(3, 0xFFD700, 0.7);
                row.strokeRoundedRect(-panelW / 2 + 15, y - ROW_H / 2 + 4, panelW - 30, ROW_H - 8, 10);
            }
            popup.add(row);

            // Dog sprite
            popup.add(this.add.image(-panelW / 2 + 60, y, 'dog_' + dog.breedIndex).setScale(1.5));

            // Name + breed
            popup.add(this.add.text(-panelW / 2 + 100, y - 25, dog.name, {
                fontFamily: 'Arial Black', fontSize: '28px', color: '#FFFFFF',
                stroke: '#000', strokeThickness: 4,
            }));
            popup.add(this.add.text(-panelW / 2 + 100, y + 10, dog.breed + (isDream ? '  DREAM!' : ''), {
                fontFamily: 'Arial Black', fontSize: '24px', color: isDream ? '#FFD700' : '#C4813D',
                stroke: '#000', strokeThickness: 3,
            }));

            // 4 skill numbers, color-coded, bigger if it's the room's needed skill
            const skillKeys = ['combat', 'production', 'repair', 'communication'];
            const skillXs = [colX.com, colX.pro, colX.rep, colX.cmm];
            skillKeys.forEach((sk, j) => {
                const val = s[sk] || 1;
                const isNeeded = sk === roomSkill;
                const color = SKILL_COLORS[sk];
                popup.add(this.add.text(skillXs[j], y, `${val}`, {
                    fontFamily: 'Arial Black',
                    fontSize: isNeeded ? '38px' : '28px',
                    color: color,
                    stroke: '#000',
                    strokeThickness: isNeeded ? 5 : 3,
                }).setOrigin(0.5));
            });

            // Scene-level zone
            const zone = this.add.zone(GW / 2, GH / 2 + y, panelW - 30, ROW_H - 8)
                .setDepth(701).setScrollFactor(0).setInteractive();
            zone.on('pointerdown', () => row.setAlpha(0.6));
            zone.on('pointerup', () => {
                row.setAlpha(1);
                this.closeDogPicker();
                this.assignSpecificDog(dog, targetRoomIndex);
            });
            zone.on('pointerout', () => row.setAlpha(1));
            this.dogPickerZones.push(zone);
        }

        if (freeDogs.length > maxVisible) {
            popup.add(this.add.text(0, listTop + maxVisible * ROW_H + 15, `+${freeDogs.length - maxVisible} more`, {
                fontFamily: 'Arial', fontSize: '24px', color: '#888888',
                stroke: '#000', strokeThickness: 2,
            }).setOrigin(0.5));
        }

        // Close zone
        this.dogPickerCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
            .setDepth(699).setScrollFactor(0).setInteractive();
        this.dogPickerCloseZone.on('pointerup', () => this.closeDogPicker());

        popup.setScale(0.8).setAlpha(0);
        this.tweens.add({
            targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
            duration: 200, ease: 'Back.easeOut',
        });
    }

    closeDogPicker() {
        if (this.dogPickerPopup) { this.dogPickerPopup.destroy(); this.dogPickerPopup = null; }
        if (this.dogPickerCloseZone) { this.dogPickerCloseZone.destroy(); this.dogPickerCloseZone = null; }
        if (this.dogPickerZones) {
            this.dogPickerZones.forEach(z => z.destroy());
            this.dogPickerZones = null;
        }
    }

    assignSpecificDog(dog, roomIndex) {
        if (roomIndex < 0 || roomIndex >= this.rooms.length) return;
        const room = this.rooms[roomIndex];
        if (room.dogs.length >= 3) return;

        dog.assignedRoom = roomIndex;
        room.dogs.push(dog);

        // Add sprite
        const ry = this.getRoomY(roomIndex);
        const dogX = FORT_CX - ROOM_W / 3 + room.dogs.length * 80;
        const dogSprite = this.add.image(dogX, ry + ROOM_H - 25, 'dog_' + dog.breedIndex);
        dogSprite.setScale(1.5).setDepth(25).setInteractive();
        dog.sprite = dogSprite;

        dogSprite.on('pointerup', () => {
            if (!this.isDragging) { this.dogTapped = true; this.showDogInfo(dog); }
        });

        this.tweens.add({
            targets: dogSprite, x: dogX + 30,
            duration: Phaser.Math.Between(1500, 2500),
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });

        const roomSkill = ROOM_SKILL_MAP[room.type] || 'production';
        const isDream = dog.dreamSkill === roomSkill;
        if (isDream) {
            this.showNotification(`${dog.name} is in their DREAM ROOM! x2 bonus!`, '#FFD700');
            this.spawnParticles(dogX, ry + ROOM_H - 25, 0xFFD700, 10);
            this.bones += 2;
            this.updateHUD();
        } else {
            this.showNotification(`${dog.name} assigned!`, '#C4813D');
        }
        this.updateRoomActiveState(room);
        this.updateLobbyDogs();
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
        const numEnemies = Math.min(4 + this.wave * 2, 40);
        this.enemiesAlive = numEnemies;

        const spawnDelay = Math.max(300, 1800 - this.wave * 60);

        for (let i = 0; i < numEnemies; i++) {
            this.time.delayedCall(i * spawnDelay, () => {
                let type = 'scout';
                const roll = Math.random();
                if (this.wave >= 6 && roll < 0.10) type = 'gunship';
                else if (this.wave >= 5 && roll < 0.15) type = 'tank';
                else if (this.wave >= 4 && roll < 0.25) type = 'drone';
                else if (this.wave >= 3 && roll < 0.35) type = 'assault';

                // Boss mega bot on wave milestones
                if (this.wave >= 8 && this.wave % 5 === 0 && i === numEnemies - 1) type = 'mega';

                const side = Math.random() < 0.5 ? 'left' : 'right';
                this.spawnEnemy(type, side);
            });
        }
    }

    spawnEnemy(type, side) {
        const def = ENEMY_DEFS[type];
        const hpScale = 1 + (this.wave - 1) * 0.25;
        const speedScale = 1 + (this.wave - 1) * 0.07;

        const texKey = 'enemy_' + type;
        const x = side === 'left' ? -def.size : GW + def.size;
        let y = GROUND_Y - def.size / 2 - 5;

        // Flying enemies start at room height
        if (def.flying) {
            const targetIdx = Math.min((def.flyHeight || 2) - 1, Math.max(0, this.rooms.length - 1));
            if (this.rooms.length > 0) {
                y = this.getRoomY(targetIdx) + ROOM_H / 2;
            } else {
                y = GROUND_Y - BASE_H - ROOM_H;
            }
        }

        const sprite = this.add.image(x, y, texKey).setDepth(15);
        sprite.setScale(1.8);
        if (side === 'right') sprite.setFlipX(true);

        // Health bar
        const hpBarBg = this.add.graphics();
        hpBarBg.fillStyle(0x000000, 0.7);
        hpBarBg.fillRect(-25, -def.size - 10, 50, 8);
        hpBarBg.setPosition(x, y).setDepth(16);

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
            damage: def.damage,
            flying: def.flying || false,
            baseY: y,
            reward: Math.floor(def.reward * (1 + this.wave * 0.1)),
            size: def.size,
            side,
            atFortress: false,
            attackTimer: 0,
            phaseOffset: Math.random() * Math.PI * 2,
        };

        this.enemies.push(enemy);

        // Animation
        if (def.flying) {
            // Drone rotor spin effect
            this.tweens.add({
                targets: sprite, scaleY: 1.6,
                duration: 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        } else {
            this.tweens.add({
                targets: sprite, y: y - 6,
                duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
        }
    }

    updateEnemies(delta) {
        const fortLeft = FORT_CX - ROOM_W / 2 - 20;
        const fortRight = FORT_CX + ROOM_W / 2 + 20;
        const time = this.time.now;

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];

            if (!e.atFortress) {
                // Move toward fortress
                if (e.flying) {
                    // Flying enemies move toward fortress center area
                    if (e.side === 'left') {
                        e.x += e.speed * delta / 1000;
                        if (e.x >= FORT_CX - 200) e.atFortress = true;
                    } else {
                        e.x -= e.speed * delta / 1000;
                        if (e.x <= FORT_CX + 200) e.atFortress = true;
                    }
                    // Vertical bob
                    e.y = e.baseY + Math.sin(time * 0.003) * 20;
                } else {
                    // Ground enemies move to fortress walls
                    if (e.side === 'left') {
                        e.x += e.speed * delta / 1000;
                        if (e.x >= fortLeft) { e.atFortress = true; e.x = fortLeft; }
                    } else {
                        e.x -= e.speed * delta / 1000;
                        if (e.x <= fortRight) { e.atFortress = true; e.x = fortRight; }
                    }
                }

                e.sprite.x = e.x;
                e.sprite.y = e.y;
                e.hpBarBg.x = e.x;
                e.hpBarBg.y = e.y;
                e.hpBar.x = e.x;
                e.hpBar.y = e.y;
            } else {
                // --- AT FORTRESS: ATTACK ROOMS ---
                if (e.flying) {
                    // Flying enemies circle near fortress and attack their target room
                    const circleAmp = 180;
                    const circleSpd = 0.001 + (e.type === 'drone' ? 0.001 : 0);
                    e.x = FORT_CX + circleAmp * Math.sin(time * circleSpd + e.phaseOffset);
                    e.y = e.baseY + Math.sin(time * 0.003 + e.phaseOffset) * 20;
                    e.sprite.x = e.x;
                    e.sprite.y = e.y;
                    e.hpBarBg.x = e.x;
                    e.hpBarBg.y = e.y;
                    e.hpBar.x = e.x;
                    e.hpBar.y = e.y;
                    e.sprite.setFlipX(Math.cos(time * circleSpd + e.phaseOffset) < 0);

                    e.attackTimer += delta;
                    if (e.attackTimer >= FLYING_ATTACK_INTERVAL) {
                        e.attackTimer = 0;
                        const def = ENEMY_DEFS[e.type];
                        const targetIdx = Math.min((def.flyHeight || 2) - 1, this.rooms.length - 1);
                        if (targetIdx >= 0) {
                            this.damageRoom(targetIdx, e.damage);
                            this.fireEnemyProjectile(e, targetIdx);
                        }
                    }
                } else {
                    // Ground enemies climb the fortress exterior and attack rooms
                    if (!e.climbTarget && e.climbTarget !== 0) {
                        // Pick a target room to climb to (weighted toward lower rooms)
                        if (this.rooms.length > 0) {
                            const maxTarget = Math.min(this.rooms.length - 1, Math.floor(this.wave / 3));
                            e.climbTarget = Phaser.Math.Between(0, maxTarget);
                            e.climbing = true;
                        } else {
                            e.climbTarget = -1;
                        }
                    }

                    if (e.climbing && e.climbTarget >= 0) {
                        // Climb up the fortress wall
                        const targetY = this.getRoomY(e.climbTarget) + ROOM_H / 2;
                        if (e.y > targetY + 5) {
                            e.y -= 40 * delta / 1000; // climb speed
                            e.sprite.y = e.y;
                            e.hpBarBg.y = e.y;
                            e.hpBar.y = e.y;
                            // Sway while climbing
                            e.sprite.x = e.x + Math.sin(time * 0.005 + e.phaseOffset) * 4;
                        } else {
                            e.climbing = false;
                            e.y = targetY;
                        }
                    } else {
                        // At target room — attack it
                        e.attackTimer += delta;
                        if (e.attackTimer >= ENEMY_ATTACK_INTERVAL) {
                            e.attackTimer = 0;
                            const targetIdx = Math.max(0, Math.min(e.climbTarget || 0, this.rooms.length - 1));
                            if (this.rooms.length > 0) {
                                this.damageRoom(targetIdx, e.damage);
                                this.fireEnemyProjectile(e, targetIdx);
                            }
                        }
                        // Shake while attacking
                        e.sprite.x = e.x + Math.sin(time * 0.02) * 3;
                    }
                }
            }
        }
    }

    updateTurrets(time) {
        this.rooms.forEach((room, i) => {
            const def = ROOM_DEFS[room.type];
            if (def.category !== 'turret') return;
            if (room.constructing) return;
            if (room.dogs.length === 0) return; // turrets need a dog to operate
            if (this.enemies.length === 0) return;

            // Cooldown check (damaged turrets fire slower)
            const hpMult = 0.1 + 0.9 * (room.hp / room.maxHp);
            const effectiveFireRate = def.fireRate / hpMult;
            if (time - room.lastFire < effectiveFireRate) return;

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

        const dogBonus = this.getRoomDogBonus(room);
        const hpMult = 0.1 + 0.9 * (room.hp / room.maxHp);
        const damage = def.baseDamage * room.level * dogBonus * hpMult * this.getPrestigeMultiplier();

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
        this.waveCountdown = Math.max(15, 30 - this.wave);

        const bonus = this.wave * 12;
        const bonesReward = Math.max(1, Math.floor(this.wave / 2));
        this.coins += bonus;
        this.bones += bonesReward;
        this.updateHUD();

        this.showNotification(`Wave ${this.wave} complete! +${bonus}c +${bonesReward} Bones!`, '#44FF88');

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

    // --- LOST DOG MISSIONS ---
    tryLostDogMission() {
        if (this.lostDogActive) return;
        if (this.rooms.length < 3) return;
        if (Math.random() > 0.4) return;

        this.lostDogActive = true;
        this.lostDogRoom = Phaser.Math.Between(0, this.rooms.length - 1);

        // Show a small paw icon in the lost dog's room
        const ry = this.getRoomY(this.lostDogRoom);
        const pawIcon = this.add.text(
            FORT_CX + Phaser.Math.Between(-ROOM_W / 3, ROOM_W / 3),
            ry + ROOM_H / 2,
            '?', {
                fontFamily: 'Arial Black', fontSize: '32px', color: '#FFAA00',
                stroke: '#000', strokeThickness: 4,
            }
        ).setOrigin(0.5).setDepth(26);
        this.tweens.add({
            targets: pawIcon, y: pawIcon.y - 8, duration: 400,
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
        this.lostDogIcon = pawIcon;

        this.showNotification('A lost dog is hiding in your fortress! Find it!', '#FFAA00');

        // Auto-expire after 30 seconds
        this.time.delayedCall(30000, () => {
            if (this.lostDogActive) {
                this.lostDogActive = false;
                if (this.lostDogIcon) { this.lostDogIcon.destroy(); this.lostDogIcon = null; }
                this.showNotification('The lost dog ran away...', '#888888');
            }
        });
    }

    // Override handleRoomTap to check for lost dog
    handleRoomTapForLostDog(roomIndex) {
        if (!this.lostDogActive) return false;
        if (roomIndex === this.lostDogRoom) {
            this.lostDogActive = false;
            if (this.lostDogIcon) { this.lostDogIcon.destroy(); this.lostDogIcon = null; }
            this.bones += 5;
            if (this.dogs.length < this.getDogCapacity()) {
                const dog = this.addDog();
                this.showNotification(`Found ${dog.name}! +5 Bones!`, '#FFD700');
            } else {
                this.showNotification(`+5 Bones! (no room for more dogs)`, '#FFD700');
            }
            const ry = this.getRoomY(roomIndex);
            this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0xFFD700, 15);
            this.updateHUD();
            this.updateLobbyDogs();
            return true;
        }
        return false;
    }

    // --- PRESTIGE / REBUILD ---
    fortifyTower() {
        if (this.rooms.length < 10) {
            this.showNotification('Need at least 10 floors to Fortify!', '#FF8844');
            return;
        }

        const medalsEarned = Math.floor(this.rooms.length / 10);
        this.shieldMedals += medalsEarned;

        // Reset tower but keep dogs, bones, medals
        this.rooms.forEach(r => {
            if (r.container) r.container.destroy();
            r.dogs.forEach(d => { if (d.sprite) d.sprite.destroy(); d.assignedRoom = -1; d.sprite = null; });
        });
        this.rooms = [];
        this.enemies.forEach(e => { e.sprite.destroy(); e.hpBarBg.destroy(); e.hpBar.destroy(); });
        this.enemies = [];
        this.projectiles.forEach(p => p.sprite.destroy());
        this.projectiles = [];

        this.coins = 500 + this.shieldMedals * 50;
        this.wave = 0;
        this.waveActive = false;
        this.waveCountdown = 60;
        this.totalRoomsBuilt = 0;

        this.showNotification(`FORTIFIED! +${medalsEarned} Shield Medals! (Total: ${this.shieldMedals})`, '#FFD700');
        this.showNotification(`Medals give +${this.shieldMedals * 5}% to income, damage & HP!`, '#AADDFF');
        this.updateHUD();
    }

    // Get prestige multiplier from shield medals
    getPrestigeMultiplier() {
        return 1 + this.shieldMedals * 0.05;
    }

    // --- ROOM DAMAGE ---
    damageRoom(roomIndex, damage) {
        const room = this.rooms[roomIndex];
        if (!room || room.constructing) return;

        const mitigation = 1 - room.dogs.length * 0.05;
        const actualDamage = Math.max(1, Math.floor(damage * mitigation));
        room.hp = Math.max(1, room.hp - actualDamage);

        // Update damage state
        const hpPct = room.hp / room.maxHp;
        const newState = hpPct > 0.75 ? 0 : hpPct > 0.5 ? 1 : hpPct > 0.25 ? 2 : 3;

        if (newState !== room.damageState) {
            room.damageState = newState;
            this.updateRoomDamageVisual(room);
        }
        this.updateRoomHpBar(room);

        // Floating damage text
        const ry = this.getRoomY(roomIndex);
        const ft = this.add.text(
            FORT_CX + Phaser.Math.Between(-80, 80), ry + ROOM_H / 2,
            `-${actualDamage}`, {
                fontFamily: 'Arial Black', fontSize: '24px', color: '#FF6644',
                stroke: '#000', strokeThickness: 3,
            }
        ).setOrigin(0.5).setDepth(100);
        this.tweens.add({
            targets: ft, y: ft.y - 25, alpha: 0,
            duration: 500, onComplete: () => ft.destroy(),
        });

        // Flash room red
        if (room.container) {
            room.container.setAlpha(0.6);
            this.time.delayedCall(100, () => { if (room.container) room.container.setAlpha(1); });
        }
    }

    updateRoomDamageVisual(room) {
        if (room.damageOverlay) { room.damageOverlay.destroy(); room.damageOverlay = null; }
        if (room.damageState === 0) return;

        const g = this.add.graphics();
        const hw = ROOM_W / 2, hh = ROOM_H / 2;

        if (room.damageState >= 1) {
            g.lineStyle(2, 0x000000, 0.4);
            g.beginPath(); g.moveTo(-hw + 50, -hh); g.lineTo(-hw + 70, -hh + 40); g.lineTo(-hw + 55, -hh + 60); g.strokePath();
            g.beginPath(); g.moveTo(hw - 80, hh); g.lineTo(hw - 60, hh - 35); g.strokePath();
        }
        if (room.damageState >= 2) {
            g.lineStyle(3, 0x000000, 0.5);
            g.beginPath(); g.moveTo(-hw + 150, -hh); g.lineTo(-hw + 180, 0); g.lineTo(-hw + 160, hh); g.strokePath();
            g.fillStyle(0x000000, 0.15);
            g.fillCircle(-80, 10, 25);
            g.fillCircle(100, -15, 20);
            g.fillStyle(0x000000, 0.1);
            g.fillRect(-hw, -hh, ROOM_W, ROOM_H);
        }
        if (room.damageState >= 3) {
            g.fillStyle(0x000000, 0.2);
            g.fillRect(-hw, -hh, ROOM_W, ROOM_H);
            g.fillStyle(0x5A4A3A, 0.6);
            g.fillRect(-hw + 20, hh - 25, 35, 15);
            g.fillRect(hw - 70, hh - 20, 25, 12);
            g.fillStyle(0xFF6600, 0.3);
            g.fillCircle(-60, -10, 8);
            g.fillCircle(80, 5, 6);
            g.lineStyle(3, 0x000000, 0.6);
            g.beginPath(); g.moveTo(0, -hh); g.lineTo(20, -10); g.lineTo(-10, hh); g.strokePath();
        }

        room.container.add(g);
        room.damageOverlay = g;
    }

    updateRoomHpBar(room) {
        if (!room.hpBarGfx) {
            room.hpBarGfx = this.add.graphics();
            room.container.add(room.hpBarGfx);
        }
        room.hpBarGfx.clear();
        const pct = room.hp / room.maxHp;
        if (pct >= 1) return;

        const barW = 120, barH = 8;
        const bx = -ROOM_W / 2 + 12, by = -ROOM_H / 2 + 38;
        room.hpBarGfx.fillStyle(0x000000, 0.6);
        room.hpBarGfx.fillRect(bx, by, barW, barH);
        const color = pct > 0.5 ? 0x00CC00 : pct > 0.25 ? 0xFFAA00 : 0xFF2200;
        room.hpBarGfx.fillStyle(color);
        room.hpBarGfx.fillRect(bx + 1, by + 1, (barW - 2) * pct, barH - 2);
    }

    fireEnemyProjectile(enemy, roomIndex) {
        const ry = this.getRoomY(roomIndex) + ROOM_H / 2;
        const targetX = FORT_CX;
        const proj = this.add.graphics();
        proj.fillStyle(0xFF4400);
        proj.fillCircle(0, 0, 5);
        proj.fillStyle(0xFF8800, 0.5);
        proj.fillCircle(0, 0, 8);
        proj.setPosition(enemy.x, enemy.y).setDepth(29);

        this.tweens.add({
            targets: proj, x: targetX, y: ry,
            duration: 300, ease: 'Power1',
            onComplete: () => {
                this.spawnParticles(targetX, ry, 0xFF4400, 4);
                proj.destroy();
            },
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
        this.dogText.setText(`${this.dogs.length}/${this.getDogCapacity()}`);
        this.bonesText.setText(`Bones: ${this.bones}`);

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
            bones: this.bones,
            wave: this.wave,
            totalRoomsBuilt: this.totalRoomsBuilt,
            shieldMedals: this.shieldMedals,
            savedAt: Date.now(),
            rooms: this.rooms.map(r => ({
                type: r.type, level: r.level,
                hp: r.hp, maxHp: r.maxHp,
                damageState: r.damageState,
                accumulated: r.accumulated,
                constructing: r.constructing || false,
                constructionLeft: r.constructionLeft || 0,
                constructionTime: r.constructionTime || 0,
            })),
            dogs: this.dogs.map(d => ({
                name: d.name, breed: d.breed,
                breedIndex: d.breedIndex,
                skills: d.skills,
                dreamSkill: d.dreamSkill,
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
            if (!data.rooms || !data.dogs) return false;

            // Restore state
            this.coins = data.coins || 0;
            this.bones = data.bones || 0;
            this.wave = data.wave || 0;
            this.totalRoomsBuilt = data.totalRoomsBuilt || 0;
            this.shieldMedals = data.shieldMedals || 0;
            this.waveCountdown = 60;

            // Restore rooms
            data.rooms.forEach((rd, i) => {
                const def = ROOM_DEFS[rd.type];
                if (!def) return;
                const baseMaxHp = ROOM_MAX_HP[def.category] || 100;
                const room = {
                    type: rd.type,
                    level: rd.level || 1,
                    dogs: [],
                    accumulated: rd.accumulated || 0,
                    lastFire: 0,
                    container: null,
                    coinIcon: null,
                    hp: rd.hp || baseMaxHp,
                    maxHp: rd.maxHp || baseMaxHp,
                    damageState: rd.damageState || 0,
                    damageOverlay: null,
                    hpBarGfx: null,
                    constructing: rd.constructing || false,
                    constructionTime: rd.constructionTime || 0,
                    constructionLeft: rd.constructionLeft || 0,
                    constructionGfx: null,
                    constructionText: null,
                    constructionOverlay: null,
                };
                this.rooms.push(room);

                if (room.constructing) {
                    // Show placeholder for rooms still under construction
                    this.createConstructionPlaceholder(room, i);
                    this.createConstructionIndicator(room);
                } else {
                    this.createRoomVisual(room, i);
                }

                // Rebuild damage overlay
                if (room.damageState > 0) {
                    this.updateRoomDamageVisual(room);
                    this.updateRoomHpBar(room);
                }
            });

            // Restore dogs
            data.dogs.forEach(dd => {
                const dog = {
                    name: dd.name,
                    breed: dd.breed,
                    breedIndex: dd.breedIndex,
                    skills: dd.skills || { combat: 1, production: 1, repair: 1, communication: 1 },
                    dreamSkill: dd.dreamSkill || 'production',
                    assignedRoom: dd.assignedRoom,
                    sprite: null,
                };
                this.dogs.push(dog);

                // If assigned to a room, rebuild sprite and add to room's dogs array
                if (dog.assignedRoom >= 0 && dog.assignedRoom < this.rooms.length) {
                    const room = this.rooms[dog.assignedRoom];
                    room.dogs.push(dog);

                    const ry = this.getRoomY(dog.assignedRoom);
                    const dogX = FORT_CX - ROOM_W / 3 + room.dogs.length * 80;
                    const dogSprite = this.add.image(dogX, ry + ROOM_H - 25, 'dog_' + dog.breedIndex);
                    dogSprite.setScale(1.5).setDepth(25).setInteractive();
                    dog.sprite = dogSprite;

                    dogSprite.on('pointerup', () => {
                        if (!this.isDragging) { this.dogTapped = true; this.showDogInfo(dog); }
                    });

                    this.tweens.add({
                        targets: dogSprite, x: dogX + 30,
                        duration: Phaser.Math.Between(1500, 2500),
                        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
                    });
                }
            });

            // Update room active states (inactive overlay)
            this.rooms.forEach(r => this.updateRoomActiveState(r));

            // Position camera to show fortress
            if (this.rooms.length > 0) {
                const topRoomY = this.getRoomY(this.rooms.length - 1);
                this.cameras.main.scrollY = topRoomY - GH / 2 + ROOM_H * 2;
            }

            this.updateHUD();
            this.updateLobbyDogs();
            this.showNotification('Game loaded!', '#44FF88');
            return true;
        } catch (e) {
            console.error('Load failed:', e);
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
                const cost = Math.floor(ROOM_DEFS[card.key].baseCost * (1 + 0.12 * this.totalRoomsBuilt));
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
