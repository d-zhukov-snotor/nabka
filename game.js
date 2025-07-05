// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameMusic = document.getElementById('gameMusic');
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
    musicPlaying: false,
    muted: false,
    stars: []
};

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
        
        // River area (blue)
        river: { 
            x: 0, 
            y: 0, 
            width: canvas.width, 
            height: canvas.height * 0.2 
        }
    };
}

// Initialize game
function init() {
    // Setup map areas and stars
    updateMapAreas();
    createStars();
    
    // Reset game state
    gameState.player.x = canvas.width * 0.15;
    gameState.player.y = canvas.height * 0.7;
    gameState.target.x = canvas.width * 0.15;
    gameState.target.y = canvas.height * 0.7;
    gameState.isSitting = false;
    gameState.isSmoking = false;
    gameState.smokingTimer = 0;
    gameState.musicPlaying = false;
    
    // Stop music
    if (gameMusic.contentWindow) {
        gameMusic.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}', '*');
    }
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Update game logic
function update() {
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
            
            // Start music
            if (!gameState.musicPlaying && !gameState.muted) {
                if (gameMusic.contentWindow) {
                    gameMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                }
                gameState.musicPlaying = true;
            }
        }
    } else {
        // Update smoking animation
        gameState.smokingTimer += 1;
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
    for (let area of mapAreas.walkable) {
        if (x >= area.x && x <= area.x + area.width &&
            y >= area.y && y <= area.y + area.height) {
            return true;
        }
    }
    return false;
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
    
    // Draw river (dark blue)
    ctx.fillStyle = '#1a3a5a';
    const river = mapAreas.river;
    ctx.fillRect(river.x, river.y, river.width, river.height);
    
    // Draw walkable areas (dark gray)
    ctx.fillStyle = '#2a2a40';
    for (let area of mapAreas.walkable) {
        ctx.fillRect(area.x, area.y, area.width, area.height);
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
}

// Handle mouse clicks
canvas.addEventListener('click', (e) => {
    if (gameState.isSitting) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is in walkable area
    if (isWalkable(x, y)) {
        gameState.target.x = x;
        gameState.target.y = y;
    }
});

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

// Button event listeners
resetBtn.addEventListener('click', init);

muteBtn.addEventListener('click', () => {
    gameState.muted = !gameState.muted;
    if (gameState.muted) {
        if (gameMusic.contentWindow) {
            gameMusic.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        gameState.musicPlaying = false;
        muteBtn.textContent = 'Unmute';
    } else {
        muteBtn.textContent = 'Mute';
        if (gameState.isSitting) {
            if (gameMusic.contentWindow) {
                gameMusic.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
            gameState.musicPlaying = true;
        }
    }
});

// Start the game
init();