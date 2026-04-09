// ============================================================
// DOG FORTRESS - Dog System
// Mixin: adds dog methods to GameScene
// ============================================================

GameScene.prototype.addDog = function(forceBreedIndex) {
    const breedIndex = (forceBreedIndex !== undefined) ? forceBreedIndex : Phaser.Math.Between(0, 9);
    const breed = DOG_BREEDS[breedIndex];
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
        workTime: 0,
        sprite: null,
    };

    this.dogs.push(dog);

    // Track breed discovery
    if (!this.breedsDiscovered.includes(breedIndex)) {
        this.breedsDiscovered.push(breedIndex);
        this.showBreedDiscovery(breed, breedIndex);
    }
    this.breedTimesSeen[breedIndex] = (this.breedTimesSeen[breedIndex] || 0) + 1;

    this.updateHUD();
    return dog;
};

// Calculate total dog bonus for a room. Dream room dogs give 2x.
GameScene.prototype.getDogCapacity = function() {
    const quartersCount = this.rooms.filter(r => r.type === 'quarters' && !r.constructing).length;
    return 3 + quartersCount * 3;
};

GameScene.prototype.getRoomDogBonus = function(room) {
    const roomSkill = ROOM_SKILL_MAP[room.type] || 'production';
    let bonus = 1;
    room.dogs.forEach(dog => {
        const skill = dog.skills ? (dog.skills[roomSkill] || 1) : 1;
        const isDream = dog.dreamSkill === roomSkill;
        bonus += (skill * 0.04) * (isDream ? 2 : 1); // 4-20% per skill point, doubled for dream
    });
    return bonus;
};

// Calculate total repair rate for a room from dogs' repair skill
GameScene.prototype.getRoomRepairRate = function(room) {
    let rate = 0;
    room.dogs.forEach(dog => {
        const repairSkill = dog.skills ? dog.skills.repair : 0;
        rate += repairSkill * 0.5; // 0.5 HP/s per repair skill point
    });
    return rate;
};

GameScene.prototype.tryRecruitDog = function() {
    // Check capacity
    if (this.dogs.length >= this.getDogCapacity()) return;
    // Jammer blocks recruitment
    if (this.isJammerActive()) return;

    // Need a radio tower
    const radioRooms = this.rooms.filter(r => r.type === 'radio' && r.dogs.length > 0);
    if (radioRooms.length === 0) return;

    // Higher chance with more/better radio rooms
    const totalLevel = radioRooms.reduce((sum, r) => sum + r.level, 0);
    const chance = 0.15 + totalLevel * 0.05;

    if (Math.random() < chance) {
        const breedIdx = this.selectRecruitBreed();
        const dog = this.addDog(breedIdx);
        const isRare = DOG_BREEDS[breedIdx].rarity === 'rare';
        this.showNotification(`${dog.name} the ${dog.breed} joined!${isRare ? ' RARE!' : ''}`,
            isRare ? CLR.gold : CLR.success);

        // Celebration particles at radio rooms
        radioRooms.forEach(r => {
            const idx = this.rooms.indexOf(r);
            const ry = this.getRoomY(idx);
            this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0x44FF88, 10);
        });
        this.updateLobbyDogs();
    }
};

GameScene.prototype.assignDogToSelectedRoom = function() {
    this.showDogPicker();
};

// --- BREED RECRUITMENT & DISCOVERY ---
GameScene.prototype.selectRecruitBreed = function() {
    // 20% chance to attempt a rare breed
    if (Math.random() < 0.2) {
        const rareBreeds = DOG_BREEDS
            .map((b, i) => ({ breed: b, index: i }))
            .filter(b => b.breed.rarity === 'rare');
        Phaser.Utils.Array.Shuffle(rareBreeds);
        for (const rb of rareBreeds) {
            if (this.checkBreedCondition(rb.breed.condition)) {
                return rb.index;
            }
        }
    }
    // Fall back to random common breed
    return Phaser.Math.Between(0, 9);
};

GameScene.prototype.checkBreedCondition = function(condition) {
    if (!condition) return true;
    switch (condition.type) {
        case 'roomCount':
            return this.rooms.filter(r => r.type === condition.roomType && !r.constructing).length >= condition.min;
        case 'waveMin':
            return this.wave >= condition.wave;
        case 'totalRooms':
            return this.rooms.filter(r => !r.constructing).length >= condition.min;
        default:
            return false;
    }
};

