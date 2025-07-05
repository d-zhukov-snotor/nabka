// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const benchMusic = document.getElementById('benchMusic');
const friendMusic = document.getElementById('friendMusic');
const resetBtn = document.getElementById('resetBtn');
const muteBtn = document.getElementById('muteBtn');

// Set canvas to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let gameState = {
    player: { x: canvas.width * 0.15, y: canvas.height * 0.7, size: 16, moving: false },
    target: { x: canvas.width * 0.15, y: canvas.height * 0.7 },
    isSitting: false,
    isSmoking: false,
    smokingTimer: 0,
    benchMusicPlaying: false,
    friendMusicPlaying: false,
    muted: false,
    stars: [],
    shootingStar: {
        x: 0,
        y: 0,
        active: false,
        trail: [],
        timer: 0
    },
    dogs: [],
    hooligans: [],
    friend: null,
    showCallFriendButton: false,
    friendCalled: false,
    benchTimer: 0
};

// Game loop control
let gameLoopRunning = false;
let animationId = null;
let shouldReset = false;

// Create stars
function createStars() {
    gameState.stars = [];
    for (let i = 0; i < 100; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.6,
            size: Math.random() * 2 + 1,
            twinkle: Math.random() * Math.PI * 2
        });
    }
}

// Create dogs and hooligans
function createEnemies() {
    gameState.dogs = [];
    gameState.hooligans = [];
    
    // Create 3 dogs
    for (let i = 0; i < 3; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
            y = Math.random() * canvas.height * 0.4 + canvas.height * 0.3;
        } while (!isWalkable(x, y));
        
        gameState.dogs.push({
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            size: Math.max(canvas.width * 0.015, 12),
            speed: 1.5, // Fixed speed
            moveTimer: 0,
            sleeping: false
        });
    }
    
    // Create 2 hooligans
    for (let i = 0; i < 2; i++) {
        let x, y;
        do {
            x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
            y = Math.random() * canvas.height * 0.4 + canvas.height * 0.3;
        } while (!isWalkable(x, y));
        
        gameState.hooligans.push({
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            size: Math.max(canvas.width * 0.018, 14),
            speed: 1.0, // Fixed speed
            moveTimer: 0,
            sleeping: false
        });
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createStars();
    updateMapAreas();
});

// Map areas (based on your image description) - will be updated in updateMapAreas()
let mapAreas = {};

// Update map areas based on screen size
function updateMapAreas() {
    mapAreas = {
        // Metro starting area (green)
        metro: { 
            x: canvas.width * 0.05, 
            y: canvas.height * 0.6, 
            width: canvas.width * 0.12, 
            height: canvas.height * 0.15 
        },
        
        // Walkable area (red polygon - simplified as rectangles)
        walkable: [
            { 
                x: canvas.width * 0.05, 
                y: canvas.height * 0.35, 
                width: canvas.width * 0.85, 
                height: canvas.height * 0.5 
            },
            { 
                x: canvas.width * 0.2, 
                y: canvas.height * 0.15, 
                width: canvas.width * 0.6, 
                height: canvas.height * 0.2 
            }
        ],
        
        // Bench area (yellow)
        bench: { 
            x: canvas.width * 0.7, 
            y: canvas.height * 0.2, 
            width: canvas.width * 0.08, 
            height: canvas.height * 0.06 
        },
        
        // Buildings (obstacles that create a labyrinth)
        buildings: [
            // Left side buildings
            { x: canvas.width * 0.25, y: canvas.height * 0.4, width: canvas.width * 0.08, height: canvas.height * 0.25 },
            { x: canvas.width * 0.25, y: canvas.height * 0.7, width: canvas.width * 0.15, height: canvas.height * 0.08 },
            
            // Center buildings creating maze paths
            { x: canvas.width * 0.45, y: canvas.height * 0.45, width: canvas.width * 0.1, height: canvas.height * 0.15 },
            { x: canvas.width * 0.45, y: canvas.height * 0.65, width: canvas.width * 0.1, height: canvas.height * 0.1 },
            
            // Right side buildings
            { x: canvas.width * 0.6, y: canvas.height * 0.4, width: canvas.width * 0.08, height: canvas.height * 0.2 },
            { x: canvas.width * 0.75, y: canvas.height * 0.45, width: canvas.width * 0.1, height: canvas.height * 0.15 },
            
            // Upper area buildings
            { x: canvas.width * 0.3, y: canvas.height * 0.2, width: canvas.width * 0.12, height: canvas.height * 0.08 },
            { x: canvas.width * 0.5, y: canvas.height * 0.15, width: canvas.width * 0.08, height: canvas.height * 0.12 },
            
            // Additional maze elements
            { x: canvas.width * 0.15, y: canvas.height * 0.5, width: canvas.width * 0.06, height: canvas.height * 0.08 },
            { x: canvas.width * 0.35, y: canvas.height * 0.6, width: canvas.width * 0.06, height: canvas.width * 0.04 },
            { x: canvas.width * 0.65, y: canvas.height * 0.65, width: canvas.width * 0.06, height: canvas.height * 0.08 }
        ]
    };
}

