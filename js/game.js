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
        const lobbyLabel = this.add.text(-ROOM_W / 2 + 15, -BASE_H / 2 + 8, 'Entrance',
            font('body', { strokeThickness: 4 }));
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
        topBar.fillRoundedRect(10, 10, GW - 20, 140, 16);
        topBar.lineStyle(3, 0x8B6914);
        topBar.strokeRoundedRect(10, 10, GW - 20, 140, 16);
        this.hudContainer.add(topBar);

        // Row 1: Coins | Dogs | Bones | Wave
        const row1Y = 50;
        const row2Y = 105;

        // Coins (left)
        const coinIcon = this.add.image(45, row1Y, 'coin').setScale(1.5);
        this.hudContainer.add(coinIcon);
        this.coinText = this.add.text(70, row1Y, '500',
            font('hud', { color: CLR.gold })).setOrigin(0, 0.5);
        this.hudContainer.add(this.coinText);

        // Dogs (center-left)
        this.dogText = this.add.text(360, row1Y, 'Dogs: 1',
            FONTS.heading).setOrigin(0, 0.5);
        this.hudContainer.add(this.dogText);

        // Bones (center-right)
        this.bonesText = this.add.text(600, row1Y, 'Bones: 0',
            FONTS.heading).setOrigin(0, 0.5);
        this.hudContainer.add(this.bonesText);

        // Wave (right)
        this.waveText = this.add.text(GW - 30, row1Y, 'Wave 0',
            FONTS.heading).setOrigin(1, 0.5);
        this.hudContainer.add(this.waveText);

        // Row 2: Wave preview (left) | Wave timer (right)
        this.wavePreviewText = this.add.text(30, row2Y, '',
            font('body', { color: CLR.orange })).setOrigin(0, 0);
        this.hudContainer.add(this.wavePreviewText);

        this.waveTimerText = this.add.text(GW - 30, row2Y, '',
            font('body', { color: CLR.orange })).setOrigin(1, 0);
        this.hudContainer.add(this.waveTimerText);

        // Collect all button - draw visuals, use zone for input
        const collectBtnGfx = this.add.graphics();
        collectBtnGfx.fillStyle(0x2E7D32);
        collectBtnGfx.fillRoundedRect(GW / 2 - 100, 170, 200, 55, 12);
        collectBtnGfx.lineStyle(2, 0x4CAF50);
        collectBtnGfx.strokeRoundedRect(GW / 2 - 100, 170, 200, 55, 12);
        collectBtnGfx.setDepth(500).setScrollFactor(0);

        const collectText = this.add.text(GW / 2, 197, 'Collect All',
            FONTS.body).setOrigin(0.5).setDepth(501).setScrollFactor(0);

        const collectZone = this.add.zone(GW / 2, 197, 200, 55)
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
        // Tabbed build menu
        const tabs = [
            { id: 'turret', label: 'Weapons', color: 0x8B2222, rooms: ['machinegun', 'cannon', 'sniper'] },
            { id: 'income', label: 'Production', color: 0x998520, rooms: ['kitchen', 'workshop'] },
            { id: 'housing', label: 'Capacity', color: 0x8B6914, rooms: ['quarters'] },
            { id: 'special', label: 'Comms', color: 0x2B7D50, rooms: ['radio'] },
        ];
        const rowH = 90, rowGap = 8, rowPad = 20;
        const tabH = 65, tabGap = 8;
        const maxRows = 3; // most rooms in any tab
        const PANEL_H = 55 + tabH + 15 + maxRows * (rowH + rowGap);

        this.buildBarClosedY = GH + PANEL_H + 20;
        this.buildBarContainer = this.add.container(0, this.buildBarClosedY).setDepth(510).setScrollFactor(0);
        this.buildActiveTab = 'turret';

        // Background
        const barBg = this.add.graphics();
        barBg.fillStyle(0x1A0A00, 0.95);
        barBg.fillRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        barBg.lineStyle(3, 0x8B6914);
        barBg.strokeRoundedRect(0, -PANEL_H, GW, PANEL_H + 50, { tl: 20, tr: 20, bl: 0, br: 0 });
        this.buildBarContainer.add(barBg);

        // Close button
        makeCloseButton(this, this.buildBarContainer, GW - 55, -PANEL_H + 28);

        // Tab buttons (in container, visual only)
        const tabW = (GW - 100 - (tabs.length - 1) * tabGap) / tabs.length;
        const tabY = -PANEL_H + 20;
        this.buildTabGfx = [];
        this.buildTabTexts = [];

        tabs.forEach((tab, i) => {
            const tx = 20 + i * (tabW + tabGap);
            const g = this.add.graphics();
            this.buildBarContainer.add(g);
            this.buildTabGfx.push({ gfx: g, x: tx, w: tabW, h: tabH, color: tab.color, id: tab.id });

            const txt = this.add.text(tx + tabW / 2, tabY + tabH / 2, tab.label, FONTS.body).setOrigin(0.5);
            this.buildBarContainer.add(txt);
            this.buildTabTexts.push(txt);
        });

        // Room rows container (inside buildBarContainer)
        this.buildRowsY = tabY + tabH + 15;
        const rowW = GW - rowPad * 2;

        // Create all room rows (hidden by default, shown per tab)
        this.buildCards = [];
        this.buildCardZones = [];
        const openY = GH;

        tabs.forEach(tab => {
            tab.rooms.forEach((key, ri) => {
                const def = ROOM_DEFS[key];
                const cy = this.buildRowsY + ri * (rowH + rowGap) + rowH / 2;
                const lx = rowPad;

                const g = this.add.graphics();
                g.fillStyle(tab.color);
                g.fillRoundedRect(lx, cy, rowW, rowH, 12);
                this.buildBarContainer.add(g);

                const nameTxt = this.add.text(lx + 20, cy + rowH / 2 - 15, def.name, FONTS.heading).setOrigin(0, 0.5);
                this.buildBarContainer.add(nameTxt);

                const descTxt = this.add.text(lx + 20, cy + rowH / 2 + 20, def.desc, FONTS.body).setOrigin(0, 0.5);
                this.buildBarContainer.add(descTxt);

                const costText = this.add.text(GW - rowPad - 20, cy + rowH / 2, '', font('heading', { color: CLR.gold })).setOrigin(1, 0.5);
                this.buildBarContainer.add(costText);

                const zone = this.add.zone(GW / 2, openY + cy + rowH / 2, rowW, rowH)
                    .setDepth(520).setScrollFactor(0).setInteractive();
                zone.on('pointerdown', () => { if (this.buildMenuOpen) g.setAlpha(0.6); });
                zone.on('pointerup', () => {
                    g.setAlpha(1);
                    if (this.buildMenuOpen) this.buildRoom(key);
                });
                zone.on('pointerout', () => g.setAlpha(1));
                zone.disableInteractive();

                this.buildCards.push({ key, costText, gfx: g, nameTxt, descTxt, zone, tab: tab.id });
                this.buildCardZones.push(zone);
            });
        });

        // Tab scene-level zones
        this.buildTabZones = [];
        tabs.forEach((tab, i) => {
            const tx = 20 + i * (tabW + tabGap);
            const zone = this.add.zone(tx + tabW / 2, openY + tabY + tabH / 2, tabW, tabH)
                .setDepth(520).setScrollFactor(0).setInteractive();
            zone.on('pointerup', () => {
                if (this.buildMenuOpen) {
                    this.buildActiveTab = tab.id;
                    this.refreshBuildTabs();
                }
            });
            zone.disableInteractive();
            this.buildTabZones.push(zone);
        });

        // Draw initial tab state
        this.buildTabs = tabs;
        this.refreshBuildTabs();

        // Fullscreen zone behind build menu — tap outside to close
        this.buildCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
            .setDepth(509).setScrollFactor(0).setInteractive();
        this.buildCloseZone.on('pointerup', () => { if (this.buildMenuOpen) this.toggleBuildMenu(); });
        this.buildCloseZone.disableInteractive();

        // Build button (always visible)
        this.buildBtnGfx = this.add.graphics().setDepth(505).setScrollFactor(0);
        this.drawBuildButton();

        this.buildBtnText = this.add.text(GW / 2, GH - 60, 'BUILD',
            font('button', { stroke: '#4A2800' })).setOrigin(0.5).setDepth(506).setScrollFactor(0);

        this.buildBtnZone = this.add.zone(GW / 2, GH - 60, 260, 75)
            .setDepth(507).setScrollFactor(0).setInteractive();
        this.buildBtnZone.on('pointerdown', () => this.buildBtnGfx.setAlpha(0.7));
        this.buildBtnZone.on('pointerup', () => {
            this.buildBtnGfx.setAlpha(1);
            this.toggleBuildMenu();
        });
        this.buildBtnZone.on('pointerout', () => this.buildBtnGfx.setAlpha(1));
    }

    refreshBuildTabs() {
        const active = this.buildActiveTab;

        // Redraw tab backgrounds at fixed positions
        const tabY = -(55 + 65 + 15 + 3 * (90 + 8)) + 20; // -PANEL_H + 20
        this.buildTabGfx.forEach(t => {
            t.gfx.clear();
            const isActive = t.id === active;
            t.gfx.fillStyle(isActive ? t.color : 0x333333);
            t.gfx.fillRoundedRect(t.x, tabY, t.w, t.h, 10);
        });

        // Show/hide room rows based on active tab
        this.buildCards.forEach(card => {
            const visible = card.tab === active;
            card.gfx.setVisible(visible);
            card.nameTxt.setVisible(visible);
            card.descTxt.setVisible(visible);
            card.costText.setVisible(visible);
            if (visible && this.buildMenuOpen) {
                card.zone.setInteractive();
            } else {
                card.zone.disableInteractive();
            }
        });
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

        const PW = GW - 80; // panel inner width
        const btnW = (PW - 30) / 2; // two buttons per row with gap
        const btnH = 60;
        const btnR = 12;

        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x2A1500, 0.95);
        panelBg.fillRoundedRect(-PW / 2 - 10, -180, PW + 20, 400, 16);
        panelBg.lineStyle(3, 0x8B6914);
        panelBg.strokeRoundedRect(-PW / 2 - 10, -180, PW + 20, 400, 16);
        this.roomPanel.add(panelBg);

        // Close button (top right)
        makeCloseButton(this, this.roomPanel, PW / 2 - 25, -150);

        // Info text — all white except title gold
        this.rpName = this.add.text(0, -150, '', FONTS.title).setOrigin(0.5);
        this.roomPanel.add(this.rpName);

        this.rpLevel = this.add.text(-10, -110, '', FONTS.body).setOrigin(1, 0.5);
        this.roomPanel.add(this.rpLevel);

        this.rpHp = this.add.text(10, -110, '', FONTS.body).setOrigin(0, 0.5);
        this.roomPanel.add(this.rpHp);

        this.rpStats = this.add.text(0, -72, '', FONTS.body).setOrigin(0.5);
        this.roomPanel.add(this.rpStats);

        this.rpDogs = this.add.text(0, -38, '', FONTS.body).setOrigin(0.5);
        this.roomPanel.add(this.rpDogs);

        // Row 1 buttons: Upgrade | Assign Dog
        const row1Y = 15;
        const makeBtn = (x, y, w, h, color, label) => {
            const bg = this.add.graphics();
            bg.fillStyle(color);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, btnR);
            this.roomPanel.add(bg);
            const txt = this.add.text(x, y, label, FONTS.body).setOrigin(0.5);
            this.roomPanel.add(txt);
            return txt;
        };

        this.rpUpgText = makeBtn(-PW / 4, row1Y, btnW, btnH, 0x2E7D32, 'Upgrade');
        this.rpAssignText = makeBtn(PW / 4, row1Y, btnW, btnH, 0x2E7D32, 'Assign Dog');

        // Row 2 buttons: Collect/Target | Repair
        const row2Y = 90;
        this.rpCollectText = makeBtn(-PW / 4, row2Y, btnW, btnH, 0x555555, 'Collect');
        this.rpRepairText = makeBtn(PW / 4, row2Y, btnW, btnH, 0x555555, 'Repair');

        // Scene-level zones for room panel buttons
        const rpOpenY = GH - 210;
        const rpCX = GW / 2;

        this.rpUpgZone = this.add.zone(rpCX - PW / 4, rpOpenY + row1Y, btnW, btnH)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpUpgZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.upgradeSelectedRoom();
        });

        this.rpAssignZone = this.add.zone(rpCX + PW / 4, rpOpenY + row1Y, btnW, btnH)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpAssignZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.assignDogToSelectedRoom();
        });

        this.rpCloseZone = this.add.zone(rpCX + PW / 2 - 25, rpOpenY - 150, 70, 55)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpCloseZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.hideRoomPanel();
        });

        this.rpCollectZone = this.add.zone(rpCX - PW / 4, rpOpenY + row2Y, btnW, btnH)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpCollectZone.on('pointerup', () => {
            if (!this.roomPanelOpen || this.selectedRoom < 0) return;
            const room = this.rooms[this.selectedRoom];
            if (ROOM_DEFS[room.type].category === 'turret') {
                room.targetMode = ((room.targetMode || 0) + 1) % 4;
                this.updateRoomPanel();
            } else {
                this.collectCoins(this.selectedRoom);
            }
        });

        this.rpRepairZone = this.add.zone(rpCX + PW / 4, rpOpenY + row2Y, btnW, btnH)
            .setDepth(530).setScrollFactor(0).setInteractive();
        this.rpRepairZone.on('pointerup', () => {
            if (this.roomPanelOpen) this.repairSelectedRoom();
        });

        // Fullscreen zone behind room panel — tap outside to close
        this.rpBgZone = this.add.zone(GW / 2, GH / 2, GW, GH)
            .setDepth(519).setScrollFactor(0).setInteractive();
        this.rpBgZone.on('pointerup', () => { if (this.roomPanelOpen) this.hideRoomPanel(); });

        // Start all room panel zones disabled
        this.rpUpgZone.disableInteractive();
        this.rpAssignZone.disableInteractive();
        this.rpCloseZone.disableInteractive();
        this.rpCollectZone.disableInteractive();
        this.rpRepairZone.disableInteractive();
        this.rpBgZone.disableInteractive();
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
            card.costText.setColor(this.coins >= cost ? CLR.gold : CLR.danger);
        });

        if (this.buildMenuOpen) {
            if (this.roomPanelOpen) this.hideRoomPanel();
            this.refreshBuildTabs();
            this.tweens.add({
                targets: this.buildBarContainer, y: GH,
                duration: 300, ease: 'Back.easeOut',
            });
            this.setBuildButtonAlpha(0);
            // Enable zones
            this.buildCardZones.forEach(z => z.setInteractive());
            this.buildTabZones.forEach(z => z.setInteractive());
            this.buildCloseZone.setInteractive();
            this.refreshBuildTabs(); // show/hide rows for active tab
        } else {
            this.tweens.add({
                targets: this.buildBarContainer, y: this.buildBarClosedY,
                duration: 200, ease: 'Power2',
            });
            this.setBuildButtonAlpha(1);
            // Disable all zones
            this.buildCardZones.forEach(z => z.disableInteractive());
            this.buildTabZones.forEach(z => z.disableInteractive());
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
        const notif = this.add.text(GW / 2, 250, text,
            font('heading', { color: color || CLR.white, align: 'center' })).setOrigin(0.5).setDepth(550).setScrollFactor(0);

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
        this.dogText.setText(`Dogs: ${this.dogs.length}/${this.getDogCapacity()}`);
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
                card.costText.setColor(this.coins >= cost ? CLR.gold : CLR.danger);
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