GameScene.prototype.showBreedDiscovery = function(breed, breedIndex) {
    if (this.breedDiscoveryPopup) this.closeBreedDiscovery();

    const popup = this.add.container(GW / 2, GH / 2).setDepth(700).setScrollFactor(0);
    this.breedDiscoveryPopup = popup;

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.6);
    dim.fillRect(-GW / 2, -GH / 2, GW, GH);
    popup.add(dim);

    const panel = this.add.graphics();
    panel.fillStyle(0x2A1500, 0.95);
    panel.fillRoundedRect(-250, -220, 500, 440, 20);
    panel.lineStyle(3, 0xDAA520);
    panel.strokeRoundedRect(-250, -220, 500, 440, 20);
    popup.add(panel);

    popup.add(this.add.text(0, -190, 'New Breed Discovered!', FONTS.title).setOrigin(0.5));

    const sprite = this.add.image(0, -80, 'dog_' + breedIndex).setScale(3);
    popup.add(sprite);

    popup.add(this.add.text(0, -10, breed.name,
        font('button', { color: CLR.gold })).setOrigin(0.5));

    if (breed.rarity === 'rare') {
        popup.add(this.add.text(0, 30, 'RARE BREED!',
            font('heading', { color: CLR.gold })).setOrigin(0.5));
    }

    // Word-wrapped personality text
    const persText = this.add.text(0, breed.rarity === 'rare' ? 75 : 55, breed.personality,
        font('body', { color: CLR.white, wordWrap: { width: 420 } })).setOrigin(0.5, 0);
    popup.add(persText);

    makeCloseButton(this, popup, 215, -195);

    // Particles
    const particleCount = breed.rarity === 'rare' ? 25 : 12;
    this.spawnParticles(GW / 2, GH / 2 - 80, 0xFFD700, particleCount);

    this.breedDiscoveryCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
        .setDepth(699).setScrollFactor(0).setInteractive();
    this.breedDiscoveryCloseZone.on('pointerup', () => this.closeBreedDiscovery());

    popup.setScale(0.8).setAlpha(0);
    this.tweens.add({
        targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 200, ease: 'Back.easeOut',
    });
};

GameScene.prototype.closeBreedDiscovery = function() {
    if (this.breedDiscoveryPopup) { this.breedDiscoveryPopup.destroy(); this.breedDiscoveryPopup = null; }
    if (this.breedDiscoveryCloseZone) { this.breedDiscoveryCloseZone.destroy(); this.breedDiscoveryCloseZone = null; }
};

GameScene.prototype.earnMemento = function(dog) {
    const breed = DOG_BREEDS[dog.breedIndex];
    if (!breed || !breed.memento) return;
    this.mementosEarned.push(dog.breedIndex);
    this.showNotification(`${dog.name} gave you a memento: ${breed.memento.name}!`, CLR.gold);
    if (dog.sprite && dog.sprite.active) {
        this.spawnParticles(dog.sprite.x, dog.sprite.y, 0xFFD700, 15);
    }
};

// --- DOG INFO POPUP ---
GameScene.prototype.showDogInfo = function(dog) {
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
    const nameText = this.add.text(0, -190, `${dog.name}`,
        font('button', { color: CLR.gold })
    ).setOrigin(0.5);
    popup.add(nameText);

    const breedText = this.add.text(0, -145, `${dog.breed}`,
        font('heading', { color: CLR.brown })
    ).setOrigin(0.5);
    popup.add(breedText);

    if (isDream) {
        const dreamText = this.add.text(0, -110, 'IN DREAM ROOM! x2 BONUS',
            font('body', { color: CLR.gold })
        ).setOrigin(0.5);
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
        const label = this.add.text(-240, y, sk.label,
            font('body', { color: isRoomSkill ? CLR.white : CLR.muted })
        ).setOrigin(0, 0.5);
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
        const valText = this.add.text(240, y, `${val}/5`, FONTS.body).setOrigin(0.5);
        popup.add(valText);

        // Dream indicator
        if (sk.key === dog.dreamSkill) {
            const star = this.add.text(-260, y, '*',
                font('heading', { color: CLR.gold, strokeThickness: 3 })
            ).setOrigin(0.5);
            popup.add(star);
        }
    });

    // Close button (top right of panel)
    makeCloseButton(this, popup, 245, -195);

    // Unassign button (only if dog is assigned)
    if (dog.assignedRoom >= 0) {
        const unBg = this.add.graphics();
        unBg.fillStyle(0x555555);
        unBg.fillRoundedRect(-150, 160, 300, 55, 12);
        popup.add(unBg);

        const unText = this.add.text(0, 187, 'Unassign Dog',
            FONTS.body
        ).setOrigin(0.5);
        popup.add(unText);
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
};

GameScene.prototype.closeDogInfo = function() {
    if (this.dogInfoPopup) { this.dogInfoPopup.destroy(); this.dogInfoPopup = null; }
    if (this.dogInfoCloseZone) { this.dogInfoCloseZone.destroy(); this.dogInfoCloseZone = null; }
    if (this.dogInfoUnassignZone) { this.dogInfoUnassignZone.destroy(); this.dogInfoUnassignZone = null; }
};

GameScene.prototype.unassignDog = function(dog) {
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
};

// --- DOG PICKER (for assigning) ---
GameScene.prototype.showDogPicker = function() {
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

    // Title + close button
    popup.add(this.add.text(0, panelTop + 25, 'Choose a Dog', FONTS.title).setOrigin(0.5));
    makeCloseButton(this, popup, panelW / 2 - 55, panelTop + 25);

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
        popup.add(this.add.text(h.x, headerY, h.label,
            font('body', { color: isNeeded ? CLR.white : CLR.muted })
        ).setOrigin(0.5));
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
        popup.add(this.add.text(-panelW / 2 + 100, y - 25, dog.name, FONTS.heading));
        popup.add(this.add.text(-panelW / 2 + 100, y + 10, dog.breed + (isDream ? '  DREAM!' : ''),
            font('body', { color: isDream ? CLR.gold : CLR.brown })
        ));

        // 4 skill numbers, color-coded, bigger if it's the room's needed skill
        const skillKeys = ['combat', 'production', 'repair', 'communication'];
        const skillXs = [colX.com, colX.pro, colX.rep, colX.cmm];
        skillKeys.forEach((sk, j) => {
            const val = s[sk] || 1;
            const isNeeded = sk === roomSkill;
            const color = SKILL_COLORS[sk];
            popup.add(this.add.text(skillXs[j], y, `${val}`,
                isNeeded
                    ? font('button', { color: color })
                    : font('heading', { color: color, strokeThickness: 3 })
            ).setOrigin(0.5));
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
        popup.add(this.add.text(0, listTop + maxVisible * ROW_H + 15, `+${freeDogs.length - maxVisible} more`,
            font('body', { color: CLR.muted })
        ).setOrigin(0.5));
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
};

GameScene.prototype.closeDogPicker = function() {
    if (this.dogPickerPopup) { this.dogPickerPopup.destroy(); this.dogPickerPopup = null; }
    if (this.dogPickerCloseZone) { this.dogPickerCloseZone.destroy(); this.dogPickerCloseZone = null; }
    if (this.dogPickerZones) {
        this.dogPickerZones.forEach(z => z.destroy());
        this.dogPickerZones = null;
    }
};

GameScene.prototype.assignSpecificDog = function(dog, roomIndex) {
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
};

GameScene.prototype.updateLobbyDogs = function() {
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
            `+${freeDogs.length - maxShow}`,
            font('body', { color: CLR.muted })
        ).setOrigin(1, 0.5).setDepth(11);
        this.lobbyDogSprites.push(moreText);
    }
};

// --- DOGBOOK (tabbed: My Dogs / Collection) ---
GameScene.prototype.showDogbook = function(initialTab) {
    if (this.dogbookPopup) this.closeDogbook();

    const tab = initialTab || 'roster';
    this.dogbookTab = tab;

    const popup = this.add.container(GW / 2, GH / 2).setDepth(700).setScrollFactor(0);
    this.dogbookPopup = popup;
    this.dogbookZones = [];

    // Dim background
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.6);
    dim.fillRect(-GW / 2, -GH / 2, GW, GH);
    popup.add(dim);

    // Panel
    const panelW = GW - 60;
    const panelH = GH - 200;
    const panelTop = -panelH / 2;
    this.dogbookPanelW = panelW;
    this.dogbookPanelTop = panelTop;

    const panel = this.add.graphics();
    panel.fillStyle(0x1A0A00, 0.95);
    panel.fillRoundedRect(-panelW / 2, panelTop, panelW, panelH, 16);
    panel.lineStyle(3, 0xDAA520);
    panel.strokeRoundedRect(-panelW / 2, panelTop, panelW, panelH, 16);
    popup.add(panel);

    // Title + close
    popup.add(this.add.text(0, panelTop + 25, 'Dogbook', FONTS.title).setOrigin(0.5));
    makeCloseButton(this, popup, panelW / 2 - 55, panelTop + 25);

    // Tab buttons
    const tabY = panelTop + 70;
    const tabW = 220, tabH = 55, tabGap = 16;
    this.dogbookTabGfx = {};

    const tabs = [
        { id: 'roster', label: 'My Dogs', x: -(tabW + tabGap) / 2 },
        { id: 'collection', label: 'Collection', x: (tabW + tabGap) / 2 },
    ];

    tabs.forEach(t => {
        const isActive = t.id === tab;
        const g = this.add.graphics();
        g.fillStyle(isActive ? 0xDAA520 : 0x333333);
        g.fillRoundedRect(t.x - tabW / 2, tabY, tabW, tabH, 10);
        popup.add(g);
        this.dogbookTabGfx[t.id] = g;

        popup.add(this.add.text(t.x, tabY + tabH / 2, t.label, FONTS.body).setOrigin(0.5));

        const zone = this.add.zone(GW / 2 + t.x, GH / 2 + tabY + tabH / 2, tabW, tabH)
            .setDepth(701).setScrollFactor(0).setInteractive();
        zone.on('pointerup', () => {
            if (this.dogbookTab !== t.id) {
                this.dogbookTab = t.id;
                this.renderDogbookContent();
            }
        });
        this.dogbookZones.push(zone);
    });

    // Content area starts below tabs
    this.dogbookContentTop = tabY + tabH + 15;

    // Close zone
    this.dogbookCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
        .setDepth(699).setScrollFactor(0).setInteractive();
    this.dogbookCloseZone.on('pointerup', () => this.closeDogbook());

    // Render initial tab content
    this.renderDogbookContent();

    popup.setScale(0.8).setAlpha(0);
    this.tweens.add({
        targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 200, ease: 'Back.easeOut',
    });
};

GameScene.prototype.renderDogbookContent = function() {
    // Destroy old content
    if (this.dogbookContent) { this.dogbookContent.destroy(); }
    if (this.dogbookContentZones) {
        this.dogbookContentZones.forEach(z => z.destroy());
    }
    this.dogbookContentZones = [];

    // Update tab colors
    Object.keys(this.dogbookTabGfx).forEach(id => {
        const g = this.dogbookTabGfx[id];
        const tabW = 220, tabH = 55, tabGap = 16;
        const tx = id === 'roster' ? -(tabW + tabGap) / 2 : (tabW + tabGap) / 2;
        g.clear();
        g.fillStyle(id === this.dogbookTab ? 0xDAA520 : 0x333333);
        g.fillRoundedRect(tx - tabW / 2, this.dogbookPanelTop + 70, tabW, tabH, 10);
    });

    const content = this.add.container(0, 0);
    this.dogbookPopup.add(content);
    this.dogbookContent = content;

    if (this.dogbookTab === 'roster') {
        this.renderMyDogsTab(content);
    } else {
        this.renderCollectionTab(content);
    }
};

GameScene.prototype.renderMyDogsTab = function(content) {
    const SKILL_COLORS = { combat: '#FF5555', production: '#55CC55', repair: '#55AAFF', communication: '#CC88FF' };
    const panelW = this.dogbookPanelW;
    const contentTop = this.dogbookContentTop;
    const colX = { com: 100, pro: 220, rep: 340, cmm: 460 };

    // Column headers
    const headerY = contentTop;
    const skillDefs = [
        { x: colX.com, label: 'Combat', color: SKILL_COLORS.combat },
        { x: colX.pro, label: 'Produce', color: SKILL_COLORS.production },
        { x: colX.rep, label: 'Repair', color: SKILL_COLORS.repair },
        { x: colX.cmm, label: 'Comms', color: SKILL_COLORS.communication },
    ];
    skillDefs.forEach(h => {
        content.add(this.add.text(h.x, headerY, h.label, font('body', { color: CLR.muted })).setOrigin(0.5));
    });

    if (this.dogs.length === 0) {
        content.add(this.add.text(0, headerY + 80, 'No dogs yet!', font('heading', { color: CLR.muted })).setOrigin(0.5));
        return;
    }

    const sortedDogs = [...this.dogs].sort((a, b) => {
        if (a.assignedRoom >= 0 && b.assignedRoom < 0) return -1;
        if (a.assignedRoom < 0 && b.assignedRoom >= 0) return 1;
        return a.assignedRoom - b.assignedRoom;
    });

    const ROW_H = 95;
    const maxVisible = Math.min(sortedDogs.length, 10);
    const listTop = headerY + 30;

    for (let i = 0; i < maxVisible; i++) {
        const dog = sortedDogs[i];
        const y = listTop + i * ROW_H + ROW_H / 2;
        const s = dog.skills || {};
        const assigned = dog.assignedRoom >= 0 && dog.assignedRoom < this.rooms.length;
        const roomDef = assigned ? ROOM_DEFS[this.rooms[dog.assignedRoom]?.type] : null;
        const roomName = roomDef ? roomDef.name : 'Lobby';

        const row = this.add.graphics();
        row.fillStyle(assigned ? 0x2A1A0A : 0x1A1A1A);
        row.fillRoundedRect(-panelW / 2 + 15, y - ROW_H / 2 + 4, panelW - 30, ROW_H - 8, 10);
        content.add(row);

        content.add(this.add.image(-panelW / 2 + 55, y, 'dog_' + dog.breedIndex).setScale(1.3));
        content.add(this.add.text(-panelW / 2 + 90, y - 22, dog.name, FONTS.heading));

        const statusColor = assigned ? CLR.brown : CLR.muted;
        content.add(this.add.text(-panelW / 2 + 90, y + 12,
            `${dog.breed} \u00b7 ${roomName}`, font('body', { color: statusColor })));

        // Work time
        const mins = Math.floor((dog.workTime || 0) / 60);
        if (mins > 0) {
            content.add(this.add.text(panelW / 2 - 30, y + 12, `${mins}m`,
                font('body', { color: CLR.muted })).setOrigin(1, 0.5));
        }

        const skillKeys = ['combat', 'production', 'repair', 'communication'];
        const skillXArr = [colX.com, colX.pro, colX.rep, colX.cmm];
        skillKeys.forEach((sk, j) => {
            const val = s[sk] || 1;
            content.add(this.add.text(skillXArr[j], y, `${val}`,
                font('heading', { color: SKILL_COLORS[sk], strokeThickness: 3 })).setOrigin(0.5));
        });

        const dreamIdx = skillKeys.indexOf(dog.dreamSkill);
        if (dreamIdx >= 0) {
            content.add(this.add.text(skillXArr[dreamIdx], y - 28, '\u2605',
                font('body', { color: CLR.gold })).setOrigin(0.5));
        }

        const zone = this.add.zone(GW / 2, GH / 2 + y, panelW - 30, ROW_H - 8)
            .setDepth(701).setScrollFactor(0).setInteractive();
        zone.on('pointerdown', () => row.setAlpha(0.6));
        zone.on('pointerup', () => {
            row.setAlpha(1);
            this.closeDogbook();
            this.showDogInfo(dog);
        });
        zone.on('pointerout', () => row.setAlpha(1));
        this.dogbookContentZones.push(zone);
    }

    if (sortedDogs.length > maxVisible) {
        content.add(this.add.text(0, listTop + maxVisible * ROW_H + 10,
            `+${sortedDogs.length - maxVisible} more`,
            font('body', { color: CLR.muted })).setOrigin(0.5));
    }
};

GameScene.prototype.renderCollectionTab = function(content) {
    const panelW = this.dogbookPanelW;
    const contentTop = this.dogbookContentTop;
    const cols = 3;
    const cellW = Math.floor((panelW - 40) / cols);
    const cellH = 180;
    const gridLeft = -panelW / 2 + 20;

    for (let i = 0; i < DOG_BREEDS.length; i++) {
        const breed = DOG_BREEDS[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cx = gridLeft + col * cellW + cellW / 2;
        const cy = contentTop + row * cellH + cellH / 2;
        const discovered = this.breedsDiscovered.includes(i);
        const hasMemento = this.mementosEarned.includes(i);

        // Cell background
        const cellBg = this.add.graphics();
        cellBg.fillStyle(discovered ? 0x2A1A0A : 0x1A1A1A);
        cellBg.fillRoundedRect(cx - cellW / 2 + 5, cy - cellH / 2 + 5, cellW - 10, cellH - 10, 12);
        if (breed.rarity === 'rare') {
            cellBg.lineStyle(2, discovered ? 0xDAA520 : 0x555555);
            cellBg.strokeRoundedRect(cx - cellW / 2 + 5, cy - cellH / 2 + 5, cellW - 10, cellH - 10, 12);
        }
        content.add(cellBg);

        // Sprite or silhouette
        const texKey = discovered ? 'dog_' + i : 'dog_sil_' + i;
        content.add(this.add.image(cx, cy - 30, texKey).setScale(2));

        if (discovered) {
            content.add(this.add.text(cx, cy + 20, breed.name, FONTS.body).setOrigin(0.5));
            const rarityColor = breed.rarity === 'rare' ? CLR.gold : CLR.muted;
            content.add(this.add.text(cx, cy + 50, breed.rarity === 'rare' ? 'Rare' : 'Common',
                font('body', { color: rarityColor })).setOrigin(0.5));

            if (hasMemento) {
                content.add(this.add.text(cx + cellW / 2 - 20, cy - cellH / 2 + 20, '\u2605',
                    font('heading', { color: CLR.gold })).setOrigin(0.5));
            }
        } else {
            content.add(this.add.text(cx, cy + 20, '???', font('heading', { color: CLR.muted })).setOrigin(0.5));
            if (breed.rarity === 'rare') {
                content.add(this.add.text(cx, cy + 50, 'Rare',
                    font('body', { color: CLR.muted })).setOrigin(0.5));
            }
        }

        // Tap zone
        const zone = this.add.zone(GW / 2 + cx, GH / 2 + cy, cellW - 10, cellH - 10)
            .setDepth(701).setScrollFactor(0).setInteractive();
        zone.on('pointerdown', () => cellBg.setAlpha(0.6));
        zone.on('pointerup', () => {
            cellBg.setAlpha(1);
            if (discovered) {
                this.showBreedDetail(i);
            }
        });
        zone.on('pointerout', () => cellBg.setAlpha(1));
        this.dogbookContentZones.push(zone);
    }

    // Progress counters
    const progressY = contentTop + Math.ceil(DOG_BREEDS.length / cols) * cellH + 10;
    const disc = this.breedsDiscovered.length;
    const mems = this.mementosEarned.length;
    content.add(this.add.text(0, progressY,
        `Discovered: ${disc} / ${DOG_BREEDS.length}    Mementos: ${mems} / ${DOG_BREEDS.length}`,
        font('body', { color: CLR.gold })).setOrigin(0.5));
};

GameScene.prototype.closeDogbook = function() {
    if (this.dogbookPopup) { this.dogbookPopup.destroy(); this.dogbookPopup = null; }
    if (this.dogbookCloseZone) { this.dogbookCloseZone.destroy(); this.dogbookCloseZone = null; }
    if (this.dogbookZones) { this.dogbookZones.forEach(z => z.destroy()); this.dogbookZones = null; }
    if (this.dogbookContentZones) { this.dogbookContentZones.forEach(z => z.destroy()); this.dogbookContentZones = null; }
    this.dogbookContent = null;
    this.dogbookTabGfx = null;
};

// --- BREED DETAIL VIEW ---
GameScene.prototype.showBreedDetail = function(breedIndex) {
    if (this.breedDetailPopup) this.closeBreedDetail();

    const breed = DOG_BREEDS[breedIndex];
    const discovered = this.breedsDiscovered.includes(breedIndex);
    const hasMemento = this.mementosEarned.includes(breedIndex);
    const timesSeen = this.breedTimesSeen[breedIndex] || 0;

    const popup = this.add.container(GW / 2, GH / 2).setDepth(750).setScrollFactor(0);
    this.breedDetailPopup = popup;

    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.4);
    dim.fillRect(-GW / 2, -GH / 2, GW, GH);
    popup.add(dim);

    const pw = 560, ph = 620;
    const panel = this.add.graphics();
    panel.fillStyle(0x2A1500, 0.95);
    panel.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 20);
    panel.lineStyle(3, 0xDAA520);
    panel.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 20);
    popup.add(panel);

    // Dog sprite
    popup.add(this.add.image(0, -ph / 2 + 100, 'dog_' + breedIndex).setScale(3));

    // Name
    popup.add(this.add.text(0, -ph / 2 + 170, breed.name,
        font('button', { color: CLR.gold })).setOrigin(0.5));

    // Rarity
    const rarityColor = breed.rarity === 'rare' ? CLR.gold : CLR.muted;
    popup.add(this.add.text(0, -ph / 2 + 210, breed.rarity === 'rare' ? 'Rare Breed' : 'Common Breed',
        font('body', { color: rarityColor })).setOrigin(0.5));

    // Personality
    popup.add(this.add.text(0, -ph / 2 + 255, breed.personality,
        font('body', { color: CLR.white, wordWrap: { width: 480 } })).setOrigin(0.5, 0));

    // Affinity
    const affinityLabels = { combat: 'Combat', production: 'Production', repair: 'Repair', communication: 'Communication' };
    popup.add(this.add.text(0, -ph / 2 + 340, `Affinity: ${affinityLabels[breed.affinity]}`,
        font('body', { color: CLR.orange })).setOrigin(0.5));

    // Times recruited
    popup.add(this.add.text(0, -ph / 2 + 380, `Recruited ${timesSeen} time${timesSeen !== 1 ? 's' : ''}`,
        FONTS.body).setOrigin(0.5));

    // Memento section
    const mementoY = -ph / 2 + 430;
    if (hasMemento && breed.memento) {
        popup.add(this.add.text(0, mementoY, `Memento: ${breed.memento.name}`,
            font('heading', { color: CLR.gold })).setOrigin(0.5));
        popup.add(this.add.text(0, mementoY + 40, breed.memento.desc,
            font('body', { color: CLR.white, wordWrap: { width: 450 } })).setOrigin(0.5, 0));
    } else {
        popup.add(this.add.text(0, mementoY, 'Memento: ???',
            font('heading', { color: CLR.muted })).setOrigin(0.5));

        // Progress bar for best dog of this breed
        const dogsOfBreed = this.dogs.filter(d => d.breedIndex === breedIndex);
        const bestWork = dogsOfBreed.reduce((max, d) => Math.max(max, d.workTime || 0), 0);
        const pct = Math.min(1, bestWork / MEMENTO_WORK_SECONDS);

        const barW = 300, barH = 20;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x333333);
        barBg.fillRoundedRect(-barW / 2, mementoY + 30, barW, barH, 6);
        popup.add(barBg);
        if (pct > 0) {
            const barFill = this.add.graphics();
            barFill.fillStyle(0xDAA520);
            barFill.fillRoundedRect(-barW / 2, mementoY + 30, barW * pct, barH, 6);
            popup.add(barFill);
        }
        popup.add(this.add.text(0, mementoY + 55, `${Math.floor(pct * 100)}% work time`,
            font('body', { color: CLR.muted })).setOrigin(0.5));
    }

    // Condition hint for rare breeds
    if (breed.rarity === 'rare' && breed.condition && BREED_CONDITION_LABELS[breed.condition.type]) {
        const hint = BREED_CONDITION_LABELS[breed.condition.type](breed.condition);
        popup.add(this.add.text(0, ph / 2 - 50, hint,
            font('body', { color: CLR.orange })).setOrigin(0.5));
    }

    makeCloseButton(this, popup, pw / 2 - 45, -ph / 2 + 30);

    this.breedDetailCloseZone = this.add.zone(GW / 2, GH / 2, GW, GH)
        .setDepth(749).setScrollFactor(0).setInteractive();
    this.breedDetailCloseZone.on('pointerup', () => this.closeBreedDetail());

    popup.setScale(0.8).setAlpha(0);
    this.tweens.add({
        targets: popup, scaleX: 1, scaleY: 1, alpha: 1,
        duration: 200, ease: 'Back.easeOut',
    });
};

GameScene.prototype.closeBreedDetail = function() {
    if (this.breedDetailPopup) { this.breedDetailPopup.destroy(); this.breedDetailPopup = null; }
    if (this.breedDetailCloseZone) { this.breedDetailCloseZone.destroy(); this.breedDetailCloseZone = null; }
};

GameScene.prototype.handleRoomTapForLostDog = function(roomIndex) {
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
};

GameScene.prototype.tryLostDogMission = function() {
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
        '?',
        font('button', { color: CLR.orange, strokeThickness: 4 })
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
};