// Initialize game
function init() {
    // Stop any existing game loop
    gameLoopRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Reset flags
    shouldReset = false;
    
    // Setup map areas and stars
    updateMapAreas();
    createStars();
    createEnemies();
    
    // Reset game state
    gameState.player.x = canvas.width * 0.15;
    gameState.player.y = canvas.height * 0.7;
    gameState.target.x = canvas.width * 0.15;
    gameState.target.y = canvas.height * 0.7;
    gameState.isSitting = false;
    gameState.isSmoking = false;
    gameState.smokingTimer = 0;
    gameState.benchMusicPlaying = false;
    gameState.friendMusicPlaying = false;
    
    // Initialize shooting star
    gameState.shootingStar = {
        x: 0,
        y: 0,
        active: false,
        trail: [],
        timer: 0
    };
    
    // Wake up all enemies
    gameState.dogs.forEach(dog => dog.sleeping = false);
    gameState.hooligans.forEach(hooligan => hooligan.sleeping = false);
    
    // Reset friend state
    gameState.friend = null;
    gameState.showCallFriendButton = false;
    gameState.friendCalled = false;
    gameState.benchTimer = 0;
    
    // Stop both music tracks
    if (benchMusic.contentWindow) {
        benchMusic.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
    }
    if (friendMusic.contentWindow) {
        friendMusic.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
    }
    
    // Start game loop
    gameLoopRunning = true;
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameLoopRunning) return; // Stop if game loop should not be running
    
    // Check if we need to reset
    if (shouldReset) {
        shouldReset = false;
        init();
        return;
    }
    
    update();
    render();
    animationId = requestAnimationFrame(gameLoop);
}

// Update game logic
function update() {
    // Update shooting star
    updateShootingStar();
    
    // Update enemies
    updateEnemies();
    
    // Update friend
    updateFriend();
    
    // Check collisions with enemies
    if (!gameState.isSitting) {
        if (checkEnemyCollisions()) {
            shouldReset = true; // Flag for reset instead of calling init() directly
            return;
        }
    }
    
    if (!gameState.isSitting) {
        // Move player towards target
        const dx = gameState.target.x - gameState.player.x;
        const dy = gameState.target.y - gameState.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            const speed = Math.max(canvas.width * 0.003, 3);
            gameState.player.x += (dx / distance) * speed;
            gameState.player.y += (dy / distance) * speed;
            gameState.player.moving = true;
        } else {
            gameState.player.moving = false;
        }
        
        // Check if player reached the bench
        if (isPlayerAtBench()) {
            gameState.isSitting = true;
            gameState.isSmoking = true;
            gameState.smokingTimer = 0;
            gameState.benchTimer = 0; // Start bench timer
            
            // Make all enemies fall asleep
            gameState.dogs.forEach(dog => dog.sleeping = true);
            gameState.hooligans.forEach(hooligan => hooligan.sleeping = true);
            
            // Start bench music
            if (!gameState.benchMusicPlaying && !gameState.muted) {
                if (benchMusic.contentWindow) {
                    benchMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
                gameState.benchMusicPlaying = true;
            }
        }
    } else {
        // Update smoking animation
        gameState.smokingTimer += 1;
        
        // Update bench timer and show call friend button after 5 seconds (300 frames at 60fps)
        if (gameState.benchTimer < 4000) {
            gameState.benchTimer += 1;
            if (gameState.benchTimer >= 4000 && !gameState.friendCalled) {
                gameState.showCallFriendButton = true;
            }
        }
    }
}

// Check if player is at the bench
function isPlayerAtBench() {
    const player = gameState.player;
    const bench = mapAreas.bench;
    const proximity = Math.max(canvas.width * 0.03, 30);
    
    return player.x >= bench.x - proximity && 
           player.x <= bench.x + bench.width + proximity &&
           player.y >= bench.y - proximity && 
           player.y <= bench.y + bench.height + proximity;
}

