// DOG FORTRESS - Menu Scene

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
        const title = this.add.text(cx, cy - 350, 'DOG\nFORTRESS', font('mega', { align: 'center', lineSpacing: -10 })).setOrigin(0.5);

        // Subtitle
        this.add.text(cx, cy - 210, 'Defend. Build. Recruit.', font('hud', { color: '#DDA060' })).setOrigin(0.5);

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

            this.add.text(cx, GH - 340, 'Continue', font('hud', { stroke: '#4A2800' })).setOrigin(0.5);

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

        this.add.text(cx, newY + btnH / 2, 'New Game', font('hud', { stroke: hasSave ? '#333333' : '#4A2800' })).setOrigin(0.5);

        const newZone = this.add.zone(cx, newY + btnH / 2, btnW, btnH).setInteractive();
        newZone.on('pointerdown', () => newBg.setAlpha(0.7));
        newZone.on('pointerup', () => startGame(true));
        newZone.on('pointerout', () => newBg.setAlpha(1));
    }
}
