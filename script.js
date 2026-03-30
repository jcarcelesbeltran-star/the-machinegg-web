const GAME_MARKET = "galaxy"; // "itchio" o "crazygames" o "galaxy"

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sfxCok = new Audio('audio/cok.wav');
const sfxEgg = new Audio('audio/egg.wav');
const sfxMoney = new Audio('audio/money.mp3');
const sfxDeathBirth = new Audio('audio/muerte-nacimiento.wav');
const sfxDeath = new Audio('audio/death.wav');
const sfxLayEgg = new Audio('audio/ponerhuevo.wav');
const sfxCatPurr = new Audio('audio/catpurring.wav');
sfxCatPurr.loop = true;
sfxCatPurr.volume = 1.0;
const sfxPopBuy = new Audio('audio/pop-buy.wav');
const bgmTheme = new Audio('audio/theme.wav');
bgmTheme.loop = true;

const sfxCok1 = new Audio('audio/cok1.wav');
const sfxCok2 = new Audio('audio/cok2.wav');
const sfxCok3 = new Audio('audio/cok3.wav');
const randomCokSounds = [sfxCok1, sfxCok2, sfxCok3];
function playRandomCok() {
    playSound(randomCokSounds[Math.floor(Math.random() * randomCokSounds.length)], 0.15, 100);
}

let lastSoundTimes = {};
function playSound(audioObj, vol = 1.0, throttleMs = 50, rndPitch = false) {
    if (!audioObj) return;
    if (window.isMusicMuted) return;
    let key = audioObj.src;
    let now = Date.now();
    if (lastSoundTimes[key] && now - lastSoundTimes[key] < throttleMs) return;
    lastSoundTimes[key] = now;
    let clone = audioObj.cloneNode();
    clone.volume = vol;
    if (rndPitch) {
        clone.preservesPitch = false;
        clone.mozPreservesPitch = false;
        clone.playbackRate = 0.8 + Math.random() * 0.6;
    }
    clone.play().catch(e => { });
}

window.isMusicMuted = false;
window.isAdPaused = false;
function updateBGM() {
    if (state.musicLevel > 0 && !window.isMusicMuted) {
        bgmTheme.volume = 0.15;
        bgmTheme.play().catch(e => { });
    } else {
        bgmTheme.pause();
    }
}

document.body.addEventListener('click', () => {
    if (state.musicLevel > 0 && bgmTheme.paused && !window.isMusicMuted) {
        bgmTheme.volume = 0.15;
        bgmTheme.play().catch(e => { });
    }
}, { once: true });

const REFILL_TIERS = [50, 100, 250, 500, 1000];
const REFILL_COST_TIERS = [1, 2, 5, 10, 20];
const AUTO_TICK_TIERS = [0, 1, 2, 4, 8, 12, 20, 40];
const MAX_RESOURCE_TIERS = [50, 100, 200, 350, 550, 800, 1100, 1500, 1800, 2150, 2500];

const MEADOW_BOTTOM = 400;
const EGG_GROUND_Y = MEADOW_BOTTOM + 10;
const UNDERGROUND_CEILING_Y = 430;
const UNDERGROUND_FLOOR_Y = 600;

const THE_END_MATRIX = [
    // THANKS
    "   XXXXX X   X  XXX  X   X X   X  XXX    ",
    "     X   X   X X   X XX  X X  X  X       ",
    "     X   XXXXX XXXXX X X X XXX    XXX    ",
    "     X   X   X X   X X  XX X  X      X   ",
    "     X   X   X X   X X   X X   X  XXX    ",
    "                                         ",
    // FOR
    "            XXXX  XXX  XXXX              ",
    "            X    X   X X   X             ",
    "            XXX  X   X XXXX              ",
    "            X    X   X X  X              ",
    "            X     XXX  X   X             ",
    "                                         ",
    // PLAYING 
    "XXXX  X      XXX  X   X XXXXX X   X  XXX ",
    "X   X X     X   X X   X   X   XX  X X    ",
    "XXXX  X     XXXXX   X     X   X X X X  XX",
    "X     X     X   X   X     X   X  XX X   X",
    "X     XXXXX X   X   X   XXXXX X   X  XXX "
];

const CRUELTY_MATRICES = [
    // NO (25 Xs)
    [
        "X   X  XXX ",
        "XX  X X   X",
        "X X X X   X",
        "X  XX X   X",
        "X   X  XXX "
    ],
    // WHY? (35 Xs)
    [
        "X   X X   X X   X",
        "X   X X   X X   X",
        "X X X XXXXX  XXX ",
        "XX XX X   X   X  ",
        "X   X X   X   X  "
    ],
    // BAD (44 Xs)
    [
        "XXXX   XXX  XXXX ",
        "X   X X   X X   X",
        "XXXX  XXXXX X   X",
        "X   X X   X X   X",
        "XXXX  X   X XXXX "
    ],
    // GUILTY (63 Xs)
    [
        " XXX  X   X XXXXX X     XXXXX X   X",
        "X     X   X   X   X       X   X   X",
        "X  XX X   X   X   X       X    XXX ",
        "X   X X   X   X   X       X     X  ",
        " XXX   XXX  XXXXX XXXXX   X     X  "
    ],
    // SINNER (80 Xs)
    [
        " XXX  XXXXX X   X X   X XXXXX XXXX ",
        "X      X   XX  X XX  X X     X   X",
        " XXX    X   X X X X X X XXXX  XXXX ",
        "    X   X   X  XX X  XX X     X  X ",
        " XXX  XXXXX X   X X   X XXXXX X   X"
    ],
    // MONSTER (88 Xs)
    [
        "X   X  XXX  X   X  XXX  XXXXX XXXXX XXXX ",
        "XX XX X   X XX  X X       X   X     X   X",
        "X X X X   X X X X  XXX    X   XXXX  XXXX ",
        "X   X X   X X  XX     X   X   X     X  X ",
        "X   X  XXX  X   X  XXX    X   XXXXX X   X"
    ]
];

function getGraveyardMatrix() {
    let totalFarmSize = state.chickens + tombstonesArr.length;
    if (totalFarmSize >= 88) return CRUELTY_MATRICES[5];
    if (totalFarmSize >= 80) return CRUELTY_MATRICES[4];
    if (totalFarmSize >= 63) return CRUELTY_MATRICES[3];
    if (totalFarmSize >= 44) return CRUELTY_MATRICES[2];
    if (totalFarmSize >= 35) return CRUELTY_MATRICES[1];
    return CRUELTY_MATRICES[0];
}

function assignGraveyardTarget(c) {
    c.action = 'walkToGraveyard';
    c.isGrey = false;
    c.isSad = true;
    let activeDeaths = chickensArr.filter(ch => ch.action === 'walkToGraveyard' || ch.action === 'sadFace').length;
    let idx = tombstonesArr.length + activeDeaths - 1;

    let currentMatrix = getGraveyardMatrix();
    let countX = 0;
    let targetFound = false;
    let matrixCols = currentMatrix[0].length;
    let matrixRows = currentMatrix.length;
    let gSpacingX = Math.min(20, Math.floor((canvas.width - 60) / matrixCols));
    let gSpacingY = 24;
    let sX = (canvas.width - ((matrixCols - 1) * gSpacingX)) / 2;
    let sY = 80;

    for (let col = 0; col < matrixCols && !targetFound; col++) {
        for (let r = 0; r < matrixRows && !targetFound; r++) {
            if (currentMatrix[r][col] === 'X') {
                if (countX === idx) {
                    c.targetX = sX + col * gSpacingX;
                    c.targetY = sY + r * gSpacingY;
                    targetFound = true;
                }
                countX++;
            }
        }
    }

    if (!targetFound) {
        c.targetX = 20 + Math.random() * (canvas.width - 40);
        c.targetY = 320 + Math.random() * 60;
    }
}
let cinematicPhase = 0;
let cinematicTimer = 0;
let retireFadeTimer = -1; // -1 = inactive, 0+ = fading

let state = {
    money: 0,
    basket: [],
    food: 50,
    maxFood: 50,
    water: 50,
    maxWater: 50,

    chickens: 0,
    autoCollect: false,
    autoSellLevel: 0,
    premiumLevel: 0,
    goldenLevel: 0,
    goldenChance: 0,
    eggsSold: 0,
    refillLevel: 0,
    manualRefills: 0,
    maxFoodLevel: 0,
    maxWaterLevel: 0,
    autoFoodLevel: 0,
    autoWaterLevel: 0,
    baseValueLevel: 0,
    autoCollectLevel: 0,
    hasWasher: false,
    hasRamp: false,
    hasPackager: false,
    packageBuffer: [],
    magnetLevel: 0,
    hasRooster: false,
    roosterLevel: 0,
    hasStamper: false,
    hasRibbon: false,
    musicLevel: 0,
    dietLevel: 0,
    batchLevel: 0,
    hasRetired: false,
    hasPetting: false,

    costs: {
        chicken: 0,
        petting: 2,
        maxFood: 500,
        maxWater: 500,
        autoFood: 1000,
        autoWater: 1000,
        autoCollect: 25,
        autoSell: 100,
        refill: 1000,
        premium: 2500,
        golden: 50000,
        baseValue: 10,
        ramp: 4,
        washer: 1000,
        packager: 100000,
        magnet: 5,
        rooster: 200,
        growth: 1000,
        stamper: 15000,
        ribbon: 600000,
        music: 500,
        diet: 1500,
        batch: 30000,
        retire: 1000000000,
        tvAd: 100000000
    }
};

let roostersArr = [];
let chicksArr = [];

function fmt(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    return Math.floor(num).toLocaleString('en-US');
}

function fmtMoney(num) {
    if (num === undefined || num === null || isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 1) return num.toFixed(2);
    if (num < 10) return num.toFixed(1);
    return Math.floor(num).toLocaleString('en-US');
}

function getPips(cur, max) {
    cur = Math.min(cur, max);
    return '<br><span style="color:#a0522d; font-size:10px; letter-spacing:1px; line-height:1.5;">' + '■'.repeat(cur) + '</span><span style="color:#7f8c8d; font-size:10px; letter-spacing:1px; line-height:1.5;">' + '□'.repeat(max - cur) + '</span>';
}

function drawSpeechBubble(ctx, lines, x, y, isFlipped = false) {
    ctx.save();
    let pulse = Math.abs(Math.sin(Date.now() / 200)) * 2;
    ctx.translate(x, y + (isFlipped ? pulse + 10 : -pulse));

    ctx.font = '8px "Press Start 2P"';
    let maxTw = 0;
    lines.forEach(l => {
        let w = ctx.measureText(l).width;
        if (w > maxTw) maxTw = w;
    });

    let boxW = maxTw + 12;
    let lineH = 12;
    let padding = 6;
    let boxH = (lines.length * lineH) + padding;
    let boxY = isFlipped ? 8 : -boxH - 2;

    // Auto-clamp horizontally if bubble is requested via absolute coordinates
    let shiftX = 0;
    if (x !== 0) {
        if (x - boxW / 2 < 10) shiftX = 10 - (x - boxW / 2);
        else if (x + boxW / 2 > 790) shiftX = 790 - (x + boxW / 2);
    }

    ctx.fillStyle = '#fff';
    ctx.fillRect(-boxW / 2 + shiftX, boxY, boxW, boxH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-boxW / 2 + shiftX, boxY, boxW, boxH);

    ctx.beginPath();
    if (isFlipped) {
        ctx.moveTo(-4, 8);
        ctx.lineTo(4, 8);
        ctx.lineTo(0, 0);
    } else {
        ctx.moveTo(-4, -2);
        ctx.lineTo(4, -2);
        ctx.lineTo(0, 4);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    if (isFlipped) {
        ctx.fillRect(-3, 7, 6, 3);
    } else {
        ctx.fillRect(-3, -4, 6, 3);
    }

    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], shiftX, boxY + padding + (i * lineH));
    }
    ctx.restore();
}

function drawFence(ctx, w, h) {
    let topY = 5; // Más pegada arriba

    // Top horizontal rails
    ctx.fillStyle = '#4a2e15'; ctx.fillRect(0, topY + 7, w, 6);
    ctx.fillStyle = '#4a2e15'; ctx.fillRect(0, topY + 27, w, 6);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(0, topY + 5, w, 6);
    ctx.fillStyle = '#6b4423'; ctx.fillRect(0, topY + 25, w, 6);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, topY + 5, w, 2);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(0, topY + 25, w, 2);

    // Top fence vertical posts
    for (let x = 15; x < w; x += 55) {
        // Drop shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 2, topY - 10, 14, 50);
        // Base post
        ctx.fillStyle = '#7a4e25'; ctx.fillRect(x, topY - 10, 14, 48);
        ctx.beginPath(); ctx.moveTo(x, topY - 10); ctx.lineTo(x + 7, topY - 18); ctx.lineTo(x + 14, topY - 10); ctx.fill();
        // Highlight post
        ctx.fillStyle = '#9b6a3b'; ctx.fillRect(x, topY - 10, 3, 48);
        ctx.beginPath(); ctx.moveTo(x, topY - 10); ctx.lineTo(x + 7, topY - 18); ctx.lineTo(x + 7, topY - 10); ctx.fill();
        // Detail / Nail
        ctx.fillStyle = '#2a1a0d'; ctx.fillRect(x + 6, topY + 7, 2, 2);
        ctx.fillStyle = '#2a1a0d'; ctx.fillRect(x + 6, topY + 27, 2, 2);
    }
}

const moneyEl = document.getElementById('money');
const chickensEl = document.getElementById('chickens');
const btnCheat = document.getElementById('cheat-btn');
const btnWipe = document.getElementById('wipe-btn');

const shopBtns = {
    chicken: document.getElementById('buy-chicken'),
    petting: document.getElementById('buy-petting'),
    maxFood: document.getElementById('buy-maxfood'),
    maxWater: document.getElementById('buy-maxwater'),
    autoFood: document.getElementById('buy-autofood'),
    autoWater: document.getElementById('buy-autowater'),
    autoCollect: document.getElementById('buy-autocollect'),
    autoSell: document.getElementById('buy-autosell'),
    refill: document.getElementById('buy-refill'),
    premium: document.getElementById('buy-premium'),
    golden: document.getElementById('buy-golden'),
    baseValue: document.getElementById('buy-basevalue'),
    washer: document.getElementById('buy-washer'),
    packager: document.getElementById('buy-packager'),
    magnet: document.getElementById('buy-magnet'),
    rooster: document.getElementById('buy-rooster'),
    growth: document.getElementById('buy-growth'),
    retire: document.getElementById('buy-retire'),
    stamper: document.getElementById('buy-stamper'),
    ribbon: document.getElementById('buy-ribbon'),
    music: document.getElementById('buy-music'),
    diet: document.getElementById('buy-diet'),
    batch: document.getElementById('buy-batch'),
    ramp: document.getElementById('buy-ramp'),
    tvAd: document.getElementById('buy-tvAd')
};

const shopCosts = {
    chicken: document.getElementById('cost-chicken'),
    petting: document.getElementById('cost-petting'),
    maxFood: document.getElementById('cost-maxfood'),
    maxWater: document.getElementById('cost-maxwater'),
    autoFood: document.getElementById('cost-autofood'),
    autoWater: document.getElementById('cost-autowater'),
    autoCollect: document.getElementById('cost-autocollect'),
    autoSell: document.getElementById('cost-autosell'),
    refill: document.getElementById('cost-refill'),
    premium: document.getElementById('cost-premium'),
    golden: document.getElementById('cost-golden'),
    baseValue: document.getElementById('cost-basevalue'),
    washer: document.getElementById('cost-washer'),
    packager: document.getElementById('cost-packager'),
    magnet: document.getElementById('cost-magnet'),
    rooster: document.getElementById('cost-rooster'),
    growth: document.getElementById('cost-growth'),
    retire: document.getElementById('cost-retire'),
    stamper: document.getElementById('cost-stamper'),
    ribbon: document.getElementById('cost-ribbon'),
    music: document.getElementById('cost-music'),
    diet: document.getElementById('cost-diet'),
    batch: document.getElementById('cost-batch'),
    ramp: document.getElementById('cost-ramp'),
    tvAd: document.getElementById('cost-tvAd')
};

let autoSellTimer = 0;

let chickensArr = [];
let eggsArr = [];
let particlesArr = [];
let tombstonesArr = [];
let draggedEggs = [];
let isDragging = false;
let mouseX = 0, mouseY = 0;

function createRooster() {
    return {
        x: canvas.width / 2,
        y: MEADOW_BOTTOM / 2,
        moveTimer: 2,
        mateTimer: 30,
        direction: 1,
        velX: 0,
        velY: 0,
        action: 'roam',
        targetChicken: null
    };
}

function createChick(x, y) {
    return {
        x: x,
        y: y,
        moveTimer: 2,
        foodTimer: 10,
        growTimer: 90 - ((state.growthLevel || 0) * 6),
        direction: 1,
        velX: (Math.random() - 0.5) * 40,
        velY: (Math.random() - 0.5) * 40,
        action: 'roam',
        isGrey: false,
        failTimer: 0,
        hasFailedOnce: false,
        dead: false
    };
}

function createChicken() {
    const altColors = ['#dcc5a4', '#8b5a2b', '#444444'];
    let cColor = Math.random() < 0.5 ? '#ffffff' : altColors[Math.floor(Math.random() * altColors.length)];
    return {
        x: Math.random() * (canvas.width - 40) + 20,
        y: 40 + Math.random() * (MEADOW_BOTTOM - 60),
        color: cColor,
        moveTimer: Math.random() * 3,
        eggTimer: Math.random() * 10,
        squishTimer: 0,
        direction: 1,
        velX: (Math.random() - 0.5) * 40,
        velY: (Math.random() - 0.5) * 40,

        action: 'roam',
        nextTrough: Math.random() < 0.5 ? 'goToFood' : 'goToWater',
        eggCount: 0,
        failTimer: 0,
        isGrey: false,
        hasFailedOnce: false,
        dead: false
    };
}

function initChickens() {
    chickensArr = [];
    for (let i = 0; i < state.chickens; i++) {
        chickensArr.push(createChicken());
    }
}
initChickens();

let lastTime = 0;
const EGG_FALL_SPEED = 300;

function resolveTroughCollision(c) {
    let padding = 5;
    let isTracking = (c.action === 'goToFood' || c.action === 'goToWater' || c.action === 'chase');
    // Water
    let mWLvl = state.maxWaterLevel || 0;
    let whTrough = 40 + mWLvl * 16;
    let wyTrough = 180 - whTrough / 2;
    let wx = -100, ww = 140 + padding;
    let wy = wyTrough - padding, wh = whTrough + padding * 2;
    let wCenterY = wy + wh / 2;
    if (c.x > wx && c.x < wx + ww && c.y > wy && c.y < wy + wh) {
        let dl = c.x - wx;
        let dr = (wx + ww) - c.x;
        let dt = c.y - wy;
        let db = (wy + wh) - c.y;
        let min = Math.min(dl, dr, dt, db);
        if (min === dl) { c.x = wx; if (!isTracking) c.velX = -Math.abs(c.velX || 10); }
        else if (min === dr) { c.x = wx + ww; if (!isTracking) c.velX = Math.abs(c.velX || 10); }
        else if (min === dt) { c.y = wy; if (!isTracking) c.velY = -Math.abs(c.velY || 10); }
        else { c.y = wy + wh; if (!isTracking) c.velY = Math.abs(c.velY || 10); }
    }

    // Food
    let mFLvl = state.maxFoodLevel || 0;
    let fhTrough = 40 + mFLvl * 16;
    let fyTrough = 180 - fhTrough / 2;
    let fx = 760 - padding, fw = 200;
    let fy = fyTrough - padding, fh = fhTrough + padding * 2;
    let fCenterY = fy + fh / 2;
    if (c.x > fx && c.x < fx + fw && c.y > fy && c.y < fy + fh) {
        let dl = c.x - fx;
        let dr = (fx + fw) - c.x;
        let dt = c.y - fy;
        let db = (fy + fh) - c.y;
        let min = Math.min(dl, dr, dt, db);
        if (min === dl) { c.x = fx; if (!isTracking) c.velX = -Math.abs(c.velX || 10); }
        else if (min === dr) { c.x = fx + fw; if (!isTracking) c.velX = Math.abs(c.velX || 10); }
        else if (min === dt) { c.y = fy; if (!isTracking) c.velY = -Math.abs(c.velY || 10); }
        else { c.y = fy + fh; if (!isTracking) c.velY = Math.abs(c.velY || 10); }
    }
}

function update(dt) {
    if (window.isAdPaused) return;

    // Retire pre-fade (2s blackout before cinematic)
    if (retireFadeTimer >= 0) {
        retireFadeTimer += dt;
        if (retireFadeTimer >= 2.0 && !state.hasRetired) {
            // Trigger the actual cinematic now
            state.hasRetired = true;
            document.getElementById('shop').style.display = 'none';
            canvas.width = 1140;
            eggsArr = []; chicksArr = []; roostersArr = []; tombstonesArr = []; particlesArr = []; draggedEggs = [];
            let oldChickensNum = state.chickens;
            let countX = 0;
            THE_END_MATRIX.forEach(r => { for (let i = 0; i < r.length; i++) if (r[i] === 'X') countX++; });
            chickensArr = [];
            for (let i = 0; i < countX; i++) {
                chickensArr.push({
                    x: -200 - (Math.random() * 800),
                    y: 60 + Math.random() * (canvas.height - 120),
                    targetX: 0, targetY: 0,
                    velX: 80 + Math.random() * 40,
                    velY: (Math.random() - 0.5) * 5,
                    direction: 1, action: 'roam',
                    color: Math.random() < 0.5 ? '#ffffff' : ['#dcc5a4', '#8b5a2b', '#444444'][Math.floor(Math.random() * 3)]
                });
            }
            state.chickens = oldChickensNum;
            let gridSpacing = 16;
            let matrixCols = Math.max(...THE_END_MATRIX.map(r => r.length));
            let startX = Math.round((canvas.width - (matrixCols * gridSpacing)) / 2);
            let startY = 173;
            let chickenIdx = 0;
            for (let r = 0; r < THE_END_MATRIX.length; r++) {
                for (let c = 0; c < THE_END_MATRIX[r].length; c++) {
                    if (THE_END_MATRIX[r][c] === 'X' && chickenIdx < chickensArr.length) {
                        chickensArr[chickenIdx].targetX = startX + (c * gridSpacing);
                        chickensArr[chickenIdx].targetY = startY + (r * gridSpacing);
                        chickenIdx++;
                    }
                }
            }
            cinematicPhase = 0; cinematicTimer = 0;
            retireFadeTimer = -1;
            saveState();
            updateUI();
        }
        return;
    }

    if (state.hasRetired) {
        updateCinematic(dt);
        return;
    }

    if (window.catPurrVol > 0) {
        window.catPurrVol = Math.max(0, window.catPurrVol - 0.5 * dt);
        sfxCatPurr.volume = window.catPurrVol;
    }

    // TV Ad logic requires no per-frame updates, sales are boosted passively at collection.

    state.playTime = (state.playTime || 0) + dt;

    state.nextAdTime = state.nextAdTime || 600;

    if (GAME_MARKET === "crazygames" && window.isCrazyGamesInitialized) {
        if (state.playTime >= state.nextAdTime) {
            state.nextAdTime += 600; // Increment target by 10 minutes
            triggerMidgameAd("Take a break...");
        }
    }

    if (state.hasTvAd) {
        state.tvTimer = (state.tvTimer || 0) + dt;
        if (state.tvTimer >= 1) {
            state.tvTimer -= 1;
            state.tvUpvotes = (state.tvUpvotes || 0) + Math.floor(Math.random() * 5) + 1;
        }
    }

    saveTimer += dt;
    if (saveTimer >= 5) {
        saveState();
        saveTimer = 0;
    }

    let speedMult = 1 + (state.musicLevel * 0.15);
    let autoFoodAmt = AUTO_TICK_TIERS[state.autoFoodLevel] * dt;
    let autoWaterAmt = AUTO_TICK_TIERS[state.autoWaterLevel] * dt;
    state.food = Math.min(state.maxFood, state.food + autoFoodAmt);
    state.water = Math.min(state.maxWater, state.water + autoWaterAmt);

    // Global starvation alarm removed; chickens scream individually when failing to eat/drink.

    particlesArr.forEach(p => {
        p.life -= dt;
        p.y -= 20 * dt;
    });
    particlesArr = particlesArr.filter(p => p.life > 0);

    tombstonesArr.forEach(t => {
        if (t.shakeTimer > 0) t.shakeTimer -= dt;
    });

    // Chicks AI
    let newChicks = [];
    chicksArr.forEach(ch => {
        if (ch.dead) {
            state.deadChickens = (state.deadChickens || 0) + 1;
            tombstonesArr.push({ x: ch.x, y: ch.y, hp: 5, shakeTimer: 0, spawnTime: Date.now() });
            return;
        }

        ch.growTimer -= dt;
        if (ch.growTimer <= 0) {
            state.chickens++;
            let newAdult = createChicken();
            newAdult.x = ch.x;
            newAdult.y = ch.y;
            chickensArr.push(newAdult);
            playSound(sfxCok, 0.3, 100);
            return;
        }

        if (ch.action === 'roam') {
            ch.foodTimer -= dt;
            if (ch.foodTimer <= 0) {
                ch.action = 'goToFood';
                ch.roamTargetX = undefined; // Clear roam state
                playRandomCok();
            } else {
                if (ch.roamTargetX === undefined) {
                    ch.roamTargetX = 60 + Math.random() * (canvas.width - 120);
                    ch.roamTargetY = 60 + Math.random() * (MEADOW_BOTTOM - 100);

                    let dx = ch.roamTargetX - ch.x;
                    let dy = ch.roamTargetY - ch.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    let speed = 40;
                    if (dist > 0) {
                        ch.velX = (dx / dist) * speed;
                        ch.velY = (dy / dist) * speed;
                    }
                    ch.restTimer = 1 + Math.random() * 4;
                }

                let dx = ch.roamTargetX - ch.x;
                let dy = ch.roamTargetY - ch.y;
                let dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= 5) {
                    ch.velX = 0; ch.velY = 0;
                    ch.restTimer -= dt;
                    if (ch.restTimer <= 0) {
                        ch.roamTargetX = undefined; // trigger next wander
                    }
                }
            }
        } else if (ch.action === 'failedFood') {
            ch.failTimer -= dt;
            if (ch.failTimer <= 0) {
                ch.action = 'goToFood';
                ch.troughY = undefined;
                playRandomCok();
                ch.isGrey = false;
            }
        }

        if (ch.action === 'goToFood') {
            if (ch.troughY === undefined) {
                let mFLvl = state.maxFoodLevel || 0;
                let fhBase = 40 + mFLvl * 16;
                let fyBase = 180 - fhBase / 2;
                ch.troughY = fyBase + 10 + Math.random() * Math.max(0, fhBase - 20);

                let fx = 750, fy = ch.troughY;
                let dx = fx - ch.x;
                let dy = fy - ch.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                let speed = 80;
                if (dist > 0) {
                    ch.velX = (dx / dist) * speed;
                    ch.velY = (dy / dist) * speed;
                }
            }

            let fx = 750, fy = ch.troughY;
            let dx = fx - ch.x;
            let dy = fy - ch.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 80) {
                ch.troughY = undefined;
                ch.velX = 0; ch.velY = 0;
                if (state.food >= 10) {
                    state.food -= 10;
                    ch.action = 'roam';
                    ch.foodTimer = 10 + Math.random() * 5;
                    ch.hasFailedOnce = false;
                    // Provide a small scatter burst so they don't perfectly stack
                    ch.velX = (Math.random() - 0.5) * 60;
                    ch.velY = Math.random() * 40;
                } else {
                    if (ch.hasFailedOnce) {
                        if (!ch.dead) playSound(sfxDeath, 0.4, 200);
                        ch.dead = true;
                    } else {
                        ch.action = 'failedFood';
                        ch.failTimer = 5;
                        ch.isGrey = true;
                        ch.hasFailedOnce = true;
                        if (!ch.hasSuffered) {
                            ch.hasSuffered = true;
                            state.chickensSuffered = (state.chickensSuffered || 0) + 1;
                        }
                        playSound(sfxDeathBirth, 0.1);
                    }
                }
            }
        }

        ch.x += ch.velX * dt * speedMult;
        ch.y += ch.velY * dt * speedMult;
        if (ch.x < 20) ch.x = 20;
        if (ch.x > canvas.width - 20) ch.x = canvas.width - 20;
        if (ch.y < 40) ch.y = 40;
        if (ch.y > MEADOW_BOTTOM - 20) ch.y = MEADOW_BOTTOM - 20;

        // Collision for Water/Food Troughs (avoid hiding behind them)
        resolveTroughCollision(ch);

        if (Math.abs(ch.velX) > 1) {
            ch.direction = ch.velX >= 0 ? 1 : -1;
        }
        newChicks.push(ch);
    });
    chicksArr = newChicks;

    // Rooster AI
    if (state.hasRooster) {
        roostersArr.forEach(r => {

            if (r.squishTimer > 0) r.squishTimer -= dt;

            if (r.action === 'roam') {
                if (r.roamTargetX === undefined) {
                    r.roamTargetX = r.x; r.roamTargetY = r.y; r.restTimer = 1 + Math.random() * 2;
                }
                let dx = r.roamTargetX - r.x;
                let dy = r.roamTargetY - r.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 5) {
                    let speed = 35;
                    r.velX = (dx / dist) * speed; r.velY = (dy / dist) * speed;
                } else {
                    r.velX = 0; r.velY = 0;
                    r.restTimer = (r.restTimer || 0) - dt;
                    if (r.restTimer <= 0) {
                        r.roamTargetX = 60 + Math.random() * (canvas.width - 120);
                        r.roamTargetY = 60 + Math.random() * (MEADOW_BOTTOM - 100);
                        r.restTimer = 2 + Math.random() * 5;
                    }
                }

                r.mateTimer -= dt;
                if (r.mateTimer <= 0 && chickensArr.length > 0) {
                    r.action = 'chase';
                    r.targetChicken = chickensArr[Math.floor(Math.random() * chickensArr.length)];
                }
            } else if (r.action === 'chase') {
                if (!r.targetChicken || r.targetChicken.dead) {
                    r.action = 'roam';
                    r.mateTimer = 10;
                } else {
                    let dx = r.targetChicken.x - r.x;
                    let dy = r.targetChicken.y - r.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 15) {
                        // Mated!
                        chicksArr.push(createChick(r.targetChicken.x, r.targetChicken.y));
                        particlesArr.push({ x: r.targetChicken.x, y: r.targetChicken.y - 20, text: '❤', life: 1.0 });
                        r.action = 'roam';
                        r.mateTimer = 30;
                        r.targetChicken = null;
                        r.velX = (Math.random() - 0.5) * 50;
                        r.velY = (Math.random() - 0.5) * 50;
                        r.moveTimer = 2;
                    } else {
                        let speed = 90;
                        r.velX = (dx / dist) * speed;
                        r.velY = (dy / dist) * speed;
                    }
                }
            }

            r.x += r.velX * dt * speedMult;
            r.y += r.velY * dt * speedMult;
            if (r.x < 20) r.x = 20;
            if (r.x > canvas.width - 20) r.x = canvas.width - 20;
            if (r.y < 40) r.y = 40;
            if (r.y > MEADOW_BOTTOM - 20) r.y = MEADOW_BOTTOM - 20;

            resolveTroughCollision(r);

            if (Math.abs(r.velX) > 1) {
                r.direction = r.velX >= 0 ? 1 : -1;
            }
        });
    }

    chickensArr.forEach(c => {
        if (c.squishTimer > 0) c.squishTimer -= dt;
        if (c.jumpTimer > 0) c.jumpTimer -= dt;

        if (c.action === 'walkToGraveyard') {
            let dx = c.targetX - c.x;
            let dy = c.targetY - c.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                let speed = 18; // Slow, mournful drag (20% faster)
                c.velX = (dx / dist) * speed;
                c.velY = (dy / dist) * speed;
                c.direction = c.velX >= 0 ? 1 : -1;
                c.x += c.velX * dt;
                c.y += c.velY * dt;
            } else {
                c.x = c.targetX;
                c.y = c.targetY;
                c.velX = 0;
                c.velY = 0;
                if (c.action !== 'sadFace') playSound(sfxDeath, 0.5, 200);
                c.action = 'sadFace';
                c.giveUpTimer = 4;
            }
        } else if (c.action === 'sadFace') {
            c.giveUpTimer -= dt;
            if (c.giveUpTimer <= 0) {
                c.dead = true;
                c.sadDeath = true;
            }
        } else if (c.action === 'eating' || c.action === 'drinking') {
            c.eatTimer -= dt;
            c.velX = 0; c.velY = 0;
            c.direction = (c.action === 'eating') ? 1 : -1;

            let batchMultiplier = state.batchLevel === 2 ? 4 : (state.batchLevel === 1 ? 2 : 1);
            if (c.consumptionGoal === undefined) c.consumptionGoal = 5 * batchMultiplier;
            let drain = (5 * batchMultiplier) * (dt / 2.0);
            let resource = c.action === 'eating' ? state.food : state.water;
            let actualDrain = Math.min(drain, resource, c.consumptionGoal);

            if (c.action === 'eating') state.food -= actualDrain;
            if (c.action === 'drinking') state.water -= actualDrain;
            c.consumptionGoal -= actualDrain;

            if ((c.action === 'eating' && state.food <= 0) || (c.action === 'drinking' && state.water <= 0)) {
                c.eatTimer = 0; // Force immediate leave on empty trough
            }

            if (c.eatTimer <= 0) {
                if (c.consumptionGoal > 0.1) {
                    c.action = c.action === 'eating' ? 'failedFood' : 'failedWater';
                    c.failTimer = 10;
                    c.isGrey = true;
                    c.hasFailedOnce = true;
                    if (!c.hasSuffered) {
                        c.hasSuffered = true;
                        state.chickensSuffered = (state.chickensSuffered || 0) + 1;
                    }
                    playSound(sfxDeathBirth, 0.1);
                } else {
                    c.action = 'roam';
                    c.hasFailedOnce = false;
                    delete c.consumptionGoal;
                    c.restTimer = 1.0;
                }
                delete c.roamTargetX;
            }
        } else if (c.action === 'roam' || c.action === 'failedFood' || c.action === 'failedWater') {
            if (c.roamTargetX === undefined) {
                c.roamTargetX = c.x; c.roamTargetY = c.y;
                if (c.restTimer === undefined || c.restTimer <= 0) c.restTimer = 1 + Math.random() * 2;
            }
            let dx = c.roamTargetX - c.x;
            let dy = c.roamTargetY - c.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                let speed = 30;
                c.velX = (dx / dist) * speed; c.velY = (dy / dist) * speed;
                c.direction = c.velX >= 0 ? 1 : -1;
            } else {
                c.velX = 0; c.velY = 0;
                c.restTimer = (c.restTimer || 0) - dt;
                if (c.restTimer <= 0) {
                    c.roamTargetX = 80 + Math.random() * (canvas.width - 160);
                    c.roamTargetY = 70 + Math.random() * (MEADOW_BOTTOM - 120);
                    c.restTimer = 2 + Math.random() * 5;
                }
            }

            c.x += c.velX * dt * speedMult;
            c.y += c.velY * dt * speedMult;
            if (c.x < 20) c.x = 20;
            if (c.x > canvas.width - 20) c.x = canvas.width - 20;
            if (c.y < 40) c.y = 40;
            if (c.y > MEADOW_BOTTOM - 20) c.y = MEADOW_BOTTOM - 20;

            resolveTroughCollision(c);

            if (c.action === 'roam') {
                c.eggTimer -= dt;
                if (c.eggTimer <= 0) {
                    layEgg(c.x, c.y, c.direction);
                    c.squishTimer = 0.5;
                    c.jumpTimer = 0.5;
                    c.eggTimer = 10 - state.dietLevel;
                    c.eggCount++;
                    let eggCap = state.batchLevel === 2 ? 8 : (state.batchLevel === 1 ? 4 : 2);
                    if (c.eggCount >= eggCap) {
                        c.action = c.nextTrough;
                        c.nextTrough = (c.nextTrough === 'goToFood') ? 'goToWater' : 'goToFood';
                        playRandomCok();
                    }
                }
            } else {
                c.failTimer -= dt;

                // Nervous jumping and sprinting while angry
                if (c.angryTargetX === undefined || (Math.abs(c.x - c.angryTargetX) < 10 && Math.abs(c.y - c.angryTargetY) < 10)) {
                    c.angryTargetX = c.x + (Math.random() - 0.5) * 150;
                    c.angryTargetY = c.y + (Math.random() - 0.5) * 150;
                    c.angryTargetX = Math.max(100, Math.min(canvas.width - 100, c.angryTargetX));
                    c.angryTargetY = Math.max(40, Math.min(MEADOW_BOTTOM - 20, c.angryTargetY));

                    if (Math.random() > 0.2) {
                        c.jumpTimer = 0.4;
                        if (Math.random() > 0.5) playRandomCok();
                    }
                }

                let dx = c.angryTargetX - c.x;
                let dy = c.angryTargetY - c.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 5) {
                    let speed = 100;
                    c.velX = (dx / dist) * speed;
                    c.velY = (dy / dist) * speed;
                    c.direction = c.velX >= 0 ? 1 : -1;
                    c.x += c.velX * dt * speedMult;
                    c.y += c.velY * dt * speedMult;
                }

                if (c.failTimer <= 0) {
                    c.action = c.action === 'failedFood' ? 'goToFood' : 'goToWater';
                    c.angryTargetX = undefined;
                    playRandomCok();
                }
            }
        } else if (c.action === 'goToFood' || c.action === 'goToWater') {
            if (c.troughY === undefined) {
                let lvl = (c.action === 'goToFood') ? (state.maxFoodLevel || 0) : (state.maxWaterLevel || 0);
                let hBase = 40 + lvl * 16;
                let yBase = 180 - hBase / 2;
                c.troughY = yBase + 10 + Math.random() * Math.max(0, hBase - 20);
            }
            let targetX = c.action === 'goToFood' ? 750 : 50;
            let targetY = c.troughY;

            let dx = targetX - c.x;
            let dy = targetY - c.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 25) {
                let speed = c.isGrey ? 100 : 60; // Run if angry
                c.velX = (dx / dist) * speed;
                c.velY = (dy / dist) * speed;
                c.direction = c.velX >= 0 ? 1 : -1;
                c.x += c.velX * dt * speedMult;
                c.y += c.velY * dt * speedMult;

                resolveTroughCollision(c);


            } else {
                delete c.troughY;
                if (c.action === 'goToFood') {
                    if (state.food > 0 || !c.hasFailedOnce) {
                        c.action = 'eating';
                        c.eatTimer = 2.0;
                        let batchMultiplier = state.batchLevel === 2 ? 4 : (state.batchLevel === 1 ? 2 : 1);
                        if (c.consumptionGoal === undefined) c.consumptionGoal = 5 * batchMultiplier;
                        c.isGrey = false;
                        c.eggCount = 0;
                    } else {
                        assignGraveyardTarget(c);
                    }
                } else if (c.action === 'goToWater') {
                    if (state.water > 0 || !c.hasFailedOnce) {
                        c.action = 'drinking';
                        c.eatTimer = 2.0;
                        let batchMultiplier = state.batchLevel === 2 ? 4 : (state.batchLevel === 1 ? 2 : 1);
                        if (c.consumptionGoal === undefined) c.consumptionGoal = 5 * batchMultiplier;
                        c.isGrey = false;
                        c.eggCount = 0;
                    } else {
                        assignGraveyardTarget(c);
                    }
                }
            }
        }
        if (Math.abs(c.velX) > 1) {
            c.direction = c.velX >= 0 ? 1 : -1;
        }
    });

    let newChickens = [];
    let chickensDied = false;
    chickensArr.forEach(c => {
        if (c.dead) {
            state.chickens--;
            state.deadChickens = (state.deadChickens || 0) + 1;
            let t = { x: c.x, y: c.y, hp: 5, shakeTimer: 0, spawnTime: Date.now() };
            tombstonesArr.push(t);
            chickensDied = true;
        } else {
            newChickens.push(c);
        }
    });
    chickensArr = newChickens;

    if (chickensDied) {
        updateUI();
        saveState();
    }

    if (isDragging) {
        let grabRadius = 30 + state.magnetLevel * 5;
        let maxGrab = state.magnetLevel + 1;

        eggsArr.forEach(egg => {
            if (!egg.collected && !egg.isBeingDragged && draggedEggs.length < maxGrab) {
                let dx = mouseX - egg.x;
                let dy = mouseY - egg.y;
                if (dx * dx + dy * dy < grabRadius * grabRadius) {
                    egg.isBeingDragged = true;
                    draggedEggs.push(egg);
                }
            }
        });

        draggedEggs.forEach((egg, idx) => {
            let offsetR = (draggedEggs.length > 1) ? 1 : 0;
            let nx = Math.sin(idx * 7.1) * 6;
            let ny = Math.cos(idx * 3.3) * 6;
            let tx = mouseX + nx * offsetR;
            let ty = mouseY + ny * offsetR;

            let prevY = egg.y;
            let prevX = egg.x;

            egg.x += (tx - egg.x) * 15 * dt;
            egg.y += (ty - egg.y) * 15 * dt;
            egg.velX = 0;
            egg.velY = 0;
            // egg.angle = 0; // Removed so they keep their rotation naturally

            if (egg.x < 5) egg.x = 5;
            if (egg.x > canvas.width - 5) egg.x = canvas.width - 5;
            if (egg.y < 5) egg.y = 5;

            // X-Boundary of the vertical hole wall
            if (egg.y > EGG_GROUND_Y && egg.y < UNDERGROUND_CEILING_Y) {
                if (egg.x > 80 && prevX <= 80) {
                    egg.x = 80;
                }
            }

            let inLeftHole = (egg.x <= 80);

            // Y-Boundaries of solid floors
            if (!inLeftHole) {
                if (prevY <= EGG_GROUND_Y && egg.y > EGG_GROUND_Y) {
                    egg.y = EGG_GROUND_Y;
                } else if (prevY >= UNDERGROUND_CEILING_Y && egg.y < UNDERGROUND_CEILING_Y) {
                    egg.y = UNDERGROUND_CEILING_Y;
                } else if (egg.y > EGG_GROUND_Y && egg.y < UNDERGROUND_CEILING_Y) {
                    if (Math.abs(egg.y - EGG_GROUND_Y) < Math.abs(egg.y - UNDERGROUND_CEILING_Y)) {
                        egg.y = EGG_GROUND_Y;
                    } else {
                        egg.y = UNDERGROUND_CEILING_Y;
                    }
                }
            }

            let inRightHole = (egg.x >= canvas.width - 80 && egg.y >= UNDERGROUND_CEILING_Y);
            let targetY = EGG_GROUND_Y;
            if (egg.y > EGG_GROUND_Y + 10 || inLeftHole) targetY = UNDERGROUND_FLOOR_Y;
            if (inRightHole) targetY = canvas.height + 50;
            if (egg.y > targetY) egg.y = targetY;
        });

        // Drop eggs if they get stuck behind collision geometry and cursor moves away
        let newDragged = [];
        draggedEggs.forEach(egg => {
            let dx = mouseX - egg.x;
            let dy = mouseY - egg.y;
            if (dx * dx + dy * dy > 450 * 450) {
                egg.isBeingDragged = false;
            } else {
                newDragged.push(egg);
            }
        });
        draggedEggs = newDragged;
    }

    eggsArr.forEach(e => {
        if (!e.collected && !e.isBeingDragged) {
            let inLeftHole = (e.x <= 80);
            let inRightHole = (e.x >= canvas.width - 80 && e.y >= UNDERGROUND_CEILING_Y);

            let targetY = EGG_GROUND_Y;
            if (e.y > EGG_GROUND_Y + 10 || inLeftHole) targetY = UNDERGROUND_FLOOR_Y;
            if (inRightHole) targetY = canvas.height + 50;
            e.floorY = targetY; // Save for post-physics clamp

            // Apply Universal Gravity
            e.velY += 2500 * dt;

            // Belt physics acceleration
            if (e.y >= targetY - 5) {
                if (targetY === EGG_GROUND_Y && !inLeftHole && state.autoCollectLevel > 0) {
                    let speedFactor = 0.01 + 0.99 * (state.autoCollectLevel / 5);
                    if (e.x >= 80 && e.x <= canvas.width + 10) {
                        e.velX -= (600 * speedFactor) * dt;
                    }
                } else if (targetY === UNDERGROUND_FLOOR_Y && state.autoSellLevel > 0 && !inRightHole) {
                    let speedFactor = 0.01 + 0.99 * (state.autoSellLevel / 5);
                    if (e.x >= 0 && e.x <= canvas.width - 70) {
                        e.velX += (600 * speedFactor) * dt;
                    }
                }
            }

            e.x += e.velX * dt;
            e.y += e.velY * dt;

            // Wall Bounces
            if (e.x < 5) { e.x = 5; e.velX *= -0.3; }
            if (e.x > canvas.width - 5) { e.x = canvas.width - 5; e.velX *= -0.3; }
            if (e.y < 5) { e.y = 5; e.velY *= -0.3; }

            if (e.y < UNDERGROUND_CEILING_Y && e.y > EGG_GROUND_Y + 10 && !inLeftHole && e.velY < 0) {
                e.y = UNDERGROUND_CEILING_Y;
                e.velY *= -0.3;
            }


            if (state.hasRamp && e.x <= 40 && e.y >= UNDERGROUND_FLOOR_Y - 30) {
                let rampY = UNDERGROUND_FLOOR_Y - 30 * (1 - e.x / 40);
                if (e.y >= rampY) {
                    if (e.velY > 50 && !e.hasHitGround) {
                        playSound(sfxEgg, 0.15, 20);
                        e.hasHitGround = true;
                    }
                    e.y = rampY - 2;
                    e.velY = -500;
                    e.velX = 875;
                }
            }

            // Floor Clamp & Friction
            if (e.y >= targetY) {
                if (e.velY > 50 && !e.hasHitGround) {
                    playSound(sfxEgg, 0.15, 20);
                    e.hasHitGround = true;
                }
                e.y = targetY;
                if (e.velY > 10) {
                    e.velY *= -0.2;
                } else {
                    e.velY = 0;
                }
                e.velX *= Math.pow(0.01, dt);
            } else {
                e.velX *= Math.pow(0.5, dt);
            }

            // Limits
            e.velX = Math.max(-1000, Math.min(1000, e.velX));
            e.velY = Math.max(-1500, Math.min(1500, e.velY));

            // Angle update for rolling
            if (e.type === 'package') {
                e.angle = 0;
            } else {
                e.angle = e.angle || 0;
                if (Math.abs(e.velX) > 5 && e.y >= targetY - 2) {
                    e.angle += (e.velX * dt) / 5;
                }
            }

            // Underground Machines processing
            if (e.y >= UNDERGROUND_FLOOR_Y - 100 && e.y <= UNDERGROUND_FLOOR_Y) {
                if (state.hasWasher && e.type !== 'package' && !e.washed && e.x >= 220 && e.x <= 310) {
                    e.washed = true;
                    e.value = Math.floor(e.value * 2);
                }

                if (state.hasStamper && e.type !== 'package' && !e.stamped && e.x >= 392 && e.x <= 406) {
                    e.stamped = true;
                    e.value = Math.floor(e.value * 2);
                    window.lastStampActTime = Date.now();
                }

                if (state.hasRibbon && e.type === 'package' && !e.hasRibbon && e.x >= 630 && e.x <= 660) {
                    e.hasRibbon = true;
                    e.value *= 2;
                }

                if (e.y >= UNDERGROUND_FLOOR_Y - 15) {
                    if (state.hasPackager && e.type !== 'package' && e.x >= 500 && e.x <= 560) {
                        state.packageBuffer.push({
                            value: e.value,
                            type: e.type,
                            washed: e.washed,
                            stamped: e.stamped
                        });
                        e.collected = true;
                        if (state.packageBuffer.length === 6) {
                            let totalVal = state.packageBuffer.reduce((a, b) => a + (typeof b === 'object' ? b.value : b), 0);
                            let packValue = Math.floor(totalVal * 2);
                            eggsArr.push({
                                x: 560,
                                y: UNDERGROUND_FLOOR_Y - 10,
                                type: 'package',
                                collected: false,
                                value: packValue,
                                isBeingDragged: false,
                                angle: 0,
                                velX: 80 + Math.random() * 50,
                                velY: -150,
                                washed: false
                            });
                            state.packageBuffer = [];
                        }
                    }
                }
            }

            // Market Sell Trigger
            if (e.y > UNDERGROUND_FLOOR_Y + 10 && e.x > canvas.width - 80) {
                collectEgg(e);
            }
        }
    });

    // Stable constraint solver via Sweep and Prune optimization
    let activeEggs = eggsArr.filter(e => !e.collected && !e.isBeingDragged);
    for (let iter = 0; iter < 2; iter++) { // 2 iterations scale much better
        activeEggs.sort((a, b) => a.x - b.x);
        for (let i = 0; i < activeEggs.length; i++) {
            let e1 = activeEggs[i];
            for (let j = i + 1; j < activeEggs.length; j++) {
                let e2 = activeEggs[j];

                let dx = e2.x - e1.x;
                if (dx > 25) break;

                let dy = e2.y - e1.y;
                if (Math.abs(dy) > 25) continue;

                let isBox1 = (e1.type === 'package');
                let isBox2 = (e2.type === 'package');

                if (!isBox1 && !isBox2) {
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    let minDist = 10;

                    if (dist === 0) { dx = (Math.random() - 0.5) * 0.1; dy = (Math.random() - 0.5) * 0.1; dist = 0.1; }

                    if (dist < minDist) {
                        let overlap = minDist - dist;
                        let nx = dx / dist, ny = dy / dist;
                        let push = overlap * 0.5;
                        e1.x -= nx * push; e1.y -= ny * push;
                        e2.x += nx * push; e2.y += ny * push;

                        let avgVx = (e1.velX + e2.velX) * 0.5;
                        let avgVy = (e1.velY + e2.velY) * 0.5;
                        e1.velX = avgVx; e2.velX = avgVx;
                        e1.velY = avgVy; e2.velY = avgVy;
                    }
                } else if (isBox1 && isBox2) {
                    let overlapX = 16 - dx;
                    let overlapY = 12 - Math.abs(dy);

                    if (overlapX > 0 && overlapY > 0) {
                        if (overlapX < overlapY) {
                            let push = overlapX * 0.5;
                            e1.x -= push; e2.x += push;
                        } else {
                            let push = overlapY * 0.5 * Math.sign(dy);
                            e1.y -= push; e2.y += push;
                        }
                        let avgVx = (e1.velX + e2.velX) * 0.5;
                        let avgVy = (e1.velY + e2.velY) * 0.5;
                        e1.velX = avgVx; e2.velX = avgVx;
                        e1.velY = avgVy; e2.velY = avgVy;
                    }
                } else {
                    let box = isBox1 ? e1 : e2;
                    let circ = isBox1 ? e2 : e1;
                    let cx = Math.max(box.x - 8, Math.min(circ.x, box.x + 8));
                    let cy = Math.max(box.y - 6, Math.min(circ.y, box.y + 6));
                    let cx_dx = circ.x - cx;
                    let cx_dy = circ.y - cy;
                    let distSq = cx_dx * cx_dx + cx_dy * cx_dy;

                    if (distSq < 25) {
                        let dist = Math.sqrt(distSq);
                        if (dist === 0) { cx_dx = 0; cx_dy = -1; dist = 1; }
                        let overlap = 5 - dist;
                        let nx = cx_dx / dist, ny = cx_dy / dist;
                        let push = overlap * 0.5;
                        circ.x += nx * push; circ.y += ny * push;
                        box.x -= nx * push; box.y -= ny * push;
                        let avgVx = (circ.velX + box.velX) * 0.5;
                        let avgVy = (circ.velY + box.velY) * 0.5;
                        circ.velX = avgVx; box.velX = avgVx;
                        circ.velY = avgVy; box.velY = avgVy;
                    }
                }
            }
        }
    }

    // Strict floor enforcement AFTER physics iterations
    eggsArr.forEach(e => {
        if (!e.collected && !e.isBeingDragged) {
            if (e.y > e.floorY) {
                e.y = e.floorY;
                e.velY = 0;
            }
        }
    });

    eggsArr = eggsArr.filter(e => !e.collected);

    updateUI();
}

function layEgg(x, y, dir = 1) {
    playSound(sfxLayEgg, 0.3, 50, true);
    let type = 'normal';
    let rand = Math.random();
    let premiumChance = state.premiumLevel * 0.05;
    let goldenChance = (state.goldenLevel || 0) * 0.01;

    if (rand < goldenChance) {
        type = 'golden';
    } else if (rand < goldenChance + premiumChance) {
        type = 'premium';
    }

    eggsArr.push({
        x: x,
        y: y - 5, // Spawn slightly above the chicken
        type: type,
        collected: false,
        value: getEggValue(type),
        isBeingDragged: false,
        velX: -dir * (60 + Math.random() * 40), // Horizontal velocity based on chicken direction
        velY: -150 - Math.random() * 100, // Upward velocity
        angle: 0,
        washed: false,
        stamped: false
    });
}

function getEggValue(type) {
    let base = Math.pow(1.5, state.baseValueLevel || 0);
    if (type === 'golden') return 5 * base;
    if (type === 'premium') return 2 * base;
    return base;
}

function collectEgg(egg) {
    egg.collected = true;
    playSound(sfxMoney, 0.3, 100);
    let finalValue = state.hasTvAd ? egg.value * 2 : egg.value;
    state.money += finalValue;
    state.totalEarnings = (state.totalEarnings || state.money || 0) + finalValue;
    state.eggsSold++;
    particlesArr.push({ x: canvas.width - 40, y: canvas.height - 30, text: '+$' + fmtMoney(finalValue), life: 1.0 });
    updateUI();
}

function renderChicken(ctx, c) {
    let isSquished = c.squishTimer > 0;
    let w = isSquished ? 24 : 20;
    let h = isSquished ? 12 : 16;
    let offsetP = isSquished ? 4 : 0;

    let deathP = (c.action === 'sadFace') ? Math.max(0, 1.0 - (c.giveUpTimer / 4)) : 0;
    let squatP = Math.min(1.0, deathP * 2); // Reaches full squat by halfway (2s)

    if (c.action === 'sadFace') {
        offsetP += squatP * 12; // Sinks down 
        h = Math.max(8, h - squatP * 8); // Flattens by 50%
        w = w + squatP * 6; // Body gets wider
    }

    let isWalking = Math.abs(c.velX) > 5 || Math.abs(c.velY) > 5;
    let t = c.isGrey ? (Date.now() / 60 + (c._i = c._i || Math.random() * 1000)) : (Date.now() / 150 + (c._i = c._i || Math.random() * 1000));
    let headBobX = isWalking ? Math.cos(t) * 2 : 0;
    let headBobY = isWalking ? Math.abs(Math.sin(t)) * 2 : (Math.sin(t / 3) > 0.9 ? 3 : 0);

    let isEating = (c.action === 'eating' || c.action === 'drinking' || c.action === 'failedFood' || c.action === 'failedWater');
    if (isEating) {
        let peckPhase = ((c.eatTimer || c.failTimer || 0) * 2.5) % 1.0;
        if (peckPhase < 0.3) { headBobX = 3; headBobY = 10; }
        else { headBobX = 1; headBobY = 4; }
    }
    if (c.action === 'sadFace') {
        headBobX = 0;
        headBobY = 0; // Disable random idle twitches while dying
    }

    let wingFlap = isWalking ? Math.sin(t) * (c.isGrey ? 4 : 2) : 0;
    let legSwing = isWalking ? Math.sin(t) * (c.isGrey ? 7 : 4) : 0;

    let jumpY = 0;
    if (c.jumpTimer > 0) {
        let p = 1.0 - (c.jumpTimer / 0.5);
        jumpY = -4 * 15 * p * (1 - p);
        wingFlap = -4;
        legSwing = 0;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    let sScale = c.jumpTimer > 0 ? 1 - (jumpY / -30) : 1;
    let shadowW = (w * 0.8) * sScale;
    ctx.fillRect(c.x - shadowW / 2, c.y + 7, shadowW, 4); // Shadow stays at ground level, unfazed by offsetP

    ctx.save();
    ctx.translate(0, jumpY);

    // Legs
    ctx.fillStyle = '#ffa500';
    ctx.fillRect(c.x - 4 + legSwing, c.y + 4 + offsetP, 2, 4 - squatP * 4); // Back leg shrinks
    ctx.fillRect(c.x + 2 - legSwing, c.y + 4 + offsetP, 2, 4 - squatP * 4); // Front leg shrinks

    // Body
    ctx.fillStyle = c.color || '#ffffff';
    ctx.fillRect(c.x - (w / 2), c.y - 12 + offsetP, w, h);

    // Head Base Prep
    let dir = c.direction || 1;
    let isVertical = (!c.isSad && c.action !== 'eating' && c.action !== 'drinking') && (Math.abs(c.velY) > Math.abs(c.velX) * 1.2);
    let isFrontActive = isVertical && c.velY > 0;
    let isBackActive = isVertical && c.velY < 0;
    let isProfile = !isFrontActive && !isBackActive;

    // Wing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    if (isProfile) {
        ctx.fillRect(c.x - 4, c.y - 6 + offsetP + wingFlap, 8 + squatP * 2, 5 - squatP);
    } else {
        // Two side wings for Front/Back views
        ctx.fillRect(c.x - (w / 2) - 2, c.y - 6 + offsetP + wingFlap, 3, 6);
        ctx.fillRect(c.x + (w / 2) - 1, c.y - 6 + offsetP + wingFlap, 3, 6);
    }

    let sadHeadOffsetX = c.isSad ? dir * 2 + (dir * squatP * 3) : 0;
    let sadHeadOffsetY = c.isSad ? 7 + (squatP * 4) : 0; // Slumped down looking at the floor
    let angryHeadOffsetX = c.isGrey ? dir * 3 : 0;

    let hDirOffset = isProfile ? (dir * 6) : (dir * 2);

    let headX = c.x + hDirOffset + (dir * headBobX) + sadHeadOffsetX + angryHeadOffsetX;
    let headY = c.y - 14 + offsetP + headBobY + sadHeadOffsetY;

    ctx.save();
    ctx.translate(headX, headY);

    if (isFrontActive) {
        ctx.fillStyle = c.color || '#ffffff';
        ctx.fillRect(-5, -4, 10, 10);

        // Front Comb
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -8, 4, 4);

        // Two Eyes
        if (c.isGrey) {
            ctx.fillStyle = '#000';
            ctx.fillRect(-3, -2, 2, 1);
            ctx.fillRect(1, -2, 2, 1);
            ctx.fillStyle = '#e63946';
            ctx.fillRect(-3, -1, 2, 1);
            ctx.fillRect(1, -1, 2, 1);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(-3, -2, 2, 2);
            ctx.fillRect(1, -2, 2, 2);
        }

        // Front Beak
        ctx.fillStyle = '#ffa500';
        ctx.fillRect(-3, 0, 4, 4);
    } else if (isBackActive) {
        ctx.fillStyle = c.color || '#ffffff';
        ctx.fillRect(-5, -4, 10, 10);

        // Back Comb
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -8, 4, 4);
    } else {
        ctx.scale(dir, 1);

        ctx.fillStyle = c.color || '#ffffff';
        ctx.fillRect(-6, -4, 10, 10);

        // Comb Profile
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-2, -8, 4, 4);
        ctx.fillRect(-4, -6, 2, 2);

        // Beak Profile
        ctx.fillStyle = '#ffa500';
        if (c.isSad) {
            ctx.fillRect(2, 2, 4, 4); // Angled down towards the floor
        } else {
            ctx.fillRect(4, -1, 4, 4);
        }
        // Profile Eye
        if (c.isSad) {
            ctx.fillStyle = '#000';
            ctx.fillRect(1, -1, 3, 1);
            let phase = Math.floor((Date.now() / 150 + c.x) % 6);
            if (phase < 5) {
                ctx.fillStyle = '#81d4fa';
                ctx.fillRect(1, phase, 3, 3);
                ctx.fillStyle = '#4fc3f7';
                ctx.fillRect(2, phase + 1, 1, 2);
            }
        } else if (c.isGrey) {
            ctx.fillStyle = '#000';
            ctx.fillRect(2, -2, 3, 1);
            ctx.fillStyle = '#e63946';
            ctx.fillRect(3, -1, 2, 1);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(2, -2, 2, 2);
        }
    }

    ctx.restore();
    ctx.restore();
}

function renderChick(ctx, ch) {
    let baseTime = 90 - ((state.growthLevel || 0) * 6);
    let p = 1 - (ch.growTimer / baseTime);
    let scale = 1.0;
    if (p > 0.66) scale = 1.5;
    else if (p > 0.33) scale = 1.25;

    let dir = ch.direction || 1;
    let isVertical = (!ch.isSad && ch.action !== 'eating' && ch.action !== 'drinking') && (Math.abs(ch.velY) > Math.abs(ch.velX) * 1.2);
    let isFrontActive = isVertical && ch.velY > 0;
    let isBackActive = isVertical && ch.velY < 0;
    let isProfile = !isFrontActive && !isBackActive;

    let w = 12, h = 8;
    let isWalking = Math.abs(ch.velX) > 5 || Math.abs(ch.velY) > 5;
    let t = Date.now() / 150 + (ch._i = ch._i || Math.random() * 1000);

    let headBobX = isWalking ? Math.cos(t) * 1.5 : 0;
    let headBobY = isWalking ? Math.abs(Math.sin(t)) * 1.5 : (Math.sin(t / 3) > 0.9 ? 2 : 0);

    let isEating = (ch.action === 'eating' || ch.action === 'drinking' || ch.action === 'failedFood' || ch.action === 'failedWater');
    if (isEating) {
        let peckPhase = ((ch.eatTimer || ch.failTimer || 0) * 2.5) % 1.0;
        if (peckPhase < 0.3) { headBobX = 2; headBobY = 6; }
        else { headBobX = 0; headBobY = 2; }
    }

    let wingFlap = isWalking ? Math.sin(t) * 1.5 : 0;
    let legSwing = isWalking ? Math.sin(t) * 2.5 : 0;

    ctx.save();
    ctx.translate(ch.x, ch.y);
    ctx.scale(scale, scale);
    ctx.translate(-ch.x, -ch.y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(ch.x - 5, ch.y + 4, 10, 3);

    // Legs (matching adult logic strictly)
    ctx.fillStyle = ch.isGrey ? '#d35400' : '#ffa500';
    ctx.fillRect(ch.x - 2 + legSwing, ch.y + 4, 1, 2); // Back (Adult logic: no profile check)
    ctx.fillRect(ch.x + 1 - legSwing, ch.y + 4, 1, 2); // Front

    // Body
    ctx.fillStyle = ch.isGrey ? '#e63946' : '#ffeb3b';
    ctx.fillRect(ch.x - (w / 2), ch.y - 6, w, h);

    // Wing
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    if (isProfile) {
        ctx.fillRect(ch.x - 2, ch.y - 3 + wingFlap, 5, 3);
    } else {
        ctx.fillRect(ch.x - (w / 2) - 1, ch.y - 3 + wingFlap, 2, 4); // Left
        ctx.fillRect(ch.x + (w / 2) - 1, ch.y - 3 + wingFlap, 2, 4); // Right
    }

    // Head
    let hDirOffset = isProfile ? (dir * 4) : 0;
    let headX = ch.x + hDirOffset + (isProfile ? dir * headBobX : 0);
    let headY = ch.y - 6 + headBobY;

    ctx.save();
    ctx.translate(headX, headY);

    if (isFrontActive) {
        ctx.fillStyle = ch.isGrey ? '#e63946' : '#ffeb3b';
        ctx.fillRect(-3, -3, 6, 6);

        // Two Eyes (Front)
        ctx.fillStyle = '#000';
        ctx.fillRect(-2, -1, 1, 1);
        ctx.fillRect(1, -1, 1, 1);

        // Beak (Front)
        ctx.fillStyle = ch.isGrey ? '#d35400' : '#ffa500';
        ctx.fillRect(-1, 1, 2, 2);
    } else if (isBackActive) {
        ctx.fillStyle = ch.isGrey ? '#e63946' : '#ffeb3b';
        ctx.fillRect(-3, -3, 6, 6);
    } else {
        ctx.scale(dir, 1);

        ctx.fillStyle = ch.isGrey ? '#e63946' : '#ffeb3b';
        ctx.fillRect(-3, -3, 6, 6);

        // Beak (Profile)
        ctx.fillStyle = ch.isGrey ? '#d35400' : '#ffa500';
        ctx.fillRect(2, 0, 3, 2);

        // Eye (Profile)
        ctx.fillStyle = '#000';
        ctx.fillRect(1, -1, 1, 1);
    }

    ctx.restore();
    ctx.restore();
}

function renderRooster(ctx, r) {
    let isWalking = Math.abs(r.velX) > 5 || Math.abs(r.velY) > 5;
    let t = Date.now() / 150 + (r._i = r._i || Math.random() * 1000);

    let headBobX = isWalking ? Math.cos(t) * 2 : 0;
    let headBobY = isWalking ? Math.abs(Math.sin(t)) * 2 : (Math.sin(t / 3) > 0.9 ? 4 : 0);

    let isEating = (r.action === 'eating' || r.action === 'drinking' || r.action === 'failedFood' || r.action === 'failedWater');
    if (isEating) {
        let peckPhase = ((r.eatTimer || r.failTimer || r.mateTimer || 0) * 2.5) % 1.0;
        if (peckPhase < 0.3) { headBobX = 3; headBobY = 12; }
        else { headBobX = 1; headBobY = 4; }
    }

    let wingFlap = isWalking ? Math.sin(t) * 3 : 0;
    let legSwing = isWalking ? Math.sin(t) * 5 : 0;
    let tailBob = isWalking ? Math.cos(t) * 2 : 0;

    let dir = r.direction || 1;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(r.x - 10, r.y + 10, 20, 4);

    ctx.save();
    let squash = r.squishTimer > 0 ? 0.7 : 1.0;
    ctx.translate(r.x, r.y + (r.squishTimer > 0 ? 5 : 0));
    ctx.scale(dir, squash);

    // Legs
    ctx.fillStyle = '#ff8c00'; // Dark orange
    ctx.fillRect(-4 + legSwing, 6, 3, 6); // Back
    ctx.fillRect(4 - legSwing, 6, 3, 6); // Front
    let isVertical = (!r.isSad && r.action !== 'eating' && r.action !== 'drinking') && (Math.abs(r.velY) > Math.abs(r.velX) * 1.2);
    let isFrontActive = isVertical && r.velY > 0;
    let isBackActive = isVertical && r.velY < 0;
    let isProfile = !isFrontActive && !isBackActive;

    // Majestic Tail Feathers
    if (isProfile) {
        ctx.fillStyle = '#004d00';
        ctx.fillRect(-16, -20 + tailBob, 10, 18);
        ctx.fillStyle = '#191970';
        ctx.fillRect(-22, -18 + tailBob, 8, 14);
        ctx.fillStyle = '#ff4500';
        ctx.fillRect(-26, -14 + tailBob, 6, 12);
    } else if (isFrontActive) {
        ctx.fillStyle = '#004d00';
        ctx.fillRect(-6, -20 + tailBob, 12, 10);
    } else if (isBackActive) {
        ctx.fillStyle = '#004d00';
        ctx.fillRect(-14, -22 + tailBob, 28, 20);
        ctx.fillStyle = '#191970';
        ctx.fillRect(-18, -18 + tailBob, 6, 14);
        ctx.fillRect(12, -18 + tailBob, 6, 14);
        ctx.fillStyle = '#ff4500';
        ctx.fillRect(-22, -14 + tailBob, 6, 12);
        ctx.fillRect(16, -14 + tailBob, 6, 12);
    }

    // Body (Deep reddish-brown)
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(-13, -16, 26, 22);

    // Breast (Chocolate/Copper accent)
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(-5, -12, 10, 18);

    // Wing
    if (isProfile) {
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(-6, -8 + wingFlap, 14, 10);
        ctx.fillStyle = '#8b0000'; // Wing tip
        ctx.fillRect(-4, -4 + wingFlap, 10, 4);
    } else {
        // Front/Back Wings (Sides)
        ctx.fillStyle = '#a0522d';
        ctx.fillRect(-16, -8 + wingFlap, 5, 12);
        ctx.fillRect(11, -8 + wingFlap, 5, 12);
    }

    // Head Base coordinates (local to body)
    let hDx = isProfile ? 6 : 0;
    let hX = hDx + headBobX;
    let hY = -18 + headBobY;

    ctx.save();
    ctx.translate(hX, hY);

    if (isFrontActive) {
        // Neck Hackles (Golden yellow feathers)
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-6, -2, 14, 12);

        // Head Area
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-6, -8, 12, 12);

        // Front Comb
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-5, -14, 10, 6);
        ctx.fillRect(-3, -18, 6, 4);

        // Front Wattle
        ctx.fillRect(-5, 4, 4, 6);
        ctx.fillRect(1, 4, 4, 6);

        // Front Beak
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-2, 0, 4, 5);

        // Front Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-5, -5, 3, 3);
        ctx.fillRect(2, -5, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-4, -5, 1, 1);
        ctx.fillRect(3, -5, 1, 1);
    } else if (isBackActive) {
        // Neck Hackles
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-7, -2, 14, 12);

        // Head Area
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-6, -8, 12, 12);

        // Back Comb
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-5, -14, 10, 6);
        ctx.fillRect(-3, -18, 6, 4);
    } else {
        // Neck Hackles (Golden yellow feathers)
        ctx.fillStyle = '#daa520';
        ctx.fillRect(-8, -2, 14, 12);

        // Head Area
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(-6, -8, 12, 12);

        // Profile Comb
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-8, -14, 14, 6);
        ctx.fillRect(-4, -18, 8, 4);

        // Profile Wattle
        ctx.fillRect(-2, 4, 6, 8);

        // Profile Beak
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(6, -2, 6, 6);

        // Profile Eye
        if (r.action === 'sadFace' || r.action === 'walkToGraveyard') {
            ctx.fillStyle = '#000';
            ctx.fillRect(3, -4, 3, 1);
            ctx.fillStyle = '#00bbff';
            ctx.fillRect(4, -2, 2, 2);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(3, -5, 3, 3);
            ctx.fillStyle = '#fff';
            ctx.fillRect(4, -5, 1, 1);
        }
    }

    ctx.restore();
    ctx.restore();
}

function sellOneEgg() {
    // This function is no longer used with the new auto-sell/processing system
    // Eggs are now processed directly on the underground belt
}

function draw() {
    if (state.hasRetired) {
        drawCinematic();
        return;
    }

    // Backgrounds
    ctx.fillStyle = '#7cba3a';
    ctx.fillRect(0, 0, canvas.width, MEADOW_BOTTOM);

    drawFence(ctx, canvas.width, MEADOW_BOTTOM);

    // Decorate meadow lightly
    ctx.fillStyle = '#6b9c2a';
    for (let i = 1; i < 30; i++) {
        let gx = (i * 137) % canvas.width;
        let gy = (i * 93) % MEADOW_BOTTOM;
        if (gy < 65) gy += 65;
        ctx.fillRect(gx, gy, 4, 4);
        ctx.fillRect(gx + 4, gy - 4, 4, 8);
    }

    // Meadow grass
    ctx.fillStyle = '#6b9c2a';
    ctx.fillRect(80, MEADOW_BOTTOM, canvas.width - 80, 30); // Leave a gap on the LEFT

    // Basement Wood Shed Planks (spanning entire canvas)
    ctx.fillStyle = '#3a2318';
    ctx.fillRect(0, MEADOW_BOTTOM, canvas.width, canvas.height - MEADOW_BOTTOM);
    ctx.fillStyle = '#2b170e';
    for (let y = MEADOW_BOTTOM + 20; y < canvas.height; y += 40) {
        ctx.fillRect(0, y, canvas.width, 3);
    }
    ctx.fillStyle = '#221109';
    for (let x = 20; x <= canvas.width; x += 120) {
        ctx.fillRect(x, MEADOW_BOTTOM, 16, canvas.height - MEADOW_BOTTOM);
        ctx.fillStyle = '#111';
        for (let y = MEADOW_BOTTOM + 15; y < canvas.height; y += 40) {
            ctx.fillRect(x + 6, y, 4, 4);
        }
        ctx.fillStyle = '#221109';
    }

    // Re-draw Meadow grass right top to cover shed under the meadow
    ctx.fillStyle = '#6b9c2a';
    ctx.fillRect(80, MEADOW_BOTTOM, canvas.width - 80, 15);
    ctx.fillStyle = '#3e2610';
    ctx.fillRect(80, MEADOW_BOTTOM + 15, canvas.width - 80, 15); // dirt base

    // Basement Details
    // Horizontal Pipe spanning full width
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 470, canvas.width, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 472, canvas.width, 4);

    // Sebastian the Cat (Sleeping Easter Egg)
    let catX = 350;
    let catY = 470;

    let breath = Math.sin(Date.now() / 600) > 0.5 ? 1 : 0;

    if (window.catTail === undefined) window.catTail = 0;
    if (Math.random() < 0.01) window.catTailTarget = (Math.random() - 0.5) * 0.5;
    window.catTail += ((window.catTailTarget || 0) - window.catTail) * 0.1;

    // Cardboard House (Back)
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(catX - 11, catY - 10, 34, 10); // Base wall
    ctx.beginPath();
    ctx.moveTo(catX - 11, catY - 10);
    ctx.lineTo(catX + 6, catY - 20); // Peak
    ctx.lineTo(catX + 23, catY - 10);
    ctx.fill();

    // "SEB" written inside
    ctx.fillStyle = '#4a3623';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("SEB", catX + 6, catY - 11);

    // Body (Sleeping)
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(catX, catY - 9, 20, 9);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(catX + 1, catY - 8 - breath, 18, 8 + breath);
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(catX + 4, catY - 8 - breath, 2, 4);
    ctx.fillRect(catX + 8, catY - 8 - breath, 2, 4);
    ctx.fillRect(catX + 12, catY - 8 - breath, 2, 4);

    // Head
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(catX - 8, catY - 7, 10, 7);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(catX - 7, catY - 6, 8, 6);

    // Ears
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(catX - 7, catY - 10, 3, 4);
    ctx.fillRect(catX - 2, catY - 10, 3, 4);

    // Closed eye
    ctx.fillStyle = '#111';
    ctx.fillRect(catX - 5, catY - 3, 3, 1);

    // Tail
    ctx.save();
    ctx.translate(catX + 19, catY - 2);
    ctx.rotate(window.catTail);
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(0, -1, 10, 4);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 9, 2);
    ctx.fillRect(7, 0, 2, 8);
    ctx.restore();

    // Anime Sleep Bubble (expanding from nose)
    let sPhase = (Date.now() % 2400) / 2400;
    let bRadius = 1 + Math.sin(sPhase * Math.PI) * 2;
    ctx.fillStyle = 'rgba(200, 240, 255, ' + (0.8 - sPhase * 0.4) + ')';
    ctx.beginPath();
    ctx.arc(catX - 8, catY - 2 - breath, Math.max(0, bRadius), 0, Math.PI * 2);
    ctx.fill();

    // Cardboard House (Front Rim)
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(catX - 14, catY, 40, 4);

    // Front Pillars
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(catX - 14, catY - 14, 4, 14);
    ctx.fillRect(catX + 22, catY - 14, 4, 14);

    // Front Roof Frame
    ctx.fillStyle = '#9c6644';
    ctx.beginPath();
    ctx.moveTo(catX - 14, catY - 14);
    ctx.lineTo(catX + 6, catY - 24);
    ctx.lineTo(catX + 26, catY - 14);
    ctx.lineTo(catX + 22, catY - 14);
    ctx.lineTo(catX + 6, catY - 20);
    ctx.lineTo(catX - 10, catY - 14);
    ctx.fill();

    // Cardboard Box (The Joke: "It was just a cardboard box.")

    // Vertical pipe
    ctx.fillStyle = '#222';
    ctx.fillRect(300, 470, 16, canvas.height - 470);
    ctx.fillStyle = '#333';
    ctx.fillRect(304, 470, 4, canvas.height - 470);

    // Underground grating / window
    ctx.fillStyle = '#111';
    ctx.fillRect(150, 445, 60, 25);
    ctx.fillStyle = '#555';
    for (let i = 0; i < 4; i++) ctx.fillRect(150 + i * 15 + 5, 445, 4, 25);




    // Right Hole (Market) Poster

    // Egg Sell Poster on wall
    ctx.save();
    ctx.translate(canvas.width - 40, 510); // Lowered even further
    ctx.rotate(-0.08); // Slightly rotated left
    ctx.scale(0.75, 0.75); // 25% smaller
    // Paper
    ctx.fillStyle = '#fdf5e6';
    ctx.fillRect(-35, -25, 70, 60);
    // Pin/Tape
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.arc(0, -20, 3, 0, Math.PI * 2); ctx.fill();
    // Text
    ctx.fillStyle = '#2c3e50';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText("EGG", 0, -2);
    ctx.fillText("SELL", 0, 12);
    ctx.font = '20px sans-serif';
    ctx.fillText("⬇", 0, 30);
    ctx.restore();

    // Lower Concrete Foundation connecting all
    ctx.fillStyle = '#1e1a17';
    ctx.fillRect(0, UNDERGROUND_FLOOR_Y + 6, canvas.width, canvas.height - (UNDERGROUND_FLOOR_Y + 6));

    // Dark dirt line below belt
    ctx.fillStyle = '#120f0e';
    ctx.fillRect(80, UNDERGROUND_FLOOR_Y + 6, canvas.width - 160, 4);

    if (state.hasTvAd) {
        let tvX = canvas.width - 220;
        let tvY = 440;

        // Ceiling Mount
        ctx.fillStyle = '#222';
        ctx.fillRect(tvX + 55, tvY - 15, 10, 15);

        // TV Outer Frame
        ctx.fillStyle = '#111';
        ctx.fillRect(tvX, tvY, 120, 80);

        // TV Inner Frame
        ctx.fillStyle = '#333';
        ctx.fillRect(tvX + 4, tvY + 4, 112, 72);

        // Screen Glow Background (Green!)
        let glow = Math.sin(Date.now() / 150) * 0.1 + 0.9;
        ctx.fillStyle = `rgba(139, 195, 74, ${glow})`; // Light green
        ctx.fillRect(tvX + 8, tvY + 8, 104, 64);

        // Left Side: "x2" Starburst
        ctx.save();
        ctx.translate(tvX + 35, tvY + 40);
        let pulse = Math.sin(Date.now() / 100) * 0.1 + 1;
        ctx.scale(pulse, pulse);

        ctx.fillStyle = '#e53935'; // Red Burst
        ctx.beginPath();
        let spikes = 12;
        let outerR = 22;
        let innerR = 14;
        for (let i = 0; i < spikes * 2; i++) {
            let r = (i % 2 === 0) ? outerR : innerR;
            let a = (i * Math.PI) / spikes;
            if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffeb3b'; // Yellow border
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText("x2", 0, 0);
        ctx.fillText("x2", 0, 0);
        ctx.restore();

        // Right Side: Peeking Chicken Head
        ctx.save();
        ctx.translate(tvX + 85, tvY + 72); // Pin to bottom right

        let bobY = Math.abs(Math.sin(Date.now() / 300)) * 6;
        ctx.translate(0, -bobY);

        // Body block
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -24, 32, 24);

        // Head block
        ctx.fillRect(-12, -40, 24, 16);

        // Comb
        ctx.fillStyle = '#e53935';
        ctx.fillRect(-4, -50, 8, 10);
        ctx.fillRect(-10, -45, 6, 5);

        // Beak (Facing Left)
        ctx.fillStyle = '#ffa500';
        ctx.fillRect(-18, -34, 10, 8);

        // Eye (Facing Left)
        ctx.fillStyle = '#000000';
        ctx.fillRect(-6, -36, 4, 4);

        ctx.restore();
    }

    // Egg Ramp drawing
    if (state.hasRamp) {
        ctx.fillStyle = '#4a2e15';
        ctx.beginPath();
        ctx.moveTo(0, UNDERGROUND_FLOOR_Y - 30);
        ctx.lineTo(40, UNDERGROUND_FLOOR_Y);
        ctx.lineTo(0, UNDERGROUND_FLOOR_Y);
        ctx.fill();
        ctx.strokeStyle = '#2b170e';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;

        // Visual bounce pad on top
        ctx.fillStyle = '#e91e63';
        ctx.beginPath();
        ctx.moveTo(0, UNDERGROUND_FLOOR_Y - 32);
        ctx.lineTo(42, UNDERGROUND_FLOOR_Y - 2);
        ctx.lineTo(40, UNDERGROUND_FLOOR_Y);
        ctx.lineTo(0, UNDERGROUND_FLOOR_Y - 30);
        ctx.fill();
    }

    let drawEgg = (e) => {
        ctx.save();
        ctx.translate(e.x, e.y - 6);

        // Ground Shadow (Static, before rotation)
        if (e.type !== 'package') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 6, 6, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if ((state.eggsSold || 0) === 0 && (state.playTime || 0) > 10 && draggedEggs.length === 0 && eggsArr.length > 0 && e === eggsArr[0] && e.y >= EGG_GROUND_Y) {
            // Tutorial Multilinea
            drawSpeechBubble(ctx, ["Drag me", "to the market", "to sell me!"], 0, -30);

            // Tutorial Flechitas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            let path = [];
            if (e.y < UNDERGROUND_FLOOR_Y - 30) {
                path = [
                    { x: e.x, y: e.y },
                    { x: 40, y: e.y },
                    { x: 40, y: UNDERGROUND_FLOOR_Y - 15 },
                    { x: canvas.width - 50, y: UNDERGROUND_FLOOR_Y - 15 }
                ];
            } else {
                path = [
                    { x: e.x, y: e.y },
                    { x: canvas.width - 50, y: e.y }
                ];
            }

            let totalLen = 0;
            let segments = [];
            for (let i = 0; i < path.length - 1; i++) {
                let dx = path[i + 1].x - path[i].x;
                let dy = path[i + 1].y - path[i].y;
                let len = Math.hypot(dx, dy);
                if (len > 0) {
                    segments.push({ len, dx, dy, x: path[i].x, y: path[i].y });
                    totalLen += len;
                }
            }

            let timeOffset = (Date.now() / 15) % 40;
            for (let d = timeOffset; d < totalLen; d += 40) {
                let dist = d;
                let pt = null;
                for (let i = 0; i < segments.length; i++) {
                    let seg = segments[i];
                    if (dist <= seg.len) {
                        let t = dist / seg.len;
                        pt = {
                            x: seg.x + seg.dx * t,
                            y: seg.y + seg.dy * t,
                            angle: Math.atan2(seg.dy, seg.dx)
                        };
                        break;
                    }
                    dist -= seg.len;
                }

                if (pt) {
                    ctx.save();
                    ctx.translate(pt.x, pt.y);
                    ctx.rotate(pt.angle);
                    ctx.beginPath();
                    ctx.moveTo(-7, -7);
                    ctx.lineTo(4, 0);
                    ctx.lineTo(-7, 7);
                    ctx.stroke();
                    ctx.restore();
                }
            }
            ctx.restore();
        }

        ctx.rotate(e.angle || 0);

        if (e.type === 'package') {
            if (e.hasRibbon) {
                // Premium Black Box (25% bigger, width 20, height 15) resting exactly on floor +6
                ctx.fillStyle = '#111111';
                ctx.fillRect(-10, -9, 20, 15);
                
                // Crisp gold borders
                let gGradient = ctx.createLinearGradient(-10, -9, 10, 6);
                gGradient.addColorStop(0, '#f1c40f');
                gGradient.addColorStop(0.5, '#f39c12');
                gGradient.addColorStop(1, '#e67e22');
                
                ctx.strokeStyle = '#050505';
                ctx.lineWidth = 1;
                ctx.strokeRect(-9.5, -8.5, 19, 14); // Inner detail
                
                // Fine gold stripe across
                ctx.fillStyle = gGradient;
                ctx.fillRect(-10, -2, 20, 1);
                
                // Gold geometric center/logo 
                ctx.beginPath();
                ctx.moveTo(0, -4.5);
                ctx.lineTo(3.5, -1.5);
                ctx.lineTo(0, 1.5);
                ctx.lineTo(-3.5, -1.5);
                ctx.fill();
                
                // Subtle shine/gloss on the top
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(-10, -9, 20, 5);
            } else {
                ctx.fillStyle = '#d2b48c';
                ctx.fillRect(-8, -6, 16, 12);
                ctx.strokeStyle = '#8b4513';
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            }
        } else {
            // Base colors
            if (e.type === 'golden') {
                ctx.fillStyle = '#ffd700';
            } else if (e.type === 'premium') {
                ctx.fillStyle = '#ffffff';
            } else {
                if (e.washed && e.x >= 220 && e.x <= 290) {
                    let washRatio = (e.x - 220) / 70;
                    let rgb = Math.floor(211 + (255 - 211) * washRatio);
                    ctx.fillStyle = `rgb(${rgb}, ${rgb}, ${rgb})`;
                } else {
                    ctx.fillStyle = e.washed ? '#ffffff' : '#d3d3d3';
                }
            }

            // Pointy Egg Shape via Bezier Curves
            ctx.beginPath();
            ctx.moveTo(0, -7);
            ctx.bezierCurveTo(4, -7, 5, 0, 5, 3);
            ctx.bezierCurveTo(5, 7, -5, 7, -5, 3);
            ctx.bezierCurveTo(-5, 0, -4, -7, 0, -7);
            ctx.fill();

            // Premium dots
            if (e.type === 'premium') {
                ctx.fillStyle = '#222';
                ctx.fillRect(-2, -3, 2, 2);
                ctx.fillRect(1, 1, 2, 1);
                ctx.fillRect(-1, 3, 2, 2);
                ctx.fillRect(2, -2, 1, 2);
                ctx.fillRect(-3, 1, 2, 1);
            }

            // Washed shine effect fade in
            if (e.washed) {
                let shineAlpha = 0.9;
                if (e.x >= 220 && e.x <= 290) {
                    shineAlpha = 0.9 * ((e.x - 220) / 70);
                }
                ctx.fillStyle = `rgba(200, 240, 255, ${shineAlpha})`;
                ctx.beginPath();
                ctx.ellipse(-2, -2, 1.5, 3, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            if (e.stamped) {
                ctx.save();
                ctx.translate(0, 1.5);
                ctx.rotate(-Math.PI / 10);
                
                ctx.strokeStyle = '#c0392b'; // Quality Red outer
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = '#c0392b'; // "Q" symbol inside
                ctx.font = 'bold 3.5px sans-serif';
                ctx.fillText('Q', -1.3, 1.3);
                
                ctx.restore();
            }
        }
        ctx.restore();
    };

    let drawChicken = (c) => {
        renderChicken(ctx, c);
    };

    let drawChick = (ch) => { renderChick(ctx, ch); };
    let drawRooster = (r) => { renderRooster(ctx, r); };

    if (!window.pass1Queue) { window.pass1Queue = []; window.pass2Queue = []; }
    let pass1 = window.pass1Queue; pass1.length = 0;
    let pass2 = window.pass2Queue; pass2.length = 0;

    // Z-Index Pass 1: Background entities
    let mWLvl1 = state.maxWaterLevel || 0; let waterBaseY = 180 + (40 + mWLvl1 * 16) / 2 + 18;
    let mFLvl1 = state.maxFoodLevel || 0; let foodBaseY = 180 + (40 + mFLvl1 * 16) / 2 + 18;

    for (let i = 0; i < tombstonesArr.length; i++) { let t = tombstonesArr[i]; t.rType = 4; let b = t.x < 400 ? waterBaseY : foodBaseY; if (t.y < b) pass1.push(t); else pass2.push(t); }
    for (let i = 0; i < chickensArr.length; i++) { let c = chickensArr[i]; c.rType = 1; let b = c.x < 400 ? waterBaseY : foodBaseY; if (c.y < b) pass1.push(c); else pass2.push(c); }
    for (let i = 0; i < chicksArr.length; i++) { let ch = chicksArr[i]; ch.rType = 2; let b = ch.x < 400 ? waterBaseY : foodBaseY; if (ch.y < b) pass1.push(ch); else pass2.push(ch); }
    for (let i = 0; i < roostersArr.length; i++) { let r = roostersArr[i]; r.rType = 3; let b = r.x < 400 ? waterBaseY : foodBaseY; if (r.y < b) pass1.push(r); else pass2.push(r); }
    for (let i = 0; i < eggsArr.length; i++) { let e = eggsArr[i]; if (!e.collected && !e.isBeingDragged) { e.rType = 0; let b = e.x < 400 ? waterBaseY : foodBaseY; if (e.y < b) pass1.push(e); else pass2.push(e); } }

    pass1.sort((a, b) => a.y - b.y);
    for (let i = 0; i < pass1.length; i++) {
        let o = pass1[i];
        if (o.rType === 1) drawChicken(o);
        else if (o.rType === 0) drawEgg(o);
        else if (o.rType === 2) drawChick(o);
        else if (o.rType === 3) drawRooster(o);
        else if (o.rType === 4) renderTombstone(o);
    }

    // Draw Water Trough (LEFT)
    let mWLvl = state.maxWaterLevel || 0;
    let wh = 40 + mWLvl * 16;
    let wy = 180 - wh / 2;
    let wx = 15, ww = 40;

    // Trough Interior Back Wall
    ctx.fillStyle = '#555'; ctx.fillRect(wx, wy, ww, wh);

    let drawWaterPipe = (cy, rpp, isMax) => {
        let pipeCenterX = wx + ww / 2;
        let cyOff = cy;
        let numDrops = Math.max(1, Math.floor(rpp * 5)) + (isMax ? 15 : 0);
        let levelScale = state.autoWaterLevel || 1;
        let streamWidth = Math.max(1, Math.min(8, levelScale));
        if (isMax) streamWidth = 10;
        let time = Date.now() / 1000;

        // Horizontal pipe base (Red Spigot)
        ctx.fillStyle = '#c0392b'; ctx.fillRect(0, cyOff - 8, pipeCenterX + 2, 16);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(0, cyOff - 8, pipeCenterX + 2, 4); // Highlight
        ctx.fillStyle = '#922b21'; ctx.fillRect(0, cyOff + 4, pipeCenterX + 2, 4); // Shadow

        // Vertical nozzle pointing down
        ctx.fillStyle = '#c0392b'; ctx.fillRect(pipeCenterX - 10, cyOff - 8, 20, 24);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(pipeCenterX - 10, cyOff - 8, 4, 24);
        ctx.fillStyle = '#922b21'; ctx.fillRect(pipeCenterX + 6, cyOff - 8, 4, 24);

        // Silver cap
        ctx.fillStyle = '#bdc3c7'; ctx.fillRect(pipeCenterX - 12, cyOff + 12, 24, 6);
        ctx.fillStyle = '#95a5a6'; ctx.fillRect(pipeCenterX - 12, cyOff + 16, 24, 2);

        let streamStartOffset = cyOff + 18;
        let currentWaterFloor = wy + wh - (state.water / state.maxWater) * wh;
        if (currentWaterFloor > wy + wh) currentWaterFloor = wy + wh;

        let dropDist = currentWaterFloor - streamStartOffset;

        // Draw the main stream
        ctx.fillStyle = 'rgba(52, 152, 219, 0.8)';
        ctx.beginPath();
        ctx.moveTo(pipeCenterX - streamWidth, streamStartOffset);
        ctx.lineTo(pipeCenterX + streamWidth, streamStartOffset);
        ctx.lineTo(pipeCenterX + streamWidth + Math.sin(time * 5), streamStartOffset + dropDist);
        ctx.lineTo(pipeCenterX - streamWidth + Math.cos(time * 5), streamStartOffset + dropDist);
        ctx.fill();

        // Concentric splashes at water surface
        ctx.lineWidth = 1.5;
        let splashPhase = (time * 2) % 1;
        ctx.strokeStyle = `rgba(133, 193, 233, ${1.0 - splashPhase})`;
        ctx.beginPath(); ctx.ellipse(pipeCenterX, currentWaterFloor, 4 + splashPhase * 12, 1 + splashPhase * 4, 0, 0, Math.PI * 2); ctx.stroke();

        splashPhase = (time * 2 + 0.5) % 1;
        ctx.strokeStyle = `rgba(133, 193, 233, ${1.0 - splashPhase})`;
        ctx.beginPath(); ctx.ellipse(pipeCenterX, currentWaterFloor, 4 + splashPhase * 12, 1 + splashPhase * 4, 0, 0, Math.PI * 2); ctx.stroke();

        // Draw individual drops
        ctx.fillStyle = 'rgba(133, 193, 233, 0.9)';
        for (let i = 0; i < numDrops; i++) {
            let phase = (time * 3 + i * (Math.PI * 2 / numDrops)) % (Math.PI * 2);
            let dropY = streamStartOffset + (Math.sin(phase) * 0.5 + 0.5) * dropDist;
            let dropX = pipeCenterX + Math.sin(phase * 1.5 + i) * 6;
            let dropSize = 2 + Math.sin(phase * 2) * 1;
            ctx.beginPath(); ctx.arc(dropX, dropY, dropSize, 0, Math.PI * 2); ctx.fill();
        }
    };

    // Galvanized metal tub exterior
    ctx.fillStyle = '#999'; ctx.fillRect(wx, wy, ww, wh);

    // Water fill
    let wRatio = state.water / state.maxWater;
    ctx.fillStyle = '#3498db';
    let fillH = Math.max(0, (wh - 4) * wRatio);
    let waterY = wy + wh - 2 - fillH;
    ctx.fillRect(wx + 2, waterY, ww - 4, fillH);

    // Water reflections
    if (fillH > 2) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(wx + 10, waterY + Math.min(2, fillH - 1), 20, 1);
        if (fillH > 40) ctx.fillRect(wx + 10, waterY + 40, 15, 1);
        if (fillH > 80) ctx.fillRect(wx + 10, waterY + 80, 10, 1);
        if (fillH > 120) ctx.fillRect(wx + 10, waterY + 120, 20, 1);
        if (fillH > 160) ctx.fillRect(wx + 10, waterY + 160, 15, 1);
    }

    // Metal Borders and rivots
    ctx.strokeStyle = '#666'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
    ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(wx, wy, ww, wh);

    ctx.fillStyle = '#666';
    for (let ry = wy + 10; ry < wy + wh; ry += 25) {
        ctx.fillRect(wx + ww - 4, ry, 3, 3);
        ctx.fillRect(wx + 2, ry, 3, 3);
    }

    // 3D Front wall (height of the trough)
    let depth = 18;
    ctx.fillStyle = '#777'; ctx.fillRect(wx, wy + wh, ww, depth);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(wx, wy + wh, ww, depth);
    ctx.fillStyle = '#555';
    ctx.fillRect(wx + 4, wy + wh + depth / 2 - 1, 3, 3);
    ctx.fillRect(wx + ww - 7, wy + wh + depth / 2 - 1, 3, 3);

    // Cast Shadow extending down onto the grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(wx - 2, wy + wh + depth, ww + 4, 10);

    // Carved capacity text
    ctx.textAlign = 'center';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Drop shadow
    ctx.fillText(`${Math.floor(state.water)}`, wx + ww / 2 + 1, wy + wh + 13);
    ctx.fillStyle = '#e0f7fa'; // Ice blue text
    ctx.fillText(`${Math.floor(state.water)}`, wx + ww / 2, wy + wh + 12);
    ctx.textAlign = 'left';

    // Hover Tooltip
    let isHoverW = (lastMousePos.x >= 0 && lastMousePos.x <= 80 && lastMousePos.y >= wy && lastMousePos.y <= wy + wh + depth);
    if (isHoverW) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(wx + ww + 15, lastMousePos.y - 15, 120, 28);
        ctx.strokeStyle = '#3498db'; ctx.lineWidth = 1;
        ctx.strokeRect(wx + ww + 15, lastMousePos.y - 15, 120, 28);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(`WATER: ${fmt(Math.floor(state.water))}/${fmt(state.maxWater)}`, wx + ww + 20, lastMousePos.y - 5);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`Fill +${fmt(REFILL_TIERS[state.refillLevel])} ($${fmt(REFILL_COST_TIERS[state.refillLevel])})`, wx + ww + 20, lastMousePos.y + 7);
    }

    let physWx = -100, physWw = 145;

    if (state.water <= 0) {
        drawSpeechBubble(ctx, [
            "Water empty,",
            `click to refill ($${REFILL_COST_TIERS[state.refillLevel]})`
        ], wx + ww / 2, wy - 5, (wy - 5 < 50));
    }
    ctx.textAlign = 'left';

    if (state.autoWaterLevel > 0) {
        let rate = AUTO_TICK_TIERS[state.autoWaterLevel];
        let isMax = (state.autoWaterLevel === AUTO_TICK_TIERS.length - 1);
        drawWaterPipe(50, rate, isMax);
    }

    // Boombox (Radio Cassette)
    if (state.musicLevel > 0) {
        let rx = canvas.width / 2 - 18, ry = 340, rw = 36, rh = 20;
        ctx.fillStyle = window.isMusicMuted ? '#555' : '#3498db';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(rx + 6, ry); ctx.lineTo(rx + 6, ry - 6); ctx.lineTo(rx + rw - 6, ry - 6); ctx.lineTo(rx + rw - 6, ry); ctx.stroke();
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(rx + 10, ry + 10, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(rx + rw - 10, ry + 10, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(rx + 16, ry + 4, 4, 3);
        if (!window.isMusicMuted && (Date.now() % 1000 < 500)) {
            ctx.fillStyle = '#f1c40f'; ctx.font = '10px sans-serif';
            ctx.fillText("♫", rx + 5, ry - 10);
            ctx.fillText("♪", rx + 25, ry - 15);
        }
    }

    // Draw Food Trough (RIGHT)
    let mFLvl = state.maxFoodLevel || 0;
    let fh = 40 + mFLvl * 16;
    let fy = 180 - fh / 2;
    let fx = 745, fw = 40;

    // Back interior wall
    ctx.fillStyle = '#3e2723'; ctx.fillRect(fx, fy, fw, fh);

    let drawFoodPipe = (cy, rpp, isMax) => {
        let pipeCenterX = fx + fw / 2;
        let cyOff = cy;
        let numParticles = Math.max(1, Math.floor(rpp * 12)) + (isMax ? 25 : 0);
        let time = Date.now() / 1000;

        let drawW = (canvas.width || 1000) - pipeCenterX + 50; // Extend strongly outwards to prevent ANY edge gaps
        ctx.fillStyle = '#e67e22'; ctx.fillRect(pipeCenterX - 2, cyOff - 8, drawW, 16);
        ctx.fillStyle = '#f39c12'; ctx.fillRect(pipeCenterX - 2, cyOff - 8, drawW, 4); // Highlight
        ctx.fillStyle = '#d35400'; ctx.fillRect(pipeCenterX - 2, cyOff + 4, drawW, 4); // Shadow

        // Vertical nozzle pointing down
        ctx.fillStyle = '#e67e22'; ctx.fillRect(pipeCenterX - 10, cyOff - 8, 20, 24);
        ctx.fillStyle = '#f39c12'; ctx.fillRect(pipeCenterX - 10, cyOff - 8, 4, 24);
        ctx.fillStyle = '#d35400'; ctx.fillRect(pipeCenterX + 6, cyOff - 8, 4, 24);

        // Silver cap
        ctx.fillStyle = '#bdc3c7'; ctx.fillRect(pipeCenterX - 12, cyOff + 12, 24, 6);
        ctx.fillStyle = '#95a5a6'; ctx.fillRect(pipeCenterX - 12, cyOff + 16, 24, 2);

        let streamStartOffset = cyOff + 18;

        let fRatio = state.food / state.maxFood;
        let fillF = Math.max(0, (fh - 4) * fRatio);
        let currentFoodFloor = fy + fh - 2 - fillF;
        if (currentFoodFloor > fy + fh) currentFoodFloor = fy + fh;

        let dropDist = currentFoodFloor - streamStartOffset;

        // Draw individual food particles
        for (let i = 0; i < numParticles; i++) {
            let phase = (time * 1.5 + (i / numParticles)) % 1.0;
            let particleY = streamStartOffset + phase * dropDist;
            let particleX = pipeCenterX + (Math.sin(i * 74.234) * 6); // Static X pseudo-randomized by index
            let particleSize = 2 + Math.sin(phase * Math.PI * 2) * 0.5;

            ctx.fillStyle = (i % 2 === 0) ? '#e67e22' : '#f1c40f'; // Alternating colors
            ctx.fillRect(particleX, particleY, particleSize, particleSize);
        }
    };

    // Trough V-Shape Wood Exterior
    ctx.fillStyle = '#5c4033'; ctx.fillRect(fx, fy, fw, fh);

    // Food fill
    let fRatio = state.food / state.maxFood;
    let fillF = Math.max(0, (fh - 4) * fRatio);
    let foodY = fy + fh - 2 - fillF;

    ctx.fillStyle = '#e67e22';
    ctx.fillRect(fx + 2, foodY, fw - 4, fillF);

    // Seed/Grain texture (pseudo-random spatial hash)
    if (fillF > 2) {
        for (let x = 2; x < fw - 4; x += 3) {
            // Traverse from bottom to top so Y is absolute relative to trough base
            for (let y = 2; y < fillF - 2; y += 3) {
                let absY = fy + fh - y;
                // Spatial hash for stable deterministic noise
                let h = Math.abs(Math.sin((fx + x) * 12.9898 + absY * 78.233) * 43758.5453);
                h = h - Math.floor(h);

                if (h < 0.25) {
                    ctx.fillStyle = '#f1c40f'; // Yellow corn
                    ctx.fillRect(fx + x, absY - 2, 2, 2);
                } else if (h > 0.75) {
                    ctx.fillStyle = '#f39c12'; // Lighter orange main
                    ctx.fillRect(fx + x, absY - 2, 2, 2);
                } else if (h > 0.6 && h < 0.7) {
                    ctx.fillStyle = '#d35400'; // Dark seeds
                    ctx.fillRect(fx + x, absY - 2, 2, 2);
                }
            }
        }
    }

    // Trough Borders
    ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 4; ctx.strokeRect(fx, fy, fw, fh);
    ctx.strokeStyle = '#5c4033'; ctx.lineWidth = 1; ctx.strokeRect(fx, fy, fw, fh);
    ctx.lineWidth = 1;

    // 3D Front wall (height of the trough)
    let fDepth = 18;
    ctx.fillStyle = '#4a2f1d'; ctx.fillRect(fx, fy + fh, fw, fDepth);
    ctx.strokeStyle = '#2d1c11'; ctx.lineWidth = 2; ctx.strokeRect(fx, fy + fh, fw, fDepth);

    // Cast Shadow extending down onto the grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(fx - 2, fy + fh + fDepth, fw + 4, 10);

    // Enhanced capacity text
    ctx.textAlign = 'center';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Drop shadow
    ctx.fillText(`${Math.floor(state.food)}`, fx + fw / 2 + 1, fy + fh + 13);
    ctx.fillStyle = '#fffacd'; // Lemonchiffon
    ctx.fillText(`${Math.floor(state.food)}`, fx + fw / 2, fy + fh + 12);
    ctx.textAlign = 'left';

    // Hover Tooltip
    let isHoverF = (lastMousePos.x >= 720 && lastMousePos.x <= 800 && lastMousePos.y >= fy && lastMousePos.y <= fy + fh + fDepth);
    if (isHoverF) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(fx - 135, lastMousePos.y - 15, 120, 28);
        ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 1;
        ctx.strokeRect(fx - 135, lastMousePos.y - 15, 120, 28);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(`FOOD: ${fmt(Math.floor(state.food))}/${fmt(state.maxFood)}`, fx - 130, lastMousePos.y - 5);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(`Fill +${fmt(REFILL_TIERS[state.refillLevel])} ($${fmt(REFILL_COST_TIERS[state.refillLevel])})`, fx - 130, lastMousePos.y + 7);
    }

    let physFx = 755, physFw = 200;

    if (state.food <= 0) {
        drawSpeechBubble(ctx, [
            "Food empty,",
            `click to refill ($${REFILL_COST_TIERS[state.refillLevel]})`
        ], fx + fw / 2, fy - 5, (fy - 5 < 50));
    }
    ctx.textAlign = 'left';

    if (state.autoFoodLevel > 0) {
        let rate = AUTO_TICK_TIERS[state.autoFoodLevel];
        let isMax = (state.autoFoodLevel === AUTO_TICK_TIERS.length - 1);
        drawFoodPipe(50, rate, isMax);
    }

    let holeX = canvas.width - 80;

    // Conveyor Belt (Auto collect) moves Left
    if (state.autoCollectLevel > 0) {
        let currentW = canvas.width - 80;
        let startX = 80;

        ctx.fillStyle = '#333';
        ctx.fillRect(startX, EGG_GROUND_Y, currentW, 6);
        ctx.strokeStyle = '#666';
        ctx.save();
        ctx.beginPath();
        ctx.rect(startX, EGG_GROUND_Y, currentW, 6);
        ctx.clip();
        ctx.beginPath();
        let speedFactor = 0.01 + 0.99 * (state.autoCollectLevel / 5);
        let offset = (Date.now() / (20 / speedFactor)) % 20;
        for (let i = startX - 20; i < startX + currentW + 20; i += 20) {
            let lx = i - offset;
            ctx.moveTo(lx, EGG_GROUND_Y);
            ctx.lineTo(lx, EGG_GROUND_Y + 6);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw Sell Belt (Auto sell)
    if (state.autoSellLevel > 0) {
        let beltEndX = canvas.width - 80;
        let beltStartX = 10;
        let beltCurrentW = beltEndX - beltStartX;

        // Wooden hopper guide on the left wall
        ctx.fillStyle = '#2b170e';
        ctx.beginPath();
        ctx.moveTo(0, UNDERGROUND_FLOOR_Y - 50);
        ctx.lineTo(50, UNDERGROUND_FLOOR_Y);
        ctx.lineTo(0, UNDERGROUND_FLOOR_Y);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.fillRect(beltStartX, UNDERGROUND_FLOOR_Y, beltCurrentW, 6);
        ctx.strokeStyle = '#666';
        ctx.save();
        ctx.beginPath();
        ctx.rect(beltStartX, UNDERGROUND_FLOOR_Y, beltCurrentW, 6);
        ctx.clip();
        ctx.beginPath();
        let speedFactor = 0.01 + 0.99 * (state.autoSellLevel / 3);
        let offset = -(Date.now() / (20 / speedFactor)) % 20;
        for (let i = beltStartX - 20; i < beltEndX + 20; i += 20) {
            let lx = i - offset;
            ctx.moveTo(lx, UNDERGROUND_FLOOR_Y);
            ctx.lineTo(lx, UNDERGROUND_FLOOR_Y + 6);
        }
        ctx.stroke();
        ctx.restore();
    }

    if (state.hasWasher) {
        // Single central vertical pipe from the horizontal pipe down
        ctx.fillStyle = '#444';
        ctx.fillRect(260, 482, 10, 34); // connect from pipe to lower basin

        // More compact lower shower head basin
        ctx.fillStyle = '#2b5b84'; // Dark blueish metallic
        ctx.fillRect(235, 516, 60, 14);
        ctx.fillStyle = '#3498db'; // Bright blue lip
        ctx.fillRect(240, 530, 50, 4);

        let t = Date.now() / 100;

        // Water drops reaching all the way to the floor
        ctx.fillStyle = '#00bbff';
        for (let i = 0; i < 10; i++) {
            let dropY = ((t * 15 + i * 12) % 65); // fall distance ~65
            ctx.fillRect(242 + i * 5, 534 + dropY, 2, 3 + Math.random() * 2);
            ctx.fillRect(242 + i * 5, 534 + ((t * 15 + i * 12 + 5) % 65), 1, 2);
        }

        // Splashes on floor
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(235 + Math.random() * 60, UNDERGROUND_FLOOR_Y - 4 - Math.random() * 6, 2, 2);
        }
    }

    if (state.hasStamper) {
        let stamperH = 75;
        let basY = UNDERGROUND_FLOOR_Y + 5;
        
        // Left Leg Background (Dark iron)
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(380, basY - stamperH, 6, stamperH);
        ctx.fillStyle = '#1a252f';
        ctx.fillRect(384, basY - stamperH, 2, stamperH);

        // Top housing (Industrial casing)
        ctx.fillStyle = '#34495e'; 
        ctx.fillRect(375, basY - stamperH, 50, 22); 
        ctx.fillStyle = '#2c3e50'; 
        ctx.fillRect(375, basY - stamperH, 50, 5); 

        // Pressure Gauge
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath(); ctx.arc(400, basY - stamperH + 12, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1;
        ctx.beginPath(); 
        ctx.moveTo(400, basY - stamperH + 12); 
        ctx.lineTo(400 + Math.cos(Date.now()/150)*3, basY - stamperH + 12 - Math.abs(Math.sin(Date.now()/150)*3)); 
        ctx.stroke();

        let timeSinceStamp = window.lastStampActTime ? Date.now() - window.lastStampActTime : 9999;
        let pressOffset = 0;
        let maxOffset = 18; // Distancia máxima de bajada para que toque exactamente el huevo
        if (timeSinceStamp < 150) {
            if (timeSinceStamp < 50) pressOffset = (timeSinceStamp / 50) * maxOffset; // Fast slam down
            else pressOffset = (1 - (timeSinceStamp - 50) / 100) * maxOffset; // Rise up
        }

        // Piston rod (Silver)
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(397, basY - stamperH + 22, 6, 12 + pressOffset);

        // Stamp Head (Brass/Gold + Red pad)
        ctx.fillStyle = '#f1c40f'; // Brass header
        ctx.fillRect(392, basY - stamperH + 34 + pressOffset, 16, 8);
        ctx.fillStyle = '#d35400'; // Brass shadow
        ctx.fillRect(392, basY - stamperH + 40 + pressOffset, 16, 2);
        
        ctx.fillStyle = '#c0392b'; // Red rubber pad
        ctx.fillRect(394, basY - stamperH + 42 + pressOffset, 12, 4);
    }

    if (state.hasPackager) {
        let bx = 500;
        let by = UNDERGROUND_FLOOR_Y - 25;

        // --- Machine Housing ---
        ctx.fillStyle = '#333';
        ctx.fillRect(490, UNDERGROUND_FLOOR_Y - 60, 80, 15); // Top housing
        ctx.fillStyle = '#222';
        ctx.fillRect(495, UNDERGROUND_FLOOR_Y - 60, 5, 60);  // Left leg
        ctx.fillRect(560, UNDERGROUND_FLOOR_Y - 60, 5, 60);  // Right leg
        // Glass front
        ctx.fillStyle = 'rgba(150, 200, 255, 0.1)';
        ctx.fillRect(500, UNDERGROUND_FLOOR_Y - 45, 60, 45);

        // Carton back
        ctx.fillStyle = '#c7a87c';
        ctx.beginPath();
        ctx.moveTo(bx, by + 15);
        ctx.lineTo(bx, by + 5);
        for (let i = 0; i < 6; i++) {
            ctx.lineTo(bx + i * 10 + 2, by + 7);
            ctx.lineTo(bx + i * 10 + 5, by + 12);
            ctx.lineTo(bx + i * 10 + 8, by + 7);
        }
        ctx.lineTo(bx + 60, by + 5);
        ctx.lineTo(bx + 60, by + 15);
        ctx.fill();

        // Draw the eggs in the carton
        let count = state.packageBuffer.length;
        for (let i = 0; i < count; i++) {
            let eggData = state.packageBuffer[i];
            let ex = bx + i * 10 + 5;
            let ey = by + 6;

            ctx.save();
            ctx.translate(ex, ey);

            let eType = typeof eggData === 'object' ? eggData.type : 'normal';
            let eWashed = typeof eggData === 'object' ? eggData.washed : false;
            let eStamped = typeof eggData === 'object' ? eggData.stamped : false;

            if (eType === 'golden') {
                ctx.fillStyle = '#ffd700';
            } else if (eType === 'premium') {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = eWashed ? '#ffffff' : '#d3d3d3';
            }

            ctx.beginPath();
            ctx.ellipse(0, 0, 4, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            if (eType === 'premium') {
                ctx.fillStyle = '#222';
                ctx.fillRect(-1, -2, 1, 1);
                ctx.fillRect(1, 0, 1, 1);
                ctx.fillRect(0, 2, 1, 1);
            }

            if (eWashed) {
                ctx.fillStyle = 'rgba(200, 240, 255, 0.9)';
                ctx.beginPath();
                ctx.ellipse(-1, -1, 1, 2, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
            }

            if (eStamped) {
                ctx.save();
                ctx.translate(0, 1.5);
                ctx.rotate(-Math.PI / 10);
                
                ctx.strokeStyle = '#c0392b'; // Quality Red outer
                ctx.lineWidth = 0.6;
                ctx.beginPath();
                ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.fillStyle = '#c0392b'; // "Q" symbol inside
                ctx.font = 'bold 3.5px sans-serif';
                ctx.fillText('Q', -1.3, 1.3);
                
                ctx.restore();
            }
            ctx.restore();

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath();
            ctx.ellipse(ex - 1, ey + 1, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Carton front lip
        ctx.fillStyle = '#d2b48c';
        ctx.fillRect(bx, by + 10, 60, 15);
        ctx.strokeStyle = '#b89970';
        ctx.strokeRect(bx, by + 10, 60, 15);
    }

    if (state.hasRibbon) {
        let basY = UNDERGROUND_FLOOR_Y;
        
        // Dark interior of the tunnel
        ctx.fillStyle = '#050505'; 
        ctx.fillRect(626, basY - 65, 40, 65); 
    }

    // Market Sign Wooden Redesign
    let signX = canvas.width - 65;
    let signY = UNDERGROUND_FLOOR_Y + 7;
    // Legs
    ctx.fillStyle = '#221109';
    ctx.fillRect(signX + 6, signY + 16, 4, 15);
    ctx.fillRect(signX + 46, signY + 16, 4, 15);
    // Board (Gold rim + Dark wood)
    ctx.fillStyle = '#b8860b'; // Dark gold
    ctx.fillRect(signX, signY, 56, 18);
    ctx.fillStyle = '#3a1e05'; // Wood
    ctx.fillRect(signX + 2, signY + 2, 52, 14);
    // Text
    ctx.fillStyle = '#f1c40f'; // Bright gold letters
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText("MARKET", signX + 5, signY + 12);



    // Tombstones
    function renderTombstone(t) {
        let ox = 0;
        let oy = 0;
        if (t.shakeTimer > 0) {
            ox = (Math.random() - 0.5) * 6;
        }

        // Popup from ground animation
        if (t.spawnTime) {
            let age = Date.now() - t.spawnTime;
            if (age < 500) {
                let p = age / 500;
                let easeOut = 1 - Math.pow(1 - p, 3);
                oy = 20 * (1 - easeOut); // starts at 20, ends at 0
            }
        }

        ctx.save();
        ctx.translate(t.x + ox, t.y + oy);

        // Dirt mound base
        ctx.fillStyle = '#4a2e15';
        ctx.beginPath();
        ctx.ellipse(0, 8, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tombstone shadow/back layer
        ctx.fillStyle = '#444';
        ctx.fillRect(-10, -10, 20, 18);
        ctx.beginPath();
        ctx.arc(0, -10, 10, Math.PI, 0);
        ctx.fill();

        // Tombstone face (lighter gray)
        ctx.fillStyle = '#808080';
        ctx.fillRect(-8, -9, 16, 17);
        ctx.beginPath();
        ctx.arc(0, -9, 8, Math.PI, 0);
        ctx.fill();

        // Crack / weather detail
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-5, -12);
        ctx.lineTo(-2, -9);
        ctx.lineTo(-4, -6);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(6, 4);
        ctx.lineTo(3, 8);
        ctx.stroke();

        // RIP Text Etched
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';

        ctx.fillStyle = '#333';
        ctx.fillText("RIP", 0, -1);

        ctx.fillStyle = '#a0a0a0'; // highlight
        ctx.fillText("RIP", 0, -2);

        ctx.restore();
    };

    // Z-Index Pass 2: Foreground entities
    pass2.sort((a, b) => a.y - b.y);
    for (let i = 0; i < pass2.length; i++) {
        let o = pass2[i];
        if (o.rType === 1) drawChicken(o);
        else if (o.rType === 0) drawEgg(o);
        else if (o.rType === 2) drawChick(o);
        else if (o.rType === 3) drawRooster(o);
        else if (o.rType === 4) renderTombstone(o);
    }



    // Foreground Machine Parts (drawn OVER eggs to create 3D depth)
    if (state.hasStamper) {
        let stamperH = 75;
        let basY = UNDERGROUND_FLOOR_Y + 5;
        
        // Front Right Leg (overlap eggs)
        ctx.fillStyle = '#34495e';
        ctx.fillRect(414, basY - stamperH, 6, stamperH);
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(414, basY - stamperH, 2, stamperH);
        
        // Front crossbar / Warning Guard
        ctx.fillStyle = '#e67e22'; // Orange guard area
        ctx.fillRect(380, basY - stamperH + 35, 40, 4);
        ctx.fillStyle = '#222';
        for (let idx = 380; idx < 420; idx += 10) {
            ctx.beginPath();
            ctx.moveTo(idx, basY - stamperH + 35);
            ctx.lineTo(idx + 4, basY - stamperH + 39);
            ctx.lineTo(idx + 9, basY - stamperH + 39);
            ctx.lineTo(idx + 4, basY - stamperH + 35);
            ctx.fill();
        }
    }

    if (state.hasRibbon) {
        let basY = UNDERGROUND_FLOOR_Y;
        
        // Large Frontal Casing! Encloses the transition at X=630
        
        // Left Entrance Arch (so we can see boxes going in)
        ctx.fillStyle = '#111';
        ctx.fillRect(620, basY - 70, 10, 70);
        
        // Main solid block covering from 630 onwards!
        ctx.fillStyle = '#161616';
        ctx.fillRect(630, basY - 75, 45, 75);
        
        // Left side depth illusion for main block
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.moveTo(630, basY - 75);
        ctx.lineTo(620, basY - 70);
        ctx.lineTo(620, basY - 45); // Left entrance cut
        ctx.lineTo(630, basY - 50);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(630, basY);
        ctx.lineTo(620, basY);
        ctx.lineTo(620, basY - 20); // Let bottom be slightly open? No, keep it solid to block light perfectly.
        ctx.lineTo(630, basY - 20);
        // Let's just do a clean full side for darkness
        ctx.moveTo(630, basY - 75);
        ctx.lineTo(620, basY - 70);
        ctx.lineTo(620, basY);
        ctx.lineTo(630, basY);
        ctx.fill();

        // Trims & Decor
        ctx.fillStyle = '#e67e22'; // Orange line across
        ctx.fillRect(630, basY - 55, 45, 2);
        
        ctx.fillStyle = '#f1c40f'; // Gold side band
        ctx.fillRect(671, basY - 75, 4, 75);
        
        // "PRO PACK" Logo illuminated on the large front slab
        ctx.fillStyle = '#f1c40f'; // Gold text
        ctx.font = 'bold 8px "Press Start 2P"';
        ctx.fillText("PRO", 640, basY - 30);
        
        ctx.fillStyle = '#bdc3c7'; // Silver subtext
        ctx.font = '5px "Press Start 2P"';
        ctx.fillText("PACK", 642, basY - 20);
    }

    // Draw dragged eggs ON TOP
    draggedEggs.forEach(e => drawEgg(e));

    // Particles
    particlesArr.forEach(p => {
        if (p.color) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
            ctx.fillStyle = p.color;
            ctx.font = 'bold 8px "Press Start 2P", monospace';
            
            // Align right if it spawns too close to the right edge (to prevent clipping text)
            ctx.textAlign = p.x > canvas.width - 80 ? 'right' : 'center';
            
            // Offset Y significantly so it doesn't block the box behind it
            let renderY = p.y - 35 - (4 - p.life) * 10;
            
            // Dark Outline for readability (skip emojis)
            if (!p.text.includes('❤') && !p.text.includes('❤️')) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.strokeText(p.text, p.x, renderY);
            }
            
            ctx.fillText(p.text, p.x, renderY); // Float up
            ctx.restore();
        } else {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = p.x > canvas.width - 80 ? 'right' : 'center';
            
            let renderX = p.x - 10;
            let renderY = p.y - 45;
            
            // Dark Outline for readability (skip emojis)
            if (!p.text.includes('❤') && !p.text.includes('❤️')) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2.5;
                ctx.strokeText(p.text, renderX, renderY);
            }
            
            ctx.fillText(p.text, renderX, renderY);
            ctx.restore();
        }
    });

    // Version
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`v1.0.5 | ${currentFps} FPS`, canvas.width - 5, canvas.height - 5);

    // Retire fade-to-black overlay
    if (retireFadeTimer >= 0) {
        let alpha = Math.min(1, retireFadeTimer / 2.0);
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function loop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

const getMousePos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
};

let mouseVelX = 0;
let mouseVelY = 0;
let lastMouseUpdate = Date.now();
let lastMousePos = { x: 0, y: 0 };

let cursorNormalStr = '';
let cursorActiveStr = '';
let cursorWaterStr = '';
let cursorFoodStr = '';

function updateCursor(stateStr) {
    if (!cursorNormalStr) {
        const createCursor = (type) => {
            const cvs = document.createElement('canvas');
            cvs.width = 32; cvs.height = 32;
            const c = cvs.getContext('2d');
            const cols = { 'O': '#221109', 'S': '#f5c697', 'R': '#e74c3c', 'B': '#3498db', 'G': '#ecf0f1', 'L': '#85c1e9', 'Y': '#f1c40f', 'D': '#d4ac0d', 'E': '#e67e22', 'F': '#f5dead', 'M': '#5c4033' };
            let pix = [];
            if (type === 'normal') {
                pix = [
                    ".......OOO......",
                    ".....OOOSOOO....",
                    ".....OSOSOSO....",
                    "...OOOSOSOSO....",
                    "..OSSSSSSSSSO...",
                    "..OSSSSSSSSSO...",
                    "...OSSSSSSSSO...",
                    "....OSSSSSSO....",
                    ".....OOOOOO.....",
                    "................",
                    "................",
                    "................"
                ];
            } else if (type === 'active') {
                pix = [
                    "....OGGO..OGGO..",
                    "....ORRO..OBBO..",
                    "..OSORRO..OBBO..",
                    "..OSORRO..OBBO..",
                    ".OOSORRO..OBBO..",
                    ".OOSORROOOOBBO..",
                    "..OOSOSOSOSSOO..",
                    "...OSSSSSSSSSO..",
                    "...OSSSSSSSSSO..",
                    "....OOOOOOOOO...",
                    "................",
                    "................"
                ];
            } else if (type === 'water') {
                pix = [
                    "......OOOO......",
                    ".....OLLLLO.....",
                    ".....OLLLLO.....",
                    "....OLLLLLLO....",
                    "...OLLLLLLLLO...",
                    "..OLLLLLLLLLLO..",
                    "..OLLLLLLLLLLO..",
                    "..OLLLBBBBLLLO..",
                    "..OLLBBBBBBLLO..",
                    "..OLLBBBBBBLLO..",
                    "..OLLBBBBBBLLO..",
                    "...OLLLLLLLLO...",
                    "....OOOOOOOO....",
                    "................",
                    "................",
                    "................"
                ];
            } else if (type === 'food') {
                pix = [
                    "......YEY.......",
                    ".....EDYDY......",
                    "....YDYEYEY.....",
                    "...YEYYYYYEY....",
                    "..OEYYYDYYYEO...",
                    "..ODYYEYEYYDO...",
                    "..OOSOSOSOSOO...",
                    "...OSSSSSSSSO...",
                    "...OSSSSSSSSO...",
                    "....OSSSSSSO....",
                    ".....OOOOOO.....",
                    "................",
                    "................",
                    "................",
                    "................",
                    "................"
                ];
            }
            for (let y = 0; y < pix.length; y++) {
                for (let x = 0; x < pix[y].length; x++) {
                    if (cols[pix[y][x]]) { c.fillStyle = cols[pix[y][x]]; c.fillRect(x * 2, y * 2, 2, 2); }
                }
            }
            return cvs.toDataURL('image/png');
        };
        cursorNormalStr = `url(${createCursor('normal')}) 13 2, pointer`;
        cursorActiveStr = `url(${createCursor('active')}) 13 2, grabbing`;
        cursorWaterStr = `url(${createCursor('water')}) 16 16, pointer`;
        cursorFoodStr = `url(${createCursor('food')}) 16 16, pointer`;
    }

    if (stateStr === 'normal' || stateStr === false) canvas.style.cursor = cursorNormalStr;
    else if (stateStr === 'active' || stateStr === true) canvas.style.cursor = cursorActiveStr;
    else if (stateStr === 'water') canvas.style.cursor = cursorWaterStr;
    else if (stateStr === 'food') canvas.style.cursor = cursorFoodStr;
    else canvas.style.cursor = cursorNormalStr;
}
updateCursor('normal');

canvas.addEventListener('pointerdown', (e) => {
    updateCursor(true);
    if (state.hasPetting && sfxCatPurr.paused) {
        sfxCatPurr.volume = 0;
        sfxCatPurr.play().catch(e => { });
    }

    const pos = getMousePos(e);
    lastMousePos = pos;
    lastMouseUpdate = Date.now();

    if (state.musicLevel > 0) {
        let rx = canvas.width / 2 - 18, ry = 340, rw = 36, rh = 20;
        if (pos.x >= rx && pos.x <= rx + rw && pos.y >= ry && pos.y <= ry + rh) {
            window.isMusicMuted = !window.isMusicMuted;
            updateBGM();
            return;
        }
    }

    // Water click (LEFT)
    if (pos.x >= 0 && pos.x <= 80 && pos.y >= 60 && pos.y <= 280) {
        let cost = REFILL_COST_TIERS[state.refillLevel];
        if (state.money >= cost && state.water < state.maxWater) {
            playSound(sfxPopBuy, 0.8);
            state.money -= cost;
            state.water = Math.min(state.maxWater, state.water + REFILL_TIERS[state.refillLevel]);
            state.manualRefills++;
            updateUI();
            return;
        }
    }
    // Food click (RIGHT)
    if (pos.x >= 700 && pos.x <= 800 && pos.y >= 60 && pos.y <= 280) {
        let cost = REFILL_COST_TIERS[state.refillLevel];
        if (state.money >= cost && state.food < state.maxFood) {
            playSound(sfxPopBuy, 0.8);
            state.money -= cost;
            state.food = Math.min(state.maxFood, state.food + REFILL_TIERS[state.refillLevel]);
            state.manualRefills++;
            updateUI();
            return;
        }
    }

    // TV Ad has no active click effect

    // Check tombstones click
    for (let i = tombstonesArr.length - 1; i >= 0; i--) {
        let t = tombstonesArr[i];
        let dx = pos.x - t.x;
        let dy = pos.y - t.y;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
            t.hp--;
            t.shakeTimer = 0.2; // 200ms of shaking
            if (t.hp <= 0) {
                tombstonesArr.splice(i, 1);
                for (let j = 0; j < 5; j++) particlesArr.push({ x: t.x + (Math.random() - 0.5) * 20, y: t.y + (Math.random() - 0.5) * 20, text: '•', life: 0.5 + Math.random() });
            }
            return;
        }
    }

    isDragging = true;
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    mouseX = pos.x;
    mouseY = pos.y;

    let clickedEgg = false;
    for (let i = eggsArr.length - 1; i >= 0; i--) {
        let egg = eggsArr[i];
        if (!egg.collected && !egg.isBeingDragged) {
            const dx = pos.x - egg.x;
            const dy = pos.y - egg.y;
            if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
                egg.isBeingDragged = true;
                draggedEggs.push(egg);
                clickedEgg = true;
                break;
            }
        }
    }
});

canvas.addEventListener('pointermove', (e) => {
    const pos = getMousePos(e);
    let now = Date.now();

    let ptrState = isDragging ? 'active' : 'normal';

    let catX = 350, catY = 470;
    let isOverCat = (state.hasPetting) && (Math.abs(pos.x - catX) < 30) && (Math.abs(pos.y - catY) < 20);
    if (!isOverCat) window.catTailTarget = 0;

    let mWLvl = state.maxWaterLevel || 0; let whW = 40 + mWLvl * 16; let wyW = 180 - whW / 2;
    if (pos.x >= 0 && pos.x <= 80 && pos.y >= wyW && pos.y <= wyW + whW + 18) ptrState = 'water';

    let mFLvl = state.maxFoodLevel || 0; let fhF = 40 + mFLvl * 16; let fyF = 180 - fhF / 2;
    if (pos.x >= 700 && pos.x <= 800 && pos.y >= fyF && pos.y <= fyF + fhF + 18) ptrState = 'food';

    updateCursor(ptrState);

    let dtMouse = (now - lastMouseUpdate) / 1000;
    if (dtMouse > 0) {
        let dx = pos.x - lastMousePos.x;
        let dy = pos.y - lastMousePos.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            // Instantly update on strong movement
            mouseVelX = dx / dtMouse;
            mouseVelY = dy / dtMouse;

            if (state.hasPetting) {
                chickensArr.forEach(c => {
                    if (c.action === 'roam' && !c.dead) {
                        let cdx = pos.x - c.x;
                        let cdy = pos.y - (c.y - 4);
                        let isOver = Math.abs(cdx) < 24 && Math.abs(cdy) < 24;

                        if (isOver && !c.wasHovered) {
                            c.wasHovered = true;
                            c.eggTimer -= 1; // 1 second reduction per pass
                            c.squishTimer = 0.1;
                            playSound(randomCokSounds[Math.floor(Math.random() * randomCokSounds.length)], 0.1, 100 + (Math.random() - 0.5) * 50);
                            particlesArr.push({ x: c.x + (Math.random() - 0.5) * 10, y: c.y, text: '❤', life: 1.0, color: '#ff69b4' });

                            if (c.eggTimer <= 0) {
                                layEgg(c.x, c.y, c.direction);
                                c.squishTimer = 0.5;
                                c.jumpTimer = 0.5;
                                c.eggTimer = 10 - state.dietLevel;
                                c.eggCount++;
                                let eggCap = state.batchLevel === 2 ? 8 : (state.batchLevel === 1 ? 4 : 2);
                                if (c.eggCount >= eggCap) {
                                    c.action = c.nextTrough;
                                    c.nextTrough = (c.nextTrough === 'goToFood') ? 'goToWater' : 'goToFood';
                                }
                            }
                        } else if (!isOver && c.wasHovered) {
                            c.wasHovered = false;
                        }
                    }
                });

                roostersArr.forEach(r => {
                    let rdx = pos.x - r.x;
                    let rdy = pos.y - r.y;
                    let isOver = Math.abs(rdx) < 30 && Math.abs(rdy) < 30;
                    if (isOver && !r.wasHovered) {
                        r.wasHovered = true;
                        if (r.mateTimer > 0) {
                            r.mateTimer -= 2;
                            r.jumpTimer = 0.3; // Hop enthusiastically instead of squishing
                            playSound(randomCokSounds[Math.floor(Math.random() * randomCokSounds.length)], 0.15, 80 + (Math.random() - 0.5) * 40);
                            particlesArr.push({ x: r.x + (Math.random() - 0.5) * 10, y: r.y - 15, text: '❤', life: 1.0, color: '#e91e63' });
                        }
                    } else if (!isOver && r.wasHovered) {
                        r.wasHovered = false;
                    }
                });

                // Petting Cat visuals
                let pdx = pos.x - catX;
                let pdy = pos.y - catY;
                if (Math.abs(pdx) < 30 && Math.abs(pdy) < 20) {
                    window.catPurrVol = Math.min(1.0, (window.catPurrVol || 0) + 0.2);
                    if (Math.random() < 0.1) {
                        particlesArr.push({ x: catX + (Math.random() - 0.5) * 15, y: catY + 25, text: '❤', life: 0.5, color: '#e91e63' });
                        window.catTailTarget = 0.5; // Happy tail twitch
                    }
                }
            }
        } else {
            // Smoothly decay if the user briefly stops before releasing click
            mouseVelX *= Math.pow(0.0001, dtMouse);
            mouseVelY *= Math.pow(0.0001, dtMouse);
        }
    }
    lastMousePos = pos;
    lastMouseUpdate = now;

    mouseX = pos.x;
    mouseY = pos.y;
});

canvas.addEventListener('pointerup', (e) => {
    updateCursor(false);
    isDragging = false;
    draggedEggs.forEach(egg => {
        egg.isBeingDragged = false;
        egg.hasHitGround = false;
        egg.velX = Math.max(-800, Math.min(800, mouseVelX * 0.2));
        egg.velY = Math.max(-800, Math.min(800, mouseVelY * 0.2));
    });
    draggedEggs = [];
});

canvas.addEventListener('pointercancel', () => {
    updateCursor(false);
    isDragging = false;
    draggedEggs.forEach(egg => {
        egg.isBeingDragged = false;
        egg.hasHitGround = false;
        egg.velX = 0; egg.velY = 0;
    });
    draggedEggs = [];
});

// btnSell.addEventListener('click', () => { // This button is no longer used
//     sellOneEgg();
//     updateUI();
// });

if (btnCheat) {
    btnCheat.addEventListener('click', () => {
        state.money += 100000000;
        state.totalEarnings = (state.totalEarnings || 0) + 100000000;
        updateUI();
    });
}

btnWipe.addEventListener('click', () => {
    document.getElementById('wipe-confirm-overlay').style.display = 'flex';
});

document.getElementById('wipe-cancel').addEventListener('click', () => {
    document.getElementById('wipe-confirm-overlay').style.display = 'none';
});

document.getElementById('wipe-confirm').addEventListener('click', async () => {
    document.getElementById('wipe-confirm-overlay').style.display = 'none';
    localStorage.removeItem('chickenIdleSave');
    if (typeof GAME_MARKET !== 'undefined' && GAME_MARKET === "crazygames" && window.isCrazyGamesInitialized) {
        try { await window.CrazyGames.SDK.data.removeItem('chickenIdleSave'); } catch (e) { }
        try { await window.CrazyGames.SDK.data.setItem('chickenIdleSave', ''); } catch (e) { }
        try { if (window.CrazyGames.SDK.data.clear) await window.CrazyGames.SDK.data.clear(); } catch(e) {}
        // Ensure TCP packet transmission finishes before DOM drops the execution context
        await new Promise(r => setTimeout(r, 600));
    }
    location.reload();
});

let dbgBtn = document.getElementById('debug-btn');
if (dbgBtn) {
    dbgBtn.addEventListener('click', () => {
        state.money = Math.max(state.money, state.costs.retire);
        buy('retire');
    });
}

let saveTimer = 0;

function buy(item) {
    if (state.money >= state.costs[item]) {
        playSound(sfxPopBuy, 0.8);
        state.money -= state.costs[item];

        if (item === 'chicken') {
            playSound(sfxCok, 0.5, 100);
            state.chickens++;
            if (state.chickens === 1) state.costs.chicken = 2;
            else if (state.chickens === 2) state.costs.chicken = 3;
            else if (state.chickens === 3) state.costs.chicken = 4;
            else if (state.chickens === 4) state.costs.chicken = 5;
            else state.costs.chicken = Math.ceil(state.costs.chicken * 1.2);
            chickensArr.push(createChicken());
        } else if (item === 'petting') {
            state.hasPetting = true;
            shopBtns.petting.disabled = true;
            shopCosts.petting.innerText = 'MAX';
        } else if (item === 'maxFood') {
            state.maxFoodLevel++;
            state.maxFood = MAX_RESOURCE_TIERS[state.maxFoodLevel];
            state.food = state.maxFood;
            state.costs.maxFood = Math.floor(state.costs.maxFood * 1.8);
            if (state.maxFoodLevel >= 10) shopBtns.maxFood.disabled = true;
        } else if (item === 'maxWater') {
            state.maxWaterLevel++;
            state.maxWater = MAX_RESOURCE_TIERS[state.maxWaterLevel];
            state.water = state.maxWater;
            state.costs.maxWater = Math.floor(state.costs.maxWater * 1.8);
            if (state.maxWaterLevel >= 10) shopBtns.maxWater.disabled = true;
        } else if (item === 'autoFood') {
            state.autoFoodLevel++;
            state.costs.autoFood = Math.floor(state.costs.autoFood * 2.5);
            if (state.autoFoodLevel >= AUTO_TICK_TIERS.length - 1) {
                shopBtns.autoFood.disabled = true;
                shopCosts.autoFood.innerText = 'MAX';
            }
        } else if (item === 'autoWater') {
            state.autoWaterLevel++;
            state.costs.autoWater = Math.floor(state.costs.autoWater * 2.5);
            if (state.autoWaterLevel >= AUTO_TICK_TIERS.length - 1) {
                shopBtns.autoWater.disabled = true;
                shopCosts.autoWater.innerText = 'MAX';
            }
        } else if (item === 'autoCollect') {
            state.autoCollectLevel++;
            const costsColl = [25, 250, 5000, 100000, 2000000];
            if (state.autoCollectLevel < 5) state.costs.autoCollect = costsColl[state.autoCollectLevel];
            if (state.autoCollectLevel >= 5) {
                shopBtns.autoCollect.disabled = true;
                shopCosts.autoCollect.innerText = 'MAX';
            }
        } else if (item === 'autoSell') {
            state.autoSellLevel++;
            const costsSell = [100, 5000, 100000, 2000000, 10000000];
            if (state.autoSellLevel < 5) state.costs.autoSell = costsSell[state.autoSellLevel];
            if (state.autoSellLevel >= 5) {
                shopBtns.autoSell.disabled = true;
                shopCosts.autoSell.innerText = 'MAX';
            }
        } else if (item === 'refill') {
            state.refillLevel++;
            state.costs.refill = Math.floor(state.costs.refill * 2.5);
            if (state.refillLevel >= REFILL_TIERS.length - 1) {
                shopBtns.refill.disabled = true;
                shopCosts.refill.innerText = 'MAX';
            }
        } else if (item === 'premium') {
            state.premiumLevel++;
            state.costs.premium = Math.floor(state.costs.premium * 2);
            if (state.premiumLevel >= 10) {
                shopBtns.premium.disabled = true;
                shopCosts.premium.innerText = 'MAX';
            }
        } else if (item === 'golden') {
            state.goldenLevel = (state.goldenLevel || 0) + 1;
            state.costs.golden = Math.floor(state.costs.golden * 2);
            if (state.goldenLevel >= 10) {
                shopBtns.golden.disabled = true;
                shopCosts.golden.innerText = 'MAX';
            }
        } else if (item === 'ramp') {
            state.hasRamp = true;
        } else if (item === 'baseValue') {
            let multiplier = 1.75 + (state.baseValueLevel || 0) * 0.06;
            state.baseValueLevel++;
            state.costs.baseValue = Math.floor(state.costs.baseValue * multiplier);
            eggsArr.forEach(e => e.value *= 1.5);
            state.packageBuffer = state.packageBuffer.map(v => {
                if (typeof v === 'object') {
                    v.value *= 1.5;
                    return v;
                }
                return v * 1.5;
            });
        } else if (item === 'washer') {
            state.hasWasher = true;
            shopBtns.washer.disabled = true;
            shopCosts.washer.innerText = 'MAX';
        } else if (item === 'stamper') {
            state.hasStamper = true;
            shopBtns.stamper.disabled = true;
            shopCosts.stamper.innerText = 'MAX';
        } else if (item === 'packager') {
            state.hasPackager = true;
            shopBtns.packager.disabled = true;
            shopCosts.packager.innerText = 'MAX';
        } else if (item === 'ribbon') {
            state.hasRibbon = true;
            shopBtns.ribbon.disabled = true;
            shopCosts.ribbon.innerText = 'MAX';
        } else if (item === 'music') {
            state.musicLevel++;
            state.costs.music = Math.floor(state.costs.music * 2);
            updateBGM();
            if (state.musicLevel >= 10) {
                shopBtns.music.disabled = true;
                shopCosts.music.innerText = 'MAX';
            }
        } else if (item === 'diet') {
            state.dietLevel++;
            state.costs.diet = Math.floor(state.costs.diet * 2.5);
            if (state.dietLevel >= 4) {
                shopBtns.diet.disabled = true;
                shopCosts.diet.innerText = 'MAX';
            }
        } else if (item === 'batch') {
            state.batchLevel = (state.batchLevel || 0) + 1;
            state.costs.batch = state.batchLevel === 1 ? 500000 : 0;
            if (state.batchLevel >= 2) {
                shopBtns.batch.disabled = true;
                shopCosts.batch.innerText = 'MAX';
            }
        } else if (item === 'magnet') {
            state.magnetLevel = (state.magnetLevel || 0) + 1;
            const mCosts = [10, 20, 40, 60, 100, 200, 400, 600, 1000];
            if (state.magnetLevel < mCosts.length) state.costs.magnet = mCosts[state.magnetLevel];
        } else if (item === 'rooster') {
            state.hasRooster = true;
            state.roosterLevel = (state.roosterLevel || 0) + 1;
            if (state.roosterLevel === 1) state.costs.rooster = 5000;
            else if (state.roosterLevel === 2) state.costs.rooster = 100000;
            roostersArr.push(createRooster());
            if (state.roosterLevel >= 3) {
                shopBtns.rooster.disabled = true;
                shopCosts.rooster.innerText = 'MAX';
            }
        } else if (item === 'growth') {
            state.growthLevel = (state.growthLevel || 0) + 1;
            state.costs.growth = Math.floor(state.costs.growth * 2.5);
            if (state.growthLevel >= 10) {
                shopBtns.growth.disabled = true;
                shopCosts.growth.innerText = 'MAX';
            }
        } else if (item === 'tvAd') {
            state.hasTvAd = true;
            state.tvUpvotes = 0;
            shopBtns.tvAd.disabled = true;
            shopCosts.tvAd.innerText = 'MAX';
        } else if (item === 'retire') {
            // Block all buttons immediately except wipe button
            document.querySelectorAll('.shop-btn, .pixel-btn').forEach(b => {
                if (b.id !== 'wipe-btn') b.disabled = true;
            });
            canvas.style.cursor = 'default';
            retireFadeTimer = 0;
            updateUI();
            return; // actual cinematic triggered by update() after fade
        }

        updateUI();
    }
}

shopBtns.chicken.addEventListener('click', () => buy('chicken'));
shopBtns.petting.addEventListener('click', () => buy('petting'));
shopBtns.maxFood.addEventListener('click', () => buy('maxFood'));
shopBtns.maxWater.addEventListener('click', () => buy('maxWater'));
shopBtns.autoFood.addEventListener('click', () => buy('autoFood'));
shopBtns.autoWater.addEventListener('click', () => buy('autoWater'));
shopBtns.autoCollect.addEventListener('click', () => buy('autoCollect'));
shopBtns.autoSell.addEventListener('click', () => buy('autoSell'));
shopBtns.refill.addEventListener('click', () => buy('refill'));
shopBtns.premium.addEventListener('click', () => buy('premium'));
shopBtns.golden.addEventListener('click', () => buy('golden'));
shopBtns.baseValue.addEventListener('click', () => buy('baseValue'));
shopBtns.washer.addEventListener('click', () => buy('washer'));
shopBtns.stamper.addEventListener('click', () => buy('stamper'));
shopBtns.packager.addEventListener('click', () => buy('packager'));
shopBtns.ribbon.addEventListener('click', () => buy('ribbon'));
shopBtns.music.addEventListener('click', () => buy('music'));
shopBtns.diet.addEventListener('click', () => buy('diet'));
shopBtns.batch.addEventListener('click', () => buy('batch'));
shopBtns.magnet.addEventListener('click', () => buy('magnet'));
shopBtns.rooster.addEventListener('click', () => buy('rooster'));
shopBtns.growth.addEventListener('click', () => buy('growth'));
shopBtns.tvAd.addEventListener('click', () => buy('tvAd'));
shopBtns.retire.addEventListener('click', () => buy('retire'));
shopBtns.ramp.addEventListener('click', () => buy('ramp'));

function updateUI() {
    state.maxChickens = Math.max(state.maxChickens || 0, state.chickens);
    const shopScroll = document.getElementById('shop-scroll');
    const savedScrollTop = shopScroll ? shopScroll.scrollTop : 0;

    moneyEl.innerText = fmtMoney(state.money);
    if (chickensEl) chickensEl.innerText = fmt(state.chickens);

    shopCosts.chicken.innerText = fmt(state.costs.chicken) + '$';
    if (!state.hasPetting) shopCosts.petting.innerText = fmt(state.costs.petting) + '$';
    if (state.maxFoodLevel < 10) shopCosts.maxFood.innerText = fmt(state.costs.maxFood) + '$';
    else shopCosts.maxFood.innerText = 'MAX';
    if (state.maxWaterLevel < 10) shopCosts.maxWater.innerText = fmt(state.costs.maxWater) + '$';
    else shopCosts.maxWater.innerText = 'MAX';
    if (state.autoFoodLevel < AUTO_TICK_TIERS.length - 1) shopCosts.autoFood.innerText = fmt(state.costs.autoFood) + '$';
    if (state.autoWaterLevel < AUTO_TICK_TIERS.length - 1) shopCosts.autoWater.innerText = fmt(state.costs.autoWater) + '$';
    if (state.autoCollectLevel < 5) shopCosts.autoCollect.innerText = fmt(state.costs.autoCollect) + '$';
    if (state.autoSellLevel < 5) shopCosts.autoSell.innerText = fmt(state.costs.autoSell) + '$';
    if (state.refillLevel < REFILL_TIERS.length - 1) shopCosts.refill.innerText = fmt(state.costs.refill) + '$';
    if (state.premiumLevel < 10) shopCosts.premium.innerText = fmt(state.costs.premium) + '$';
    if ((state.goldenLevel || 0) < 10) shopCosts.golden.innerText = fmt(state.costs.golden) + '$';
    shopCosts.baseValue.innerText = fmt(state.costs.baseValue) + '$';
    if (!state.hasWasher) shopCosts.washer.innerText = fmt(state.costs.washer) + '$';
    if (!state.hasStamper) shopCosts.stamper.innerText = fmt(state.costs.stamper) + '$';
    if (!state.hasPackager) shopCosts.packager.innerText = fmt(state.costs.packager) + '$';
    if (!state.hasRibbon) shopCosts.ribbon.innerText = fmt(state.costs.ribbon) + '$';
    if ((state.growthLevel || 0) < 10) shopCosts.growth.innerText = fmt(state.costs.growth) + '$';
    else shopCosts.growth.innerText = 'MAX';
    if (state.musicLevel < 10) shopCosts.music.innerText = fmt(state.costs.music) + '$';
    if (state.dietLevel < 4) shopCosts.diet.innerText = fmt(state.costs.diet) + '$';
    if ((state.batchLevel || 0) < 2) shopCosts.batch.innerText = fmt(state.costs.batch) + '$';
    if ((state.magnetLevel || 0) < 9) shopCosts.magnet.innerText = fmt(state.costs.magnet) + '$';
    else shopCosts.magnet.innerText = 'MAX';
    if ((state.roosterLevel || 0) < 3) shopCosts.rooster.innerText = fmt(state.costs.rooster) + '$';
    if (!state.hasTvAd) shopCosts.tvAd.innerText = fmt(state.costs.tvAd) + '$';
    else shopCosts.tvAd.innerText = 'MAX';
    if (!state.hasRetired) shopCosts.retire.innerText = fmt(state.costs.retire) + '$';
    if (!state.hasRamp) shopCosts.ramp.innerText = fmt(state.costs.ramp) + '$';

    shopBtns.autoFood.querySelector('span:first-child').innerHTML = 'Auto-Food' + getPips(state.autoFoodLevel, AUTO_TICK_TIERS.length - 1);
    shopBtns.autoWater.querySelector('span:first-child').innerHTML = 'Auto-Water' + getPips(state.autoWaterLevel, AUTO_TICK_TIERS.length - 1);
    shopBtns.autoCollect.querySelector('span:first-child').innerHTML = 'Farm Belt' + getPips(state.autoCollectLevel, 5);
    shopBtns.autoSell.querySelector('span:first-child').innerHTML = 'Storage Belt' + getPips(state.autoSellLevel, 5);
    shopBtns.refill.querySelector('span:first-child').innerHTML = 'Refill' + getPips(state.refillLevel, REFILL_TIERS.length - 1);
    shopBtns.maxFood.querySelector('span:first-child').innerHTML = 'Max Food' + getPips(state.maxFoodLevel, 10);
    shopBtns.maxWater.querySelector('span:first-child').innerHTML = 'Max Water' + getPips(state.maxWaterLevel, 10);
    shopBtns.premium.querySelector('span:first-child').innerHTML = `Premium Feed` + getPips(state.premiumLevel, 10);
    shopBtns.golden.querySelector('span:first-child').innerHTML = `Golden Egg` + getPips(state.goldenLevel || 0, 10);
    shopBtns.music.querySelector('span:first-child').innerHTML = 'Farm Music' + getPips(state.musicLevel, 10);
    shopBtns.diet.querySelector('span:first-child').innerHTML = 'Pro Diet' + getPips(state.dietLevel, 4);
    if (shopBtns.batch) shopBtns.batch.querySelector('span:first-child').innerHTML = 'Dessert Stomach' + getPips(state.batchLevel || 0, 2);
    shopBtns.rooster.querySelector('span:first-child').innerHTML = 'The Rooster' + getPips(state.roosterLevel || 0, 3);
    shopBtns.growth.querySelector('span:first-child').innerHTML = 'Growth Formula' + getPips(state.growthLevel || 0, 10);
    shopBtns.magnet.querySelector('span:first-child').innerHTML = 'Magnet Force' + getPips(state.magnetLevel || 0, 9);
    shopBtns.tvAd.querySelector('span:first-child').innerHTML = 'As Seen On TV' + (state.hasTvAd ? '<br><span style="color:#a0522d;font-size:10px;line-height:1.5;">■</span>' : '');

    // Visibility configuration
    shopBtns.maxFood.style.display = (state.maxChickens < 9 || state.maxFoodLevel >= 10) ? 'none' : 'flex';
    shopBtns.maxWater.style.display = (state.maxChickens < 9 || state.maxWaterLevel >= 10) ? 'none' : 'flex';

    shopBtns.autoCollect.style.display = (state.eggsSold < 25 || state.autoCollectLevel >= 5) ? 'none' : 'flex';
    shopBtns.autoSell.style.display = (state.autoCollectLevel < 1 || state.autoSellLevel >= 5) ? 'none' : 'flex';
    shopBtns.washer.style.display = (state.autoSellLevel < 1 || state.hasWasher) ? 'none' : 'flex';
    shopBtns.stamper.style.display = (!state.hasWasher || state.hasStamper) ? 'none' : 'flex';
    shopBtns.packager.style.display = (!state.hasStamper || state.hasPackager) ? 'none' : 'flex';
    shopBtns.ribbon.style.display = (!state.hasPackager || state.hasRibbon) ? 'none' : 'flex';
    shopBtns.music.style.display = (state.maxChickens < 20 || state.musicLevel >= 10) ? 'none' : 'flex';
    shopBtns.diet.style.display = (state.maxChickens < 30 || state.dietLevel >= 4) ? 'none' : 'flex';
    if (shopBtns.batch) shopBtns.batch.style.display = (state.dietLevel < 3 || (state.batchLevel || 0) >= 2) ? 'none' : 'flex';
    shopBtns.magnet.style.display = (state.maxChickens >= 3 && (state.magnetLevel || 0) < 9) ? 'flex' : 'none';
    shopBtns.rooster.style.display = (state.maxChickens >= 10 && (state.roosterLevel || 0) < 3) ? 'flex' : 'none';
    shopBtns.growth.style.display = ((state.roosterLevel || 0) < 2 || (state.growthLevel || 0) >= 10) ? 'none' : 'flex';
    shopBtns.retire.style.display = (state.hasTvAd || state.hasRetired) ? 'flex' : 'none';
    shopBtns.petting.style.display = (state.maxChickens < 1 || state.hasPetting) ? 'none' : 'flex';

    let allMaxed = (
        state.maxFoodLevel >= 10 &&
        state.maxWaterLevel >= 10 &&
        state.autoFoodLevel >= AUTO_TICK_TIERS.length - 1 &&
        state.autoWaterLevel >= AUTO_TICK_TIERS.length - 1 &&
        state.autoCollectLevel >= 5 &&
        state.autoSellLevel >= 5 &&
        state.refillLevel >= REFILL_TIERS.length - 1 &&
        state.premiumLevel >= 10 &&
        (state.goldenLevel || 0) >= 10 &&
        state.hasWasher &&
        state.hasStamper &&
        state.hasPackager &&
        state.hasRibbon &&
        (state.growthLevel || 0) >= 10 &&
        state.musicLevel >= 10 &&
        state.dietLevel >= 4 &&
        (state.batchLevel || 0) >= 2 &&
        (state.magnetLevel || 0) >= 9 &&
        (state.roosterLevel || 0) >= 3 &&
        state.hasRamp
    );

    shopBtns.baseValue.style.display = (state.maxChickens < 4) ? 'none' : 'flex';
    shopBtns.ramp.style.display = (!state.hasRamp && state.maxChickens >= 2) ? 'flex' : 'none';
    shopBtns.premium.style.display = (state.baseValueLevel < 5 || state.premiumLevel >= 10) ? 'none' : 'flex';
    shopBtns.golden.style.display = (state.premiumLevel < 3 || (state.goldenLevel || 0) >= 10) ? 'none' : 'flex';
    shopBtns.refill.style.display = ((state.maxFoodLevel < 2 && state.maxWaterLevel < 2) || state.refillLevel >= REFILL_TIERS.length - 1) ? 'none' : 'flex';
    shopBtns.autoFood.style.display = (state.maxFood >= 400 && state.autoFoodLevel < AUTO_TICK_TIERS.length - 1) ? 'flex' : 'none';
    shopBtns.autoWater.style.display = (state.maxWater >= 400 && state.autoWaterLevel < AUTO_TICK_TIERS.length - 1) ? 'flex' : 'none';
    shopBtns.tvAd.style.display = (allMaxed && !state.hasTvAd) ? 'flex' : 'none';

    let maxConditions = {
        chicken: false,
        petting: state.hasPetting,
        baseValue: false,
        ramp: state.hasRamp,
        premium: state.premiumLevel >= 10,
        golden: (state.goldenLevel || 0) >= 10,
        refill: state.refillLevel >= REFILL_TIERS.length - 1,
        maxFood: state.maxFoodLevel >= 10,
        maxWater: state.maxWaterLevel >= 10,
        autoFood: state.autoFoodLevel >= AUTO_TICK_TIERS.length - 1,
        autoWater: state.autoWaterLevel >= AUTO_TICK_TIERS.length - 1,
        autoCollect: state.autoCollectLevel >= 5,
        autoSell: state.autoSellLevel >= 5,
        washer: state.hasWasher,
        stamper: state.hasStamper,
        packager: state.hasPackager,
        ribbon: state.hasRibbon,
        music: state.musicLevel >= 10,
        diet: state.dietLevel >= 4,
        batch: (state.batchLevel || 0) >= 2,
        magnet: (state.magnetLevel || 0) >= 9,
        rooster: (state.roosterLevel || 0) >= 3,
        growth: (state.growthLevel || 0) >= 10,
        tvAd: state.hasTvAd,
        retire: state.hasRetired
    };

    for (let key in shopBtns) {
        let btn = shopBtns[key];
        if (!btn) continue;
        let isMax = maxConditions[key];

        if (isMax) {
            if (window.infoMode) btn.style.display = 'flex';
            btn.classList.add('maxed-btn');
            btn.style.order = 1;
            if (shopCosts[key]) shopCosts[key].innerText = 'MAX';
            btn.disabled = true;
        } else {
            btn.classList.remove('maxed-btn');
            btn.style.order = 0;
            if (btn.style.display !== 'none') {
                btn.disabled = state.money < state.costs[key];
            }
        }
    }

    if (window.infoMode) {
        document.querySelectorAll('.shop-desc-text').forEach(d => d.style.display = 'block');
    } else {
        document.querySelectorAll('.shop-desc-text').forEach(d => d.style.display = 'none');
    }

    document.querySelectorAll('.stats, #stats-header').forEach(el => {
        el.style.display = state.hasRetired ? 'none' : '';
    });

    const steamWishBtn = document.getElementById('steam-btn');
    if (steamWishBtn && (GAME_MARKET === "itchio" || GAME_MARKET === "galaxy")) {
        if (state.hasRetired) {
            let topbar = document.getElementById('topbar');
            if (topbar && steamWishBtn.parentNode !== topbar) {
                topbar.insertBefore(steamWishBtn, topbar.children[1]);
                steamWishBtn.style.margin = '0 auto';
                steamWishBtn.style.fontSize = '14px';
                steamWishBtn.style.padding = '10px 20px';
                steamWishBtn.style.display = 'block';
            }
        }
    }

    if (shopScroll) shopScroll.scrollTop = savedScrollTop;
}

function updateCinematic(dt) {
    if (bgmTheme.paused && !window.isMusicMuted) {
        bgmTheme.volume = 0.5;
        bgmTheme.play().catch(e => { });
    }
    if (Math.random() < 0.05 && cinematicPhase < 3) {
        playRandomCok();
    }

    cinematicTimer += dt;
    // Phase 0: Fade to black (0-2s)
    if (cinematicPhase === 0) {
        if (cinematicTimer > 2) { cinematicPhase = 1; cinematicTimer = 0; }
    }
    // Phase 1: Enter meadow + Chickens walk in purely horizontally
    else if (cinematicPhase === 1) {
        let crossedCenter = 0;
        chickensArr.forEach(c => {
            c.direction = 1;
            c.x += c.velX * dt; c.y += c.velY * dt;
            if (c.x > canvas.width / 2) {
                crossedCenter++;
            }
        });
        if (crossedCenter >= chickensArr.length / 2) {
            cinematicPhase = 2; cinematicTimer = 0;
        }
    }
    // Phase 2: Formation
    else if (cinematicPhase === 2) {
        let allInPosition = true;
        chickensArr.forEach(c => {
            let dx = c.targetX - c.x; let dy = c.targetY - c.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                allInPosition = false;
                let speed = Math.sqrt(c.velX * c.velX + c.velY * c.velY) || 60; // Keep their original wandering speed for matching visual flow
                c.x += (dx / dist) * speed * dt; c.y += (dy / dist) * speed * dt;
                c.direction = dx >= 0 ? 1 : -1;
            } else {
                c.x = c.targetX; c.y = c.targetY;
                c.direction = -1; // Face forward/left at the end
                c.velX = 0; c.velY = 0;
            }
        });
        if (allInPosition || cinematicTimer > 15) { cinematicPhase = 3; cinematicTimer = 0; }
    }
    // Phase 3: Hold and fade to black (0-6s)
    else if (cinematicPhase === 3) {
        if (cinematicTimer > 6) {
            cinematicPhase = 4; cinematicTimer = 0;
            let rl = document.getElementById('rate-link');
            if (rl && GAME_MARKET === "itchio") rl.style.display = 'block';
        }
    }
}

function drawCinematic() {
    let w = canvas.width;
    let h = canvas.height;

    // Helper block to draw the meadow exactly like normal but without troughs/machines
    let drawMeadow = function () {
        ctx.fillStyle = '#7cba3a'; ctx.fillRect(0, 0, w, h);
        drawFence(ctx, w, h);

        ctx.fillStyle = '#6b9c2a';
        for (let i = 1; i < 30; i++) {
            let gx = (i * 137) % w; let gy = (i * 93) % h;
            if (gy < 65) gy += 65;
            ctx.fillRect(gx, gy, 4, 4);
        }
        chickensArr.forEach(c => {
            renderChicken(ctx, c);
        });
    };

    if (cinematicPhase === 0) {
        // Draw old dirty factory one last frame? Wait we can't easily, just pure black fade
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, cinematicTimer / 2)})`;
        ctx.fillRect(0, 0, w, h);
    } else if (cinematicPhase === 1) {
        drawMeadow();
        let alpha = 1 - Math.min(1, cinematicTimer / 1.5);
        if (alpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, w, h);
        }
    } else if (cinematicPhase === 2) {
        drawMeadow();
    } else if (cinematicPhase === 3) {
        drawMeadow();
        let alpha = Math.min(1, Math.max(0, (cinematicTimer - 2) / 3));
        if (alpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.fillRect(0, 0, w, h);
        }
    } else if (cinematicPhase === 4) {
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, w, h);

        // Draw an elegant decorative box
        ctx.strokeStyle = '#d4af37'; // Gold
        ctx.lineWidth = 4;
        ctx.strokeRect(w / 2 - 340, h / 2 - 230, 680, 470);
        ctx.strokeStyle = '#8a6d3b';
        ctx.lineWidth = 2;
        ctx.strokeRect(w / 2 - 334, h / 2 - 224, 668, 458);
        ctx.lineWidth = 1;

        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#ffffff';
        ctx.font = '30px "Press Start 2P"';
        ctx.fillText('The MachinEGG', w / 2, h / 2 - 150);

        ctx.fillStyle = '#d4af37';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('A game by Quantum Games Studio', w / 2, h / 2 - 100);

        ctx.fillStyle = '#00bbff';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('Made by JC.', w / 2, h / 2 - 75);

        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // A neat separator line
        ctx.fillStyle = '#444';
        ctx.fillRect(w / 2 - 200, h / 2 - 60, 400, 2);

        ctx.font = '12px "Press Start 2P"';
        let hrs = Math.floor((state.playTime || 0) / 3600);
        let mins = Math.floor(((state.playTime || 0) % 3600) / 60);
        let secs = Math.floor((state.playTime || 0) % 60);
        let timeStr = `${hrs}h ${mins}m ${secs}s`;

        ctx.textAlign = 'right';
        let lblX = w / 2 - 10;
        let valX = w / 2 + 10;
        let startY = h / 2 - 20;

        ctx.fillStyle = '#ccc';
        ctx.fillText('Total Playtime:', lblX, startY);
        ctx.fillText('Total Eggs Sold:', lblX, startY + 30);
        ctx.fillText('Lifetime Earnings:', lblX, startY + 60);
        ctx.fillText('Liberated Chickens:', lblX, startY + 90);
        ctx.fillStyle = '#e74c3c';
        ctx.fillText('Dead Chickens:', lblX, startY + 120);
        ctx.fillText('Hungry/Thirsty:', lblX, startY + 150);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText(timeStr, valX, startY);
        ctx.fillText(fmt(state.eggsSold), valX, startY + 30);
        ctx.fillStyle = '#2ecc71';
        ctx.fillText(fmtMoney(state.totalEarnings || state.money) + '$', valX, startY + 60);
        ctx.fillStyle = '#f39c12';
        ctx.fillText(fmt(state.chickens), valX, startY + 90);
        ctx.fillStyle = '#e74c3c';
        ctx.fillText(fmt(state.deadChickens || 0), valX, startY + 120);
        ctx.fillText(fmt(state.chickensSuffered || 0), valX, startY + 150);

        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        let blink = Date.now() % 1000 < 500 ? 'Click [WIPE SAVE] on the top to play again.' : '';
        ctx.fillText(blink, w / 2, h / 2 + 180);

        let suffered = (state.chickensSuffered || 0) + (state.deadChickens || 0);
        if (suffered === 0) {
            ctx.fillStyle = Date.now() % 1000 < 500 ? '#f1c40f' : '#f39c12';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText("PERFECT! No chickens were harmed during this playthrough.", w / 2, h / 2 + 210);
        }

        ctx.textAlign = 'left';
    }
}

function saveState() {
    let cleanRoosters = roostersArr.map(r => {
        let copy = { ...r };
        copy.targetChicken = null;
        if (copy.action === 'chase') copy.action = 'roam';
        return copy;
    });

    const saveData = {
        state: state,
        chickensArr: chickensArr,
        chicksArr: chicksArr,
        roostersArr: cleanRoosters,
        eggsArr: eggsArr,
        tombstonesArr: tombstonesArr
    };
    let saveString = JSON.stringify(saveData);
    localStorage.setItem('chickenIdleSave', saveString);
    if (GAME_MARKET === "crazygames" && window.isCrazyGamesInitialized) {
        try { window.CrazyGames.SDK.data.setItem('chickenIdleSave', saveString); } catch (e) { }
    }
}

function loadState() {
    let saved = localStorage.getItem('chickenIdleSave');
    if (saved) {
        try {
            let data = JSON.parse(saved);
            if (data.state) {
                let defaultCosts = { ...state.costs };
                Object.assign(state, data.state);
                if (data.state.costs) {
                    state.costs = Object.assign(defaultCosts, data.state.costs);
                } else {
                    state.costs = defaultCosts;
                }

                // Retro-compatibility fixes for base costs changed in latest updates
                if ((state.roosterLevel || 0) === 0) state.costs.rooster = 200;
                if ((state.growthLevel || 0) === 0) state.costs.growth = 1000;
                if ((state.magnetLevel || 0) === 0) state.costs.magnet = 10;
                if ((state.autoFoodLevel || 0) === 0) state.costs.autoFood = 1000;
                if ((state.autoWaterLevel || 0) === 0) state.costs.autoWater = 1000;
                if ((state.premiumLevel || 0) === 0) state.costs.premium = 2500;
                if ((state.goldenLevel || 0) === 0) state.costs.golden = 50000;
                if (state.chickens <= 1) state.costs.chicken = 0;

                if (state.hasRetired === undefined) state.hasRetired = false;
                if (state.costs.retire === undefined) state.costs.retire = 1000000000;

                if (state.hasTvAd === undefined) state.hasTvAd = (state.shockwaveLevel > 0);
                if (state.costs.tvAd === undefined) state.costs.tvAd = 50000000;

                if (state.maxFoodLevel === undefined) {
                    state.maxFoodLevel = MAX_RESOURCE_TIERS.findIndex(v => v >= state.maxFood);
                    if (state.maxFoodLevel === -1) state.maxFoodLevel = 10;
                    state.maxFood = MAX_RESOURCE_TIERS[state.maxFoodLevel] || 2500;
                }
                if (state.maxWaterLevel === undefined) {
                    state.maxWaterLevel = MAX_RESOURCE_TIERS.findIndex(v => v >= state.maxWater);
                    if (state.maxWaterLevel === -1) state.maxWaterLevel = 10;
                    state.maxWater = MAX_RESOURCE_TIERS[state.maxWaterLevel] || 2500;
                }
            }
            if (data.chickensArr) chickensArr = data.chickensArr;
            if (data.chicksArr) chicksArr = data.chicksArr;
            if (data.roostersArr) roostersArr = data.roostersArr;
            if (data.eggsArr) eggsArr = data.eggsArr;
            if (data.tombstonesArr) {
                tombstonesArr = data.tombstonesArr;
                if (state.deadChickens === undefined) {
                    state.deadChickens = tombstonesArr.length;
                }
            }

            roostersArr.forEach(r => r.targetChicken = null);

            if (state.hasRetired) {
                document.getElementById('shop').style.display = 'none';
                canvas.width = 1140;
                cinematicPhase = 3;
                cinematicTimer = 10;
                chickensArr = [];
            }
        } catch (e) {
            console.error("Save corrupted", e);
        }
    }

    // Load mute state — default false (sound ON) if never saved
    const savedMute = localStorage.getItem('chickenIdleMuted');
    window.isMusicMuted = savedMute === null ? false : savedMute === 'true';
    const muteBtn2 = document.getElementById('mute-btn');
    if (muteBtn2 && window.isMusicMuted) {
        muteBtn2.style.background = '#e74c3c';
        muteBtn2.style.borderColor = '#fff #c0392b #c0392b #fff';
    }
}

let currentFps = 0;
let framesThisSecond = 0;
let lastFpsTime = 0;

function loop(timestamp) {
    if (!lastFpsTime) lastFpsTime = timestamp;
    if (timestamp - lastFpsTime >= 1000) {
        currentFps = framesThisSecond;
        framesThisSecond = 0;
        lastFpsTime = timestamp;
    }
    framesThisSecond++;

    let dt = (timestamp - lastTime) / 1000;
    if (isNaN(dt) || dt > 0.1) dt = 0.016;
    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

function forceLayEgg(c) {
    if (c.dead) return;
    if (c.squishTimer <= 0) c.squishTimer = 0.3;
    c.jumpTimer = 0.5;
    layEgg(c.x, c.y, c.direction);

    playRandomCok();

    c.eggTimer = 10 - Math.min(4, (state.dietLevel || 0));
    c.eggCount++;
    let eggCap = state.batchLevel === 2 ? 8 : (state.batchLevel === 1 ? 4 : 2);
    if (c.eggCount >= eggCap) {
        c.action = c.nextTrough;
        c.nextTrough = (c.nextTrough === 'goToFood') ? 'goToWater' : 'goToFood';
    }
}

function drawUIIcons() {
    let cp = document.getElementById('ui-chicken-icon');
    if (cp) {
        let cx = cp.getContext('2d');
        cx.translate(20, 26);
        cx.scale(1.2, 1.2);
        renderChicken(cx, { x: 0, y: 0, velX: 0, velY: 0, direction: 1, color: '#ffffff', squishTimer: 0, isGrey: false });
        cx.setTransform(1, 0, 0, 1, 0, 0);
    }
}

// CrazyGames SDK Initialization, Cloud Save & Tracking
window.isCrazyGamesInitialized = false;

function triggerMidgameAd(subtitleText) {
    window.isAdPaused = true;
    let overlay = document.getElementById('ad-overlay');
    let title = document.getElementById('ad-title');
    let subtitle = document.getElementById('ad-subtitle');
    
    if(!overlay) return;
    
    if (!bgmTheme.paused) bgmTheme.pause();
    
    overlay.style.display = 'flex';
    subtitle.innerText = subtitleText;
    
    let countdown = 3;
    title.innerText = countdown + "...";
    
    let interval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            title.innerText = countdown + "...";
        } else {
            clearInterval(interval);
            overlay.style.display = 'none';
            
            const callbacks = {
                adFinished: () => { 
                    window.isAdPaused = false; 
                    updateBGM();
                },
                adError: (error) => { 
                    window.isAdPaused = false; 
                    console.warn("CrazyGames Ad error", error); 
                    updateBGM();
                },
                adStarted: () => { console.log("CrazyGames Ad started"); }
            };
            
            if (window.CrazyGames && window.CrazyGames.SDK) {
                try {
                    window.CrazyGames.SDK.ad.requestAd('midgame', callbacks);
                } catch (e) {
                    callbacks.adError(e);
                }
            } else {
                window.isAdPaused = false;
                updateBGM();
            }
        }
    }, 1000);
}

if (GAME_MARKET === "crazygames" && window.CrazyGames) {
    window.CrazyGames.SDK.init().then(async () => {
        window.isCrazyGamesInitialized = true;
        try {
            window.CrazyGames.SDK.game.loadingStart();
            let cloudSave = await window.CrazyGames.SDK.data.getItem('chickenIdleSave');
            if (cloudSave && cloudSave !== 'null' && cloudSave !== 'undefined') {
                localStorage.setItem('chickenIdleSave', cloudSave);
            }
        } catch (e) {
            console.warn("CrazyGames Data Module Fallback (Local/Itch.io):", e);
        }

        loadState();
        drawUIIcons();
        updateUI();

        try {
            window.CrazyGames.SDK.game.loadingStop();
            window.CrazyGames.SDK.game.gameplayStart();
        } catch (e) { }

        let __loader = document.getElementById('loading-screen');
        if (__loader) __loader.style.display = 'none';
        requestAnimationFrame(loop);
    }).catch(err => {
        console.warn("CrazyGames SDK Offline/Itchio Fallback:", err);
        loadState();
        drawUIIcons();
        updateUI();
        let __loader = document.getElementById('loading-screen');
        if (__loader) __loader.style.display = 'none';
        requestAnimationFrame(loop);
    });
} else {
    loadState();
    drawUIIcons();
    updateUI();
    let __loader = document.getElementById('loading-screen');
    if (__loader) __loader.style.display = 'none';
    requestAnimationFrame(loop);
}

// Info Toggle Logic
window.infoMode = window.infoMode || false;

document.querySelectorAll('.shop-btn').forEach(btn => {
    let title = btn.getAttribute('data-title') || btn.getAttribute('title');
    if (title) {
        let descDiv = document.createElement('div');
        descDiv.className = 'shop-desc-text';
        descDiv.innerHTML = title;
        descDiv.style.display = 'none';
        descDiv.style.flexBasis = '100%';
        descDiv.style.fontSize = '7px';
        descDiv.style.color = '#795548'; // Lighter brown
        descDiv.style.lineHeight = '1.4';
        descDiv.style.marginTop = '6px';
        descDiv.style.paddingTop = '6px';
        descDiv.style.borderTop = '1px dashed rgba(121, 85, 72, 0.4)';
        descDiv.style.textAlign = 'left';
        descDiv.style.whiteSpace = 'normal';
        descDiv.style.pointerEvents = 'none';
        btn.appendChild(descDiv);
    }
});

let infoBtn = document.getElementById('toggle-info-btn');
if (infoBtn) {
    infoBtn.addEventListener('click', () => {
        window.infoMode = !window.infoMode;

        if (window.infoMode) {
            infoBtn.style.background = '#e74c3c';
            infoBtn.style.color = 'white';
            infoBtn.style.borderColor = '#fff #d35400 #d35400 #fff';
        } else {
            infoBtn.style.background = '';
            infoBtn.style.color = '';
            infoBtn.style.borderColor = '';
        }

        if (gameTooltip) gameTooltip.style.display = 'none';
        updateUI(); // Immediately reflect info mode changes
    });
}

// Mute Button (HTML header)
const muteBtn = document.getElementById('mute-btn');
if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        window.isMusicMuted = !window.isMusicMuted;
        localStorage.setItem('chickenIdleMuted', window.isMusicMuted);
        updateBGM();
        if (window.isMusicMuted) {
            muteBtn.style.background = '#e74c3c';
            muteBtn.style.borderColor = '#fff #c0392b #c0392b #fff';
            muteBtn.style.opacity = '1';
        } else {
            muteBtn.style.background = '';
            muteBtn.style.borderColor = '';
            muteBtn.style.opacity = '1';
        }
    });
}

// Custom Tooltip Logic
const gameTooltip = document.getElementById('game-tooltip');
if (gameTooltip) {
    document.querySelectorAll('.shop-btn, .pixel-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            if (window.infoMode && btn.classList.contains('shop-btn')) {
                gameTooltip.style.display = 'none';
                return;
            }
            const title = btn.getAttribute('data-title') || btn.getAttribute('title');
            if (title) {
                gameTooltip.innerHTML = title;
                gameTooltip.style.display = 'block';
                let x = e.pageX + 15;
                let y = e.pageY + 15;
                if (x + gameTooltip.offsetWidth > window.innerWidth) {
                    x = window.innerWidth - gameTooltip.offsetWidth - 10;
                }
                if (y + gameTooltip.offsetHeight > window.innerHeight) {
                    y = window.innerHeight - gameTooltip.offsetHeight - 10;
                }
                gameTooltip.style.left = x + 'px';
                gameTooltip.style.top = y + 'px';
            }
        });
        btn.addEventListener('mouseleave', () => {
            gameTooltip.style.display = 'none';
        });
    });
}

// Logic for Steam Wishlist Button
const steamWishlistBtn = document.getElementById('steam-btn');
if (steamWishlistBtn && (GAME_MARKET === "itchio" || GAME_MARKET === "galaxy")) {
    steamWishlistBtn.href = `https://store.steampowered.com/app/4563810/The_MachinEGG/?utm_source=G1_${GAME_MARKET.toUpperCase()}`;
    steamWishlistBtn.style.display = 'block';
}