// Check if position is walkable
function isWalkable(x, y) {
    // Check if position is in walkable areas
    let inWalkableArea = false;
    for (let area of mapAreas.walkable) {
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            inWalkableArea = true;
            break;
        }
    }
    
    if (!inWalkableArea) return false;
    
    // Check if position collides with buildings
    const playerSize = Math.max(canvas.width * 0.02, 16);
    for (let building of mapAreas.buildings) {
        if (x - playerSize/2 < building.x + building.width &&
            x + playerSize/2 > building.x &&
            y - playerSize/2 < building.y + building.height &&
            y + playerSize/2 > building.y) {
            return false; // Collision with building
        }
    }
    
    return true;
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw night sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a20');
    gradient.addColorStop(0.3, '#1a1a3e');
    gradient.addColorStop(1, '#2a2a5a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    drawStars();

    
    // Draw shooting star
    if (gameState.shootingStar.active) {
        drawShootingStar();
    }
    
    // Draw walkable areas (dark gray)
    ctx.fillStyle = '#2a2a40';
    for (let area of mapAreas.walkable) {
        ctx.fillRect(area.x, area.y, area.width, area.height);
    }
    
    // Draw buildings (dark brown/gray with details)
    for (let building of mapAreas.buildings) {
        // Main building structure
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(building.x, building.y, building.width, building.height);
        
        // Building outline
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 2;
        ctx.strokeRect(building.x, building.y, building.width, building.height);
        
        // Add windows (small rectangles)
        // ctx.fillStyle = '#ffff88';
        const windowSize = Math.max(building.width * 0.15, 4);
        const windowSpacing = windowSize * 2;
        
        for (let wx = building.x + windowSpacing; wx < building.x + building.width - windowSize; wx += windowSpacing) {
            for (let wy = building.y + windowSpacing; wy < building.y + building.height - windowSize; wy += windowSpacing) {
                // Random chance for lit windows
                if (Math.random() > 0.3) {
                    ctx.fillRect(wx, wy, windowSize, windowSize);
                }
            }
        }
    }
    
    // Draw metro area (dark green)
    ctx.fillStyle = '#1a3a1a';
    const metro = mapAreas.metro;
    ctx.fillRect(metro.x, metro.y, metro.width, metro.height);
    
    // Draw metro symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = Math.floor(canvas.width * 0.025) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mетро', metro.x + metro.width/2, metro.y + metro.height/2 + 7);
    
    // Draw bench (yellow)
    ctx.fillStyle = '#ffd700';
    const bench = mapAreas.bench;
    ctx.fillRect(bench.x, bench.y, bench.width, bench.height);
    
    // Draw bench details
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(bench.x + bench.width * 0.1, bench.y + bench.height * 0.1, bench.width * 0.8, bench.height * 0.2);
    ctx.fillRect(bench.x + bench.width * 0.1, bench.y + bench.height * 0.6, bench.width * 0.8, bench.height * 0.2);
    
    // Draw player
    drawPlayer();
    
    // Draw friend
    if (gameState.friend) {
        drawFriend();
    }
    
    // Draw enemies
    drawEnemies();
    
    // Draw smoking effect
    if (gameState.isSmoking) {
        drawSmoke();
    }
    
    // Draw UI
    drawUI();
}

