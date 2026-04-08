// DOG FORTRESS - Combat System
// Mixin: adds combat methods to GameScene

GameScene.prototype.waveCountdownTick = function() {
    if (this.waveActive) {
        this.waveTimerText.setText(`${this.enemiesAlive} enemies left`);
        this.wavePreviewText.setText('');
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

    // Show wave preview
    this.wavePreviewText.setText(this.predictWave(this.wave + 1));

    if (this.waveCountdown <= 0) {
        this.startWave();
    }
};

GameScene.prototype.predictWave = function(waveNum) {
    const numEnemies = Math.min(4 + waveNum * 2, 40);
    const counts = {};

    for (let i = 0; i < numEnemies; i++) {
        let type = 'scout';
        // Use same logic as startWave but deterministic preview
        if (waveNum >= 8 && waveNum % 5 === 0 && i === numEnemies - 1) {
            type = 'mega';
        } else if (waveNum >= 7 && i % 8 === 7) {
            type = 'jammer';
        } else {
            // Approximate distribution
            const slot = i % 10;
            if (waveNum >= 6 && slot === 9) type = 'gunship';
            else if (waveNum >= 5 && slot >= 7) type = 'tank';
            else if (waveNum >= 4 && slot >= 5) type = 'drone';
            else if (waveNum >= 3 && slot >= 3) type = 'assault';
        }
        counts[type] = (counts[type] || 0) + 1;
        if (type === 'drone') counts[type] += 2; // swarm spawns 3
    }

    const names = {
        scout: 'Scout', assault: 'Assault', tank: 'Tank', mega: 'MEGA',
        drone: 'Drone', gunship: 'Gunship', jammer: 'Jammer',
    };
    const parts = Object.keys(counts).map(k => `${names[k] || k} x${counts[k]}`);
    return `Next: ${parts.join(', ')}`;
};

GameScene.prototype.startWave = function() {
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
            if (this.wave >= 7 && roll < 0.08) type = 'jammer';
            else if (this.wave >= 6 && roll < 0.12) type = 'gunship';
            else if (this.wave >= 5 && roll < 0.18) type = 'tank';
            else if (this.wave >= 4 && roll < 0.28) type = 'drone';
            else if (this.wave >= 3 && roll < 0.38) type = 'assault';

            // Boss mega bot on wave milestones
            if (this.wave >= 8 && this.wave % 5 === 0 && i === numEnemies - 1) type = 'mega';

            const side = Math.random() < 0.5 ? 'left' : 'right';
            if (type === 'drone') {
                // Swarm: spawn 3 drones at once
                for (let d = 0; d < 3; d++) {
                    this.time.delayedCall(d * 150, () => this.spawnEnemy('drone', side));
                }
            } else {
                this.spawnEnemy(type, side);
            }
        });
    }
};

GameScene.prototype.spawnEnemy = function(type, side) {
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
};

GameScene.prototype.updateEnemies = function(delta) {
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
                        if (e.type === 'gunship' && this.rooms.length > 1) {
                            // Bombardment: hit up to 3 rooms with split damage
                            const targets = new Set([targetIdx]);
                            while (targets.size < Math.min(3, this.rooms.length)) {
                                targets.add(Phaser.Math.Between(0, this.rooms.length - 1));
                            }
                            const splitDmg = Math.ceil(e.damage / targets.size);
                            targets.forEach(ri => {
                                if (!this.rooms[ri].constructing) {
                                    this.damageRoom(ri, splitDmg);
                                    this.fireEnemyProjectile(e, ri);
                                }
                            });
                        } else {
                            this.damageRoom(targetIdx, e.damage);
                            this.fireEnemyProjectile(e, targetIdx);
                        }
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
                            // Tank: siege damage (2x)
                            const dmgMult = e.type === 'tank' ? 2 : 1;
                            this.damageRoom(targetIdx, e.damage * dmgMult);
                            this.fireEnemyProjectile(e, targetIdx);

                            // Assault: EMP stun nearest turret for 2s
                            if (e.type === 'assault') {
                                this.empStunNearestTurret(targetIdx);
                            }

                            // Mega: quake — damage ALL rooms
                            if (e.type === 'mega') {
                                this.cameras.main.shake(200, 0.01);
                                this.rooms.forEach((r, ri) => {
                                    if (ri !== targetIdx && !r.constructing) {
                                        this.damageRoom(ri, Math.floor(e.damage * 0.25));
                                    }
                                });
                            }
                        }
                    }
                    // Shake while attacking
                    e.sprite.x = e.x + Math.sin(time * 0.02) * 3;
                }
            }
        }
    }
};

GameScene.prototype.updateTurrets = function(time) {
    this.rooms.forEach((room, i) => {
        const def = ROOM_DEFS[room.type];
        if (def.category !== 'turret') return;
        if (room.constructing) return;
        if (room.stunned) return; // EMP stunned
        if (room.dogs.length === 0) return; // turrets need a dog to operate
        if (this.enemies.length === 0) return;

        // Cooldown check (damaged turrets fire slower)
        const hpMult = 0.1 + 0.9 * (room.hp / room.maxHp);
        const effectiveFireRate = def.fireRate / hpMult;
        if (time - room.lastFire < effectiveFireRate) return;

        // Find target based on targeting mode
        const ry = this.getRoomY(i) + ROOM_H / 2;
        let target = null;
        let bestScore = null;
        const mode = room.targetMode || 0;

        this.enemies.forEach(e => {
            const dx = e.x - FORT_CX;
            const dy = e.y - ry;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist >= def.range) return;

            let score;
            if (mode === 0) score = -dist;                    // closest: highest = nearest
            else if (mode === 1) score = e.hp;                // strongest: highest HP
            else if (mode === 2) score = -e.hp;               // weakest: lowest HP
            else if (mode === 3) score = e.flying ? 1000 - dist : -dist; // flying first

            if (bestScore === null || score > bestScore) {
                bestScore = score;
                target = e;
            }
        });

        const nearest = target;

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
};

GameScene.prototype.fireProjectile = function(room, roomIndex, target) {
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
};

GameScene.prototype.updateProjectiles = function(delta) {
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
};

GameScene.prototype.damageEnemy = function(enemy, damage) {
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
};

GameScene.prototype.killEnemy = function(enemy) {
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
};

GameScene.prototype.waveComplete = function() {
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
};

GameScene.prototype.empStunNearestTurret = function(nearRoomIdx) {
    // Find closest turret room to the attacked room
    let bestTurret = -1, bestDist = Infinity;
    this.rooms.forEach((r, i) => {
        if (ROOM_DEFS[r.type].category !== 'turret') return;
        if (r.constructing || r.stunned) return;
        const dist = Math.abs(i - nearRoomIdx);
        if (dist < bestDist) { bestDist = dist; bestTurret = i; }
    });

    if (bestTurret >= 0) {
        const room = this.rooms[bestTurret];
        room.stunned = true;

        // Visual: dark overlay with sparks
        const stunOverlay = this.add.graphics();
        stunOverlay.fillStyle(0x000022, 0.5);
        stunOverlay.fillRect(-ROOM_W / 2, -ROOM_H / 2, ROOM_W, ROOM_H);
        room.container.add(stunOverlay);

        // Spark particles
        const ry = this.getRoomY(bestTurret);
        this.spawnParticles(FORT_CX, ry + ROOM_H / 2, 0x4488FF, 8);

        this.showNotification('Turret stunned!', '#4488FF');

        // Remove stun after 2 seconds
        this.time.delayedCall(2000, () => {
            room.stunned = false;
            stunOverlay.destroy();
        });
    }
};

GameScene.prototype.fireEnemyProjectile = function(enemy, roomIndex) {
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
};

GameScene.prototype.isJammerActive = function() {
    return this.enemies.some(e => e.type === 'jammer' && e.atFortress);
};
