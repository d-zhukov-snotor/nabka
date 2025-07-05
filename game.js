// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameMusic = document.getElementById('gameMusic');
const resetBtn = document.getElementById('resetBtn');
const muteBtn = document.getElementById('muteBtn');

// Game state
let gameState = {
    player: { x: 100, y: 400, size: 16, moving: false },
    target: { x: 100, y: 400 },
    isSitting: false,
    isSmoking: false,
    smokingTimer: 0,
    musicPlaying: false,
    muted: false
};

// Map areas (based on your image description)
const mapAreas = {
    // Metro starting area (green)
    metro: { x: 50, y: 350, width: 100, height: 100 },
    
    // Walkable area (red polygon - simplified as rectangles)
    walkable: [
        { x: 50, y: 200, width: 700, height: 350 },  // Main walkable area
        { x: 150, y: 100, width: 500, height: 100 }   // Upper walkable area
    ],
    
    // Bench area (yellow)
    bench: { x: 600, y: 150, width: 60, height: 40 },
    
    // River area (blue)
    river: { x: 0, y: 0, width: 800, height: 120 }
};

// Initialize game
function init() {
    // Reset game state
    gameState.player.x = 100;
    gameState.player.y = 400;
    gameState.target.x = 100;
    gameState.target.y = 400;
    gameState.isSitting = false;
    gameState.isSmoking = false;
    gameState.smokingTimer = 0;
    gameState.musicPlaying = false;
    
    // Stop music
    gameMusic.pause();
    gameMusic.currentTime = 0;
    
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
            const speed = 2;
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
                gameMusic.play();
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
    
    return player.x >= bench.x - 20 && 
           player.x <= bench.x + bench.width + 20 &&
           player.y >= bench.y - 20 && 
           player.y <= bench.y + bench.height + 20;
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
    
    // Draw background
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw river (blue)
    ctx.fillStyle = '#4a90e2';
    const river = mapAreas.river;
    ctx.fillRect(river.x, river.y, river.width, river.height);
    
    // Draw walkable areas (lighter green)
    ctx.fillStyle = '#4a7c59';
    for (let area of mapAreas.walkable) {
        ctx.fillRect(area.x, area.y, area.width, area.height);
    }
    
    // Draw metro area (green)
    ctx.fillStyle = '#2e7d32';
    const metro = mapAreas.metro;
    ctx.fillRect(metro.x, metro.y, metro.width, metro.height);
    
    // Draw metro symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('M', metro.x + metro.width/2, metro.y + metro.height/2 + 7);
    
    // Draw bench (yellow)
    ctx.fillStyle = '#ffd700';
    const bench = mapAreas.bench;
    ctx.fillRect(bench.x, bench.y, bench.width, bench.height);
    
    // Draw bench details
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(bench.x + 5, bench.y + 5, bench.width - 10, 8);
    ctx.fillRect(bench.x + 5, bench.y + 25, bench.width - 10, 8);
    
    // Draw player
    drawPlayer();
    
    // Draw smoking effect
    if (gameState.isSmoking) {
        drawSmoke();
    }
    
    // Draw UI
    drawUI();
}

// Draw player character
function drawPlayer() {
    const player = gameState.player;
    
    // Player body
    ctx.fillStyle = gameState.isSitting ? '#654321' : '#ff6b6b';
    ctx.fillRect(player.x - player.size/2, player.y - player.size/2, player.size, player.size);
    
    // Player head
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(player.x - 6, player.y - player.size/2 - 8, 12, 12);
    
    // Player eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x - 4, player.y - player.size/2 - 6, 2, 2);
    ctx.fillRect(player.x + 2, player.y - player.size/2 - 6, 2, 2);
    
    // If sitting, draw differently
    if (gameState.isSitting) {
        ctx.fillStyle = '#333333';
        ctx.fillRect(player.x - 8, player.y + 4, 16, 8);
    }
}

// Draw smoke effect
function drawSmoke() {
    const player = gameState.player;
    const time = gameState.smokingTimer;
    
    ctx.fillStyle = `rgba(200, 200, 200, ${0.6 + 0.2 * Math.sin(time * 0.1)})`;
    
    // Draw multiple smoke particles
    for (let i = 0; i < 5; i++) {
        const offsetX = Math.sin(time * 0.05 + i) * 10;
        const offsetY = -20 - i * 8 - Math.sin(time * 0.08 + i) * 5;
        const size = 4 + Math.sin(time * 0.1 + i) * 2;
        
        ctx.beginPath();
        ctx.arc(player.x + offsetX, player.y + offsetY, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Draw UI elements
function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    if (gameState.isSitting) {
        ctx.fillText('🚬 Relaxing by the river...', 20, 30);
        if (gameState.musicPlaying) {
            ctx.fillText('🎵 Music playing', 20, 50);
        }
    } else {
        ctx.fillText('Walk to the bench by the river', 20, 30);
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
    
    const speed = 5;
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
        gameMusic.pause();
        gameState.musicPlaying = false;
        muteBtn.textContent = 'Unmute';
    } else {
        muteBtn.textContent = 'Mute';
        if (gameState.isSitting) {
            gameMusic.play();
            gameState.musicPlaying = true;
        }
    }
});

// Start the game
init();