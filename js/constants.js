// ============================================================
// DOG FORTRESS - Constants & Definitions
// ============================================================

// --- TEXT COLORS (semantic) ---
const CLR = {
    gold: '#FFD700',     // coins, titles, important highlights
    white: '#FFFFFF',    // primary text (default)
    muted: '#AAAAAA',    // disabled, secondary, "tap to close"
    danger: '#FF4444',   // damage taken, warnings, wave incoming
    success: '#44FF88',  // rewards, positive, wave cleared
    orange: '#FFAA44',   // wave preview, breed names, warm accent
    brown: '#DDA050',    // dog-related, secondary warm
};

// --- FONT STYLES ---
const FONTS = {
    // Mega - game title on menu screen
    mega: { fontFamily: 'Arial Black', fontSize: '120px', color: '#FFD700', stroke: '#000', strokeThickness: 12 },
    // Giant - wave warnings, celebration text
    giant: { fontFamily: 'Arial Black', fontSize: '72px', color: '#FFFFFF', stroke: '#000', strokeThickness: 8 },
    // Big - wave cleared, collect-all total, big numbers
    big: { fontFamily: 'Arial Black', fontSize: '52px', color: '#FFFFFF', stroke: '#000', strokeThickness: 6 },
    // HUD - coin count, dog names in popups, key numbers
    hud: { fontFamily: 'Arial Black', fontSize: '42px', color: '#FFFFFF', stroke: '#000', strokeThickness: 4 },
    // Button - BUILD, Continue, New Game, action buttons
    button: { fontFamily: 'Arial Black', fontSize: '38px', color: '#FFFFFF', stroke: '#000', strokeThickness: 5 },
    // Title - popup headers, section titles
    title: { fontFamily: 'Arial Black', fontSize: '34px', color: '#FFD700', stroke: '#000', strokeThickness: 5 },
    // Heading - room names, dog names, labels
    heading: { fontFamily: 'Arial Black', fontSize: '32px', color: '#FFFFFF', stroke: '#000', strokeThickness: 4 },
    // Body - stats, descriptions, secondary info
    body: { fontFamily: 'Arial Black', fontSize: '28px', color: '#FFFFFF', stroke: '#000', strokeThickness: 3 },
};

// Helper to clone a font style with overrides
function font(style, overrides) {
    return Object.assign({}, FONTS[style], overrides);
}

// --- UI COMPONENTS ---
// Creates a red close button (graphics + text) and adds to a container. Returns { width, height } for zone positioning.
function makeCloseButton(scene, container, x, y) {
    const w = 70, h = 55, r = 10;
    const bg = scene.add.graphics();
    bg.fillStyle(0x771111);
    bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    container.add(bg);
    const txt = scene.add.text(x, y, 'X', FONTS.body).setOrigin(0.5);
    container.add(txt);
    return { w, h };
}

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
        name: 'Kitchen', desc: '6 coins/s (needs dog)', color: 0xE8B84B, colorDark: 0xB8922E,
        baseCost: 120, baseIncome: 6, category: 'income',
    },
    workshop: {
        name: 'Workshop', desc: '14 coins/s (needs dog)', color: 0x7B8FA1, colorDark: 0x566A7A,
        baseCost: 250, baseIncome: 14, category: 'income',
    },
    radio: {
        name: 'Radio Tower', desc: 'Recruits dogs (needs dog)', color: 0x3DAE6F, colorDark: 0x2B7D50,
        baseCost: 150, baseIncome: 1, category: 'special',
        recruitInterval: 15000,
    },
    machinegun: {
        name: 'Machine Gun', desc: 'Fast fire, short range (needs dog)', color: 0xB83C3C, colorDark: 0x7A2828,
        baseCost: 150, baseIncome: 0, category: 'turret',
        baseDamage: 10, fireRate: 400, range: 550,
    },
    cannon: {
        name: 'Cannon', desc: 'Slow, heavy damage (needs dog)', color: 0x6B2D2D, colorDark: 0x4A1A1A,
        baseCost: 300, baseIncome: 0, category: 'turret',
        baseDamage: 40, fireRate: 1600, range: 650,
    },
    sniper: {
        name: 'Sniper Nest', desc: 'Long range precision (needs dog)', color: 0x5B4B9E, colorDark: 0x3E336D,
        baseCost: 400, baseIncome: 0, category: 'turret',
        baseDamage: 60, fireRate: 2200, range: 950,
    },
};


// --- ENEMY DEFINITIONS ---
const ENEMY_DEFS = {
    scout:   { name: 'Scout Bot',   color: 0x88AACC, hp: 55,  speed: 70,  damage: 6,  reward: 10,  size: 44, flying: false },
    assault: { name: 'Assault Bot', color: 0xCC6622, hp: 35,  speed: 110, damage: 8,  reward: 15,  size: 36, flying: false },
    tank:    { name: 'Tank Bot',    color: 0x667788, hp: 140, speed: 45,  damage: 14, reward: 40,  size: 50, flying: false },
    mega:    { name: 'Mega Bot',    color: 0x994444, hp: 500, speed: 35,  damage: 25, reward: 120, size: 70, flying: false },
    drone:   { name: 'Scout Drone', color: 0x6688BB, hp: 20,  speed: 85,  damage: 4,  reward: 10,  size: 32, flying: true, flyHeight: 2 },
    gunship: { name: 'Gunship',     color: 0x883333, hp: 60,  speed: 55,  damage: 10, reward: 35,  size: 46, flying: true, flyHeight: 3 },
    jammer:  { name: 'Jammer Bot', color: 0x886688, hp: 45,  speed: 60,  damage: 4,  reward: 30,  size: 42, flying: false },
};

// --- ROOM HP ---
const ROOM_MAX_HP = { income: 100, special: 80, turret: 120, housing: 80 };
const ROOM_HP_PER_LEVEL = 20;
const ENEMY_ATTACK_INTERVAL = 1500;
const FLYING_ATTACK_INTERVAL = 2000;

// --- DOG DATA ---
// Skill categories: combat, production, repair, communication
// Each breed has a primary skill affinity (higher random range for that skill)
// Common breeds (0-9) appear normally. Rare breeds (10-14) need specific conditions.
const DOG_BREEDS = [
    // --- Common breeds ---
    { name: 'Labrador', color: 0xD4A843, affinity: 'production', rarity: 'common',
      personality: 'Always happy, always hungry. Will work double shifts for treats.',
      memento: { name: 'Chewed Tennis Ball', desc: 'A soggy but beloved trophy.' } },
    { name: 'German Shepherd', color: 0xA67B4B, affinity: 'combat', rarity: 'common',
      personality: 'Born leader. Takes guard duty very seriously.',
      memento: { name: 'Tactical Bandana', desc: 'Worn on every patrol. Smells like courage.' } },
    { name: 'Corgi', color: 0xE8A040, affinity: 'repair', rarity: 'common',
      personality: 'Short legs, big heart. Surprisingly good with a wrench.',
      memento: { name: 'Tiny Crown', desc: 'Every corgi is royalty. This one proves it.' } },
    { name: 'Husky', color: 0xB0B8C8, affinity: 'combat', rarity: 'common',
      personality: 'Dramatic howler. Will argue about everything but fight harder.',
      memento: { name: 'Howling Mixtape', desc: 'A collection of their greatest howls.' } },
    { name: 'Poodle', color: 0xE8DDD0, affinity: 'production', rarity: 'common',
      personality: 'Secretly a genius. Pretends the fancy haircut is just for fun.',
      memento: { name: 'Fancy Ribbon', desc: 'Perfectly tied. They insisted.' } },
    { name: 'Dalmatian', color: 0xF0F0F0, affinity: 'combat', rarity: 'common',
      personality: 'Boundless energy. Has never walked when sprinting was an option.',
      memento: { name: 'Spotted Bandage', desc: 'Hard to tell which spots are real.' } },
    { name: 'Bulldog', color: 0xC8A878, affinity: 'repair', rarity: 'common',
      personality: 'Stubborn but dependable. If it is broken, they will fix it. Eventually.',
      memento: { name: 'Wrench Bone', desc: 'Part tool, part chew toy. Fully functional.' } },
    { name: 'Shiba Inu', color: 0xD4884A, affinity: 'communication', rarity: 'common',
      personality: 'Much talent. Very communicate. Wow.',
      memento: { name: 'Lucky Coin', desc: 'Found buried in the yard. Might be magical.' } },
    { name: 'Beagle', color: 0xC89050, affinity: 'production', rarity: 'common',
      personality: 'Follows their nose everywhere. Usually to the kitchen.',
      memento: { name: 'Sniff Map', desc: 'A hand-drawn map of every smell in the fortress.' } },
    { name: 'Border Collie', color: 0x3A3A3A, affinity: 'communication', rarity: 'common',
      personality: 'Smartest dog in the fortress. Organises the other dogs for fun.',
      memento: { name: 'Herding Whistle', desc: 'They trained YOU to respond to it.' } },
    // --- Rare breeds ---
    { name: 'Great Dane', color: 0x7A6B5A, affinity: 'combat', rarity: 'rare',
      personality: 'Gentle giant who accidentally knocks things over. Apologises with sad eyes.',
      memento: { name: 'Giant Paw Print', desc: 'Pressed in clay. Takes up the whole shelf.' },
      condition: { type: 'roomCount', roomType: 'cannon', min: 2 } },
    { name: 'Golden Retriever', color: 0xDAB04A, affinity: 'production', rarity: 'rare',
      personality: 'Will fetch anything, especially snacks from the kitchen.',
      memento: { name: 'Golden Spatula', desc: 'Their prized kitchen tool. Slightly chewed.' },
      condition: { type: 'roomCount', roomType: 'kitchen', min: 3 } },
    { name: 'Akita', color: 0xC0A080, affinity: 'combat', rarity: 'rare',
      personality: 'Silent guardian. Appears only when the fortress proves worthy.',
      memento: { name: 'Battle Fang', desc: 'A trophy from a robot they defeated alone.' },
      condition: { type: 'waveMin', wave: 10 } },
    { name: 'Whippet', color: 0xC8B8A8, affinity: 'communication', rarity: 'rare',
      personality: 'The fastest messenger. Loves high places with a view.',
      memento: { name: 'Wind Feather', desc: 'Found mid-sprint. Nobody knows how.' },
      condition: { type: 'roomCount', roomType: 'sniper', min: 1 } },
    { name: 'Saint Bernard', color: 0xA85830, affinity: 'repair', rarity: 'rare',
      personality: 'Arrives to help when the fortress grows large enough to need rescuing.',
      memento: { name: 'Rescue Barrel', desc: 'Tiny barrel on their collar. Full of treats.' },
      condition: { type: 'totalRooms', min: 12 } },
];

// Memento work time threshold (seconds of assigned work)
const MEMENTO_WORK_SECONDS = 600;

// Human-readable condition labels for Dogbook UI
const BREED_CONDITION_LABELS = {
    roomCount: (c) => `Needs ${c.min}+ ${ROOM_DEFS[c.roomType].name} rooms`,
    waveMin: (c) => `Appears after wave ${c.wave}`,
    totalRooms: (c) => `Needs ${c.min}+ total rooms`,
};

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