// Draw animated stars
function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let star of gameState.stars) {
        star.twinkle += 0.02;
        const opacity = (Math.sin(star.twinkle) + 1) * 0.5;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Update shooting star logic
function updateShootingStar() {
    if (!gameState.shootingStar.active) {
        // Random chance to spawn shooting star
        if (Math.random() < 0.002) {
            gameState.shootingStar.active = true;
            gameState.shootingStar.x = Math.random() * canvas.width;
            gameState.shootingStar.y = Math.random() * canvas.height * 0.3;
            gameState.shootingStar.trail = [];
            gameState.shootingStar.timer = 0;
        }
    } else {
        // Move shooting star
        gameState.shootingStar.x += canvas.width * 0.008;
        gameState.shootingStar.y += canvas.height * 0.004;
        gameState.shootingStar.timer++;
        
        // Add to trail
        gameState.shootingStar.trail.push({
            x: gameState.shootingStar.x,
            y: gameState.shootingStar.y,
            age: 0
        });
        
        // Age trail points
        gameState.shootingStar.trail = gameState.shootingStar.trail.filter(point => {
            point.age++;
            return point.age < 20;
        });
        
        // Deactivate if off screen or timer exceeded
        if (gameState.shootingStar.x > canvas.width + 100 || 
            gameState.shootingStar.y > canvas.height + 100 ||
            gameState.shootingStar.timer > 180) {
            gameState.shootingStar.active = false;
        }
    }
}

// Draw shooting star
function drawShootingStar() {
    const star = gameState.shootingStar;
    
    ctx.save();
    
    // Draw trail
    for (let i = 0; i < star.trail.length; i++) {
        const point = star.trail[i];
        const opacity = (1 - point.age / 20) * 0.8;
        const size = (1 - point.age / 20) * 3;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw main star
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw player character
function drawPlayer() {
    const player = gameState.player;
    const size = Math.max(canvas.width * 0.02, 16);
    
    // Player body
    ctx.fillStyle = gameState.isSitting ? '#654321' : '#ff6b6b';
    ctx.fillRect(player.x - size/2, player.y - size/2, size, size);
    
    // Player head
    ctx.fillStyle = '#ffdbac';
    const headSize = size * 0.75;
    ctx.fillRect(player.x - headSize/2, player.y - size/2 - headSize/2, headSize, headSize);
    
    // Player eyes
    ctx.fillStyle = '#000000';
    const eyeSize = size * 0.125;
    ctx.fillRect(player.x - size/4, player.y - size/2 - eyeSize, eyeSize, eyeSize);
    ctx.fillRect(player.x + size/8, player.y - size/2 - eyeSize, eyeSize, eyeSize);
    
    // If sitting, draw differently
    if (gameState.isSitting) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(player.x - size/2, player.y + size/4, size, size/2);
    }
}

// Draw friend character
function drawFriend() {
    const friend = gameState.friend;
    const size = Math.max(canvas.width * 0.02, 16);
    
    // Friend body (different color)
    ctx.fillStyle = '#4169E1'; // Royal blue
    ctx.fillRect(friend.x - size/2, friend.y - size/2, size, size);
    
    // Friend head
    ctx.fillStyle = '#ffdbac';
    const headSize = size * 0.75;
    ctx.fillRect(friend.x - headSize/2, friend.y - size/2 - headSize/2, headSize, headSize);
    
    // Friend eyes
    ctx.fillStyle = '#000000';
    const eyeSize = size * 0.125;
    ctx.fillRect(friend.x - size/4, friend.y - size/2 - eyeSize, eyeSize, eyeSize);
    ctx.fillRect(friend.x + size/8, friend.y - size/2 - eyeSize, eyeSize, eyeSize);
    
    // Draw friend smoking effect if smoking
    if (friend.isSmoking) {
        drawFriendSmoke();
    }
}

// Draw friend smoke effect
function drawFriendSmoke() {
    const friend = gameState.friend;
    const time = friend.smokingTimer;
    const smokeScale = Math.max(canvas.width * 0.01, 8);
    
    ctx.fillStyle = `rgba(200, 200, 200, ${0.6 + 0.2 * Math.sin(time * 0.1)})`;
    
    // Draw multiple smoke particles
    for (let i = 0; i < 5; i++) {
        const offsetX = Math.sin(time * 0.05 + i) * smokeScale;
        const offsetY = -smokeScale * 2.5 - i * smokeScale - Math.sin(time * 0.08 + i) * smokeScale * 0.6;
        const size = smokeScale * 0.5 + Math.sin(time * 0.1 + i) * smokeScale * 0.25;
        
        ctx.beginPath();
        ctx.arc(friend.x + offsetX, friend.y + offsetY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw smoke effect
function drawSmoke() {
    const player = gameState.player;
    const time = gameState.smokingTimer;
    const smokeScale = Math.max(canvas.width * 0.01, 8);
    
    ctx.fillStyle = `rgba(200, 200, 200, ${0.6 + 0.2 * Math.sin(time * 0.1)})`;
    
    // Draw multiple smoke particles
    for (let i = 0; i < 5; i++) {
        const offsetX = Math.sin(time * 0.05 + i) * smokeScale;
        const offsetY = -smokeScale * 2.5 - i * smokeScale - Math.sin(time * 0.08 + i) * smokeScale * 0.6;
        const size = smokeScale * 0.5 + Math.sin(time * 0.1 + i) * smokeScale * 0.25;
        
        ctx.beginPath();
        ctx.arc(player.x + offsetX, player.y + offsetY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw UI elements
function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = Math.floor(canvas.width * 0.02) + 'px Arial';
    ctx.textAlign = 'left';
    
    if (gameState.isSitting) {
        ctx.fillText('🚬 Брат чилит у реки...', 20, 40);
        if (gameState.musicPlaying) {
            ctx.fillText('🎵 Лейзи саунд', 20, 70);
        }
    } else {
        ctx.fillText('Пройди от метро до набки', 20, 40);
    }
    
    // Draw entity list (ENT style)
    const entityStartY = gameState.isSitting ? (gameState.musicPlaying ? 100 : 100) : 70;
    
    // Draw dog icon and label
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(20, entityStartY, 12, 8); // Dog body
    ctx.fillStyle = '#A0522D';
    ctx.fillRect(20, entityStartY - 6, 8, 8); // Dog head
    ctx.fillStyle = '#654321';
    ctx.fillRect(18, entityStartY - 6, 2, 4); // Left ear
    ctx.fillRect(28, entityStartY - 6, 2, 4); // Right ear
    ctx.fillStyle = '#000000';
    ctx.fillRect(22, entityStartY - 4, 1, 1); // Left eye
    ctx.fillRect(25, entityStartY - 4, 1, 1); // Right eye
    ctx.fillRect(23, entityStartY - 2, 2, 1); // Nose
    
    // Dog label
    ctx.fillStyle = '#ffffff';
    ctx.font = Math.floor(canvas.width * 0.015) + 'px Arial';
    ctx.fillText('- ПЕС', 40, entityStartY + 5);
    
    // Draw hooligan icon and label
    const hooliganY = entityStartY + 25;
    ctx.fillStyle = '#333333';
    ctx.fillRect(20, hooliganY, 12, 12); // Hooligan body
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(22, hooliganY - 8, 8, 8); // Hooligan head
    ctx.fillStyle = '#000000';
    ctx.fillRect(20, hooliganY - 10, 12, 3); // Hooligan cap
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(24, hooliganY - 6, 1, 1); // Left eye
    ctx.fillRect(27, hooliganY - 6, 1, 1); // Right eye
    ctx.fillRect(24, hooliganY - 4, 4, 1); // Angry mouth
    
    // Hooligan label
    ctx.fillStyle = '#ffffff';
    ctx.fillText('- ХУЛИГАН', 40, hooliganY + 5);
    
    // Draw call friend button if sitting and not called yet
    if (gameState.showCallFriendButton && !gameState.friendCalled) {
        const buttonX = canvas.width - 200;
        const buttonY = canvas.height - 100;
        const buttonWidth = 180;
        const buttonHeight = 40;
        
        // Button background
        ctx.fillStyle = 'rgba(74, 144, 226, 0.8)';
        ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = Math.floor(canvas.width * 0.018) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Позвать друга', buttonX + buttonWidth/2, buttonY + buttonHeight/2 + 5);
    }
}

// Handle keyboard controls
document.addEventListener('keydown', (e) => {
    if (gameState.isSitting) return;
    
    const speed = Math.max(canvas.width * 0.01, 10);
    let newX = gameState.player.x;
    let newY = gameState.player.y;
    
    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            newY -= speed;
            break;
        case 's':
        case 'arrowdown':
            newY += speed;
            break;
        case 'a':
        case 'arrowleft':
            newX -= speed;
            break;
        case 'd':
        case 'arrowright':
            newX += speed;
            break;
    }
    
    // Check if new position is walkable
    if (isWalkable(newX, newY)) {
        gameState.target.x = newX;
        gameState.target.y = newY;
    }
});

// Handle mouse clicks for call friend button
canvas.addEventListener('click', (e) => {
    if (gameState.showCallFriendButton && !gameState.friendCalled) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const buttonX = canvas.width - 200;
        const buttonY = canvas.height - 100;
        const buttonWidth = 180;
        const buttonHeight = 40;
        
        // Check if click is on the call friend button
        if (x >= buttonX && x <= buttonX + buttonWidth &&
            y >= buttonY && y <= buttonY + buttonHeight) {
            callFriend();
        }
    }
});

// Button event listeners
resetBtn.addEventListener('click', init);

muteBtn.addEventListener('click', () => {
    gameState.muted = !gameState.muted;
    if (gameState.muted) {
        // Pause both music tracks
        if (benchMusic.contentWindow) {
            benchMusic.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        if (friendMusic.contentWindow) {
            friendMusic.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        gameState.benchMusicPlaying = false;
        gameState.friendMusicPlaying = false;
        muteBtn.textContent = 'Unmute';
    } else {
        muteBtn.textContent = 'Mute';
        if (gameState.isSitting) {
            if (gameState.friend && gameState.friend.isSmoking) {
                // Friend is smoking, play friend music
                if (friendMusic.contentWindow) {
                    friendMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
                gameState.friendMusicPlaying = true;
            } else {
                // Just sitting, play bench music
                if (benchMusic.contentWindow) {
                    benchMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
                gameState.benchMusicPlaying = true;
            }
        }
    }
});

// Start the game
gameLoopRunning = true;
init();

// Update enemies movement
function updateEnemies() {
    // Update dogs
    gameState.dogs.forEach(dog => {
        if (dog.sleeping) return;
        
        dog.moveTimer++;
        
        // Move towards target
        const dx = dog.targetX - dog.x;
        const dy = dog.targetY - dog.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            const newX = dog.x + (dx / distance) * dog.speed;
            const newY = dog.y + (dy / distance) * dog.speed;
            
            // Check if new position is walkable
            if (isWalkable(newX, newY)) {
                dog.x = newX;
                dog.y = newY;
            } else {
                // If blocked, immediately pick a new target in a different direction
                let newTargetX, newTargetY;
                let attempts = 0;
                do {
                    // Try targets in different directions from current position
                    const angle = Math.random() * Math.PI * 2;
                    const targetDistance = 50 + Math.random() * 100;
                    newTargetX = dog.x + Math.cos(angle) * targetDistance;
                    newTargetY = dog.y + Math.sin(angle) * targetDistance;
                    
                    // Keep within bounds
                    newTargetX = Math.max(canvas.width * 0.1, Math.min(canvas.width * 0.9, newTargetX));
                    newTargetY = Math.max(canvas.height * 0.3, Math.min(canvas.height * 0.8, newTargetY));
                    
                    attempts++;
                } while (!isWalkable(newTargetX, newTargetY) && attempts < 20);
                
                if (attempts < 20) {
                    dog.targetX = newTargetX;
                    dog.targetY = newTargetY;
                }
                dog.moveTimer = 0;
            }
        } else {
            // Pick new random target every 120 frames (2 seconds at 60fps)
            if (dog.moveTimer > 120) {
                let newX, newY;
                let attempts = 0;
                do {
                    newX = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
                    newY = Math.random() * canvas.height * 0.4 + canvas.height * 0.3;
                    attempts++;
                } while (!isWalkable(newX, newY) && attempts < 10);
                
                if (attempts < 10) {
                    dog.targetX = newX;
                    dog.targetY = newY;
                }
                dog.moveTimer = 0;
            }
        }
    });
    
    // Update hooligans
    gameState.hooligans.forEach(hooligan => {
        if (hooligan.sleeping) return;
        
        hooligan.moveTimer++;
        
        // Move towards target
        const dx = hooligan.targetX - hooligan.x;
        const dy = hooligan.targetY - hooligan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            const newX = hooligan.x + (dx / distance) * hooligan.speed;
            const newY = hooligan.y + (dy / distance) * hooligan.speed;
            
            // Check if new position is walkable
            if (isWalkable(newX, newY)) {
                hooligan.x = newX;
                hooligan.y = newY;
            } else {
                // If blocked, immediately pick a new target in a different direction
                let newTargetX, newTargetY;
                let attempts = 0;
                do {
                    // Try targets in different directions from current position
                    const angle = Math.random() * Math.PI * 2;
                    const targetDistance = 50 + Math.random() * 100;
                    newTargetX = hooligan.x + Math.cos(angle) * targetDistance;
                    newTargetY = hooligan.y + Math.sin(angle) * targetDistance;
                    
                    // Keep within bounds
                    newTargetX = Math.max(canvas.width * 0.1, Math.min(canvas.width * 0.9, newTargetX));
                    newTargetY = Math.max(canvas.height * 0.3, Math.min(canvas.height * 0.8, newTargetY));
                    
                    attempts++;
                } while (!isWalkable(newTargetX, newTargetY) && attempts < 20);
                
                if (attempts < 20) {
                    hooligan.targetX = newTargetX;
                    hooligan.targetY = newTargetY;
                }
                hooligan.moveTimer = 0;
            }
        } else {
            // Pick new random target every 180 frames (3 seconds at 60fps)
            if (hooligan.moveTimer > 180) {
                let newX, newY;
                let attempts = 0;
                do {
                    newX = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
                    newY = Math.random() * canvas.height * 0.4 + canvas.height * 0.3;
                    attempts++;
                } while (!isWalkable(newX, newY) && attempts < 10);
                
                if (attempts < 10) {
                    hooligan.targetX = newX;
                    hooligan.targetY = newY;
                }
                hooligan.moveTimer = 0;
            }
        }
    });
}

// Check collisions with enemies
function checkEnemyCollisions() {
    const playerSize = Math.max(canvas.width * 0.02, 16);
    
    // Check dog collisions
    for (let dog of gameState.dogs) {
        if (dog.sleeping) continue;
        
        const dx = gameState.player.x - dog.x;
        const dy = gameState.player.y - dog.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (playerSize + dog.size) / 2) {
            return true; // Collision detected
        }
    }
    
    // Check hooligan collisions
    for (let hooligan of gameState.hooligans) {
        if (hooligan.sleeping) continue;
        
        const dx = gameState.player.x - hooligan.x;
        const dy = gameState.player.y - hooligan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (playerSize + hooligan.size) / 2) {
            return true; // Collision detected
        }
    }
    
    return false;
}

// Draw enemies
function drawEnemies() {
    // Draw dogs
    gameState.dogs.forEach(dog => {
        const x = dog.x;
        const y = dog.y;
        const size = dog.size;
        
        if (dog.sleeping) {
            // Draw sleeping dog (lying down)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - size/2, y - size/3, size, size/2);
            
            // Draw dog head
            ctx.fillStyle = '#A0522D';
            const headSize = size * 0.6;
            ctx.fillRect(x - headSize/2, y - size/2, headSize, headSize);
            
            // Draw dog ears
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - headSize/2 - 2, y - size/2, 4, headSize/2);
            ctx.fillRect(x + headSize/2 - 2, y - size/2, 4, headSize/2);
            
            // Draw dog nose
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - 1, y - size/6, 2, 2);
            
            // Draw "ZZZ" above sleeping dog
            ctx.fillStyle = '#ffffff';
            ctx.font = Math.floor(size * 0.8) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ZZZ', x, y - size);
        } else {
            // Draw dog body (brown)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - size/2, y - size/3, size, size/2);
            
            // Draw dog head
            ctx.fillStyle = '#A0522D';
            const headSize = size * 0.6;
            ctx.fillRect(x - headSize/2, y - size/2, headSize, headSize);
            
            // Draw dog ears
            ctx.fillStyle = '#654321';
            ctx.fillRect(x - headSize/2 - 2, y - size/2, 4, headSize/2);
            ctx.fillRect(x + headSize/2 - 2, y - size/2, 4, headSize/2);
            
            // Draw dog eyes
            ctx.fillStyle = '#000000';
            const eyeSize = size * 0.1;
            ctx.fillRect(x - size/4, y - size/3, eyeSize, eyeSize);
            ctx.fillRect(x + size/6, y - size/3, eyeSize, eyeSize);
            
            // Draw dog nose
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - 1, y - size/6, 2, 2);
        }
    });
    
    // Draw hooligans
    gameState.hooligans.forEach(hooligan => {
        const x = hooligan.x;
        const y = hooligan.y;
        const size = hooligan.size;
        
        if (hooligan.sleeping) {
            ctx.fillStyle = '#333333';
            ctx.fillRect(x - size/2, y - size/2, size, size);
            
            // Draw hooligan head
            ctx.fillStyle = '#ffdbac';
            const headSize = size * 0.75;
            ctx.fillRect(x - headSize/2, y - size/2 - headSize/2, headSize, headSize);
            
            // Draw hooligan cap
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - headSize/2 - 2, y - size/2 - headSize/2 - 3, headSize + 4, headSize/3);
            
            // Draw angry mouth
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x - size/4, y - size/4, size/2, 2);
            
            // Draw "ZZZ" above sleeping hooligan
            ctx.fillStyle = '#ffffff';
            ctx.font = Math.floor(size * 0.8) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ZZZ', x, y - size);
        } else {
            // Draw hooligan body (dark clothes)
            ctx.fillStyle = '#333333';
            ctx.fillRect(x - size/2, y - size/2, size, size);
            
            // Draw hooligan head
            ctx.fillStyle = '#ffdbac';
            const headSize = size * 0.75;
            ctx.fillRect(x - headSize/2, y - size/2 - headSize/2, headSize, headSize);
            
            // Draw hooligan cap
            ctx.fillStyle = '#000000';
            ctx.fillRect(x - headSize/2 - 2, y - size/2 - headSize/2 - 3, headSize + 4, headSize/3);
            
            // Draw hooligan eyes (angry)
            ctx.fillStyle = '#ff0000';
            const eyeSize = size * 0.125;
            ctx.fillRect(x - size/4, y - size/2 - eyeSize, eyeSize, eyeSize);
            ctx.fillRect(x + size/8, y - size/2 - eyeSize, eyeSize, eyeSize);
            
            // Draw angry mouth
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(x - size/4, y - size/4, size/2, 2);
        }
    });
}

