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


    // --- HUD (fixed to camera) ---
    createHUD() {
        this.hudContainer = this.add.container(0, 0).setDepth(500).setScrollFactor(0);

        // Top bar background
        const topBar = this.add.graphics();
        topBar.fillStyle(0x1A0A00, 0.9);
        topBar.fillRoundedRect(10, 10, GW - 20, 130, 16);
        topBar.lineStyle(3, 0x8B6914);
        topBar.strokeRoundedRect(10, 10, GW - 20, 130, 16);
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
            fontFamily: 'Arial Black', fontSize: '24px', color: '#DDBB99',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(1, 0);
        this.hudContainer.add(this.waveTimerText);

        // Wave preview — inside top bar
        this.wavePreviewText = this.add.text(GW / 2, 115, '', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#FFAA44',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5, 0);
        this.hudContainer.add(this.wavePreviewText);

        // Bones display
        this.bonesText = this.add.text(GW / 2 + 60, 60, 'Bones: 0', {
            fontFamily: 'Arial Black', fontSize: '28px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0, 0.5);
        this.hudContainer.add(this.bonesText);

        // Collect all button - draw visuals, use zone for input
        const collectBtnGfx = this.add.graphics();
        collectBtnGfx.fillStyle(0x2E7D32);
        collectBtnGfx.fillRoundedRect(GW / 2 - 100, 155, 200, 55, 12);
        collectBtnGfx.lineStyle(2, 0x4CAF50);
        collectBtnGfx.strokeRoundedRect(GW / 2 - 100, 155, 200, 55, 12);
        collectBtnGfx.setDepth(500).setScrollFactor(0);

        const collectText = this.add.text(GW / 2, 182, 'Collect All', {
            fontFamily: 'Arial Black', fontSize: '26px', color: '#FFFFFF',
            stroke: '#000', strokeThickness: 4,
        }).setOrigin(0.5).setDepth(501).setScrollFactor(0);

        const collectZone = this.add.zone(GW / 2, 182, 200, 55)
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
                    fontFamily: 'Arial Black', fontSize: '24px', color: '#FFFFFF',
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
            fontFamily: 'Arial Black', fontSize: '26px', color: '#DDDDDD',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpLevel);

        this.rpStats = this.add.text(0, -50, '', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#BBEEAA',
            stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5);
        this.roomPanel.add(this.rpStats);

        this.rpDogs = this.add.text(0, -15, '', {
            fontFamily: 'Arial Black', fontSize: '24px', color: '#DDA050',
            stroke: '#000', strokeThickness: 3,
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
            if (!this.roomPanelOpen || this.selectedRoom < 0) return;
            const room = this.rooms[this.selectedRoom];
            if (ROOM_DEFS[room.type].category === 'turret') {
                // Cycle targeting mode
                room.targetMode = ((room.targetMode || 0) + 1) % 4;
                const modes = ['Closest', 'Strongest', 'Weakest', 'Flying'];
                this.showNotification(`Targeting: ${modes[room.targetMode]}`, '#88CCFF');
                this.updateRoomPanel();
            } else {
                this.collectCoins(this.selectedRoom);
            }
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

    // Room methods: see rooms.js (mixin)

    getRoomCost(typeKey) {
        const def = ROOM_DEFS[typeKey];
        return Math.floor(def.baseCost * (1 + 0.12 * this.totalRoomsBuilt));
    }

    // --- ECONOMY --- (moved to rooms.js)
    // isJammerActive() moved to combat.js


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


    // --- WAVES / COMBAT --- (moved to combat.js)
    // --- DOG MISSIONS --- (moved to dogs.js)
    // --- ENEMY ABILITIES --- (moved to combat.js)

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
        const notif = this.add.text(GW / 2, 250, text, {
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
                targetMode: r.targetMode || 0,
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
                    targetMode: rd.targetMode || 0,
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
