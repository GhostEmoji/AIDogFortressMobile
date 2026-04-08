// ============================================================
// DOG FORTRESS - Room System
// Mixin: adds room methods to GameScene
// ============================================================

GameScene.prototype.getRoomY = function(index) {
    return GROUND_Y - BASE_H - (index + 1) * (ROOM_H + ROOM_GAP);
};

// --- BUILD ROOM ---
GameScene.prototype.buildRoom = function(typeKey, overrideCost) {
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
        targetMode: 0, // 0=closest, 1=strongest, 2=weakest, 3=flying
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
};

GameScene.prototype.createConstructionPlaceholder = function(room, index) {
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
};

GameScene.prototype.createConstructionIndicator = function(room) {
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
};

GameScene.prototype.drawConstructionArc = function(room) {
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
};

GameScene.prototype.finishConstruction = function(room, index) {
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
};

GameScene.prototype.speedUpConstruction = function() {
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
};

// --- CREATE ROOM VISUAL ---
GameScene.prototype.createRoomVisual = function(room, index) {
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

    // Dark "inactive" overlay -- shown when no dogs assigned
    const inactiveOverlay = this.add.graphics();
    inactiveOverlay.fillStyle(0x000000, 0.55);
    inactiveOverlay.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
    container.add(inactiveOverlay);
    room.inactiveOverlay = inactiveOverlay;

    room.container = container;
};

GameScene.prototype.drawRoomDetails = function(container, type, w, h) {
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
};

GameScene.prototype.updateRoomActiveState = function(room) {
    const def = ROOM_DEFS[room.type];
    // Housing rooms work without dogs
    const needsDog = def.category !== 'housing';
    const active = (!needsDog || room.dogs.length > 0) && !room.constructing;
    if (room.inactiveOverlay) room.inactiveOverlay.setVisible(!active);
};

// --- ECONOMY ---
GameScene.prototype.economyTick = function() {
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
        const jamMult = this.isJammerActive() ? 0.5 : 1;
        const income = def.baseIncome * room.level * dogBonus * hpMult * jamMult * this.getPrestigeMultiplier();
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
};

GameScene.prototype.collectCoins = function(roomIndex) {
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
};

GameScene.prototype.collectAllCoins = function() {
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
};

// --- ROOM SELECTION ---
GameScene.prototype.selectRoom = function(index) {
    this.selectedRoom = index;
    this.showRoomPanel();
};

GameScene.prototype.showRoomPanel = function() {
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
};

GameScene.prototype.updateRoomPanel = function() {
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
    if (def.category === 'turret') {
        const modes = ['Closest', 'Strongest', 'Weakest', 'Flying'];
        this.rpCollectText.setText(`Target: ${modes[room.targetMode || 0]}`);
    } else {
        this.rpCollectText.setText(`Collect: ${Math.floor(room.accumulated)}c`);
    }

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
};

GameScene.prototype.hideRoomPanel = function() {
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
};

// --- UPGRADES ---
GameScene.prototype.getUpgradeCost = function(room) {
    const def = ROOM_DEFS[room.type];
    return Math.floor(def.baseCost * 0.6 * room.level * (1 + room.level * 0.1));
};

GameScene.prototype.upgradeSelectedRoom = function() {
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
};

GameScene.prototype.repairSelectedRoom = function() {
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
};

// --- ROOM DAMAGE ---
GameScene.prototype.damageRoom = function(roomIndex, damage) {
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
};

GameScene.prototype.updateRoomDamageVisual = function(room) {
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
};

GameScene.prototype.updateRoomHpBar = function(room) {
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
};

GameScene.prototype.fortifyTower = function() {
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
};

// Get prestige multiplier from shield medals
GameScene.prototype.getPrestigeMultiplier = function() {
    return 1 + this.shieldMedals * 0.05;
};