// Update friend
function updateFriend() {
    if (!gameState.friend) return;
    
    // Move friend towards player
    const dx = gameState.player.x - gameState.friend.x;
    const dy = gameState.player.y - gameState.friend.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 30) { // Stop when close to player
        // Try different movement strategies
        let moved = false;
        
        // Strategy 1: Direct movement towards player
        const directX = gameState.friend.x + (dx / distance) * gameState.friend.speed;
        const directY = gameState.friend.y + (dy / distance) * gameState.friend.speed;
        
        if (isWalkable(directX, directY)) {
            gameState.friend.x = directX;
            gameState.friend.y = directY;
            moved = true;
        } else {
            // Strategy 2: Try moving in 8 directions around current position
            const directions = [
                { x: gameState.friend.speed, y: 0 },           // Right
                { x: -gameState.friend.speed, y: 0 },          // Left
                { x: 0, y: gameState.friend.speed },           // Down
                { x: 0, y: -gameState.friend.speed },          // Up
                { x: gameState.friend.speed * 0.7, y: gameState.friend.speed * 0.7 },     // Down-right
                { x: -gameState.friend.speed * 0.7, y: gameState.friend.speed * 0.7 },    // Down-left
                { x: gameState.friend.speed * 0.7, y: -gameState.friend.speed * 0.7 },    // Up-right
                { x: -gameState.friend.speed * 0.7, y: -gameState.friend.speed * 0.7 }    // Up-left
            ];
            
            // Sort directions by how much they move towards the player
            directions.sort((a, b) => {
                const aDot = a.x * (dx / distance) + a.y * (dy / distance);
                const bDot = b.x * (dx / distance) + b.y * (dy / distance);
                return bDot - aDot; // Higher dot product = more towards player
            });
            
            // Try each direction in order of preference
            for (let dir of directions) {
                const testX = gameState.friend.x + dir.x;
                const testY = gameState.friend.y + dir.y;
                
                if (isWalkable(testX, testY)) {
                    gameState.friend.x = testX;
                    gameState.friend.y = testY;
                    moved = true;
                    break;
                }
            }
        }
        
        // Strategy 3: If still stuck, try random movement
        if (!moved) {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const testX = gameState.friend.x + Math.cos(angle) * gameState.friend.speed;
                const testY = gameState.friend.y + Math.sin(angle) * gameState.friend.speed;
                
                if (isWalkable(testX, testY)) {
                    gameState.friend.x = testX;
                    gameState.friend.y = testY;
                    break;
                }
            }
        }
    } else {
        // Friend reached player, start smoking
        if (!gameState.friend.isSmoking) {
            gameState.friend.isSmoking = true;
            gameState.friend.smokingTimer = 0;
            
            // Stop bench music and start friend music
            if (gameState.benchMusicPlaying && !gameState.muted) {
                if (benchMusic.contentWindow) {
                    benchMusic.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                }
                gameState.benchMusicPlaying = false;
            }
            
            if (!gameState.friendMusicPlaying && !gameState.muted) {
                if (friendMusic.contentWindow) {
                    friendMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
                gameState.friendMusicPlaying = true;
            }
        } else {
            gameState.friend.smokingTimer += 1;
        }
    }
}

// Call friend function
function callFriend() {
    gameState.friendCalled = true;
    
    // Create friend in random walkable position
    let friendX, friendY;
    let attempts = 0;
    do {
        friendX = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
        friendY = Math.random() * canvas.height * 0.4 + canvas.height * 0.3;
        attempts++;
    } while (!isWalkable(friendX, friendY) && attempts < 50);
    
    if (attempts < 50) {
        gameState.friend = {
            x: friendX,
            y: friendY,
            speed: 2,
            isSmoking: false,
            smokingTimer: 0
        };
    }
}