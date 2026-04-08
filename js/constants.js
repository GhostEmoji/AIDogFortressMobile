// ============================================================
// DOG FORTRESS - Constants & Definitions
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


// --- ENEMY DEFINITIONS ---
const ENEMY_DEFS = {
    scout:   { name: 'Scout Bot',   color: 0x88AACC, hp: 55,  speed: 80,  damage: 8,  reward: 10,  size: 44, flying: false },
    assault: { name: 'Assault Bot', color: 0xCC6622, hp: 35,  speed: 130, damage: 12, reward: 15,  size: 36, flying: false },
    tank:    { name: 'Tank Bot',    color: 0x667788, hp: 140, speed: 55,  damage: 20, reward: 40,  size: 50, flying: false },
    mega:    { name: 'Mega Bot',    color: 0x994444, hp: 500, speed: 40,  damage: 40, reward: 120, size: 70, flying: false },
    drone:   { name: 'Scout Drone', color: 0x6688BB, hp: 20,  speed: 100, damage: 5,  reward: 10,  size: 32, flying: true, flyHeight: 2 },
    gunship: { name: 'Gunship',     color: 0x883333, hp: 60,  speed: 65,  damage: 15, reward: 35,  size: 46, flying: true, flyHeight: 3 },
    jammer:  { name: 'Jammer Bot', color: 0x886688, hp: 45,  speed: 70,  damage: 6,  reward: 30,  size: 42, flying: false },
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
