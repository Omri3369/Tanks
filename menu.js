// Main Menu System
// This file handles all main menu functionality for the Tank Trouble game

// Menu state variables
let selectedMapSize = 'medium';

// Map size selection
function selectMapSize(size) {
    selectedMapSize = size;
    mapSize = size; // Update game.js variable
    
    // Update button states
    document.querySelectorAll('.map-size-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${size}-btn`).classList.add('active');
}

// Start game with selected mode
function startGame(mode) {
    // Store game settings in sessionStorage to pass to game page
    const gameSettings = {
        gameMode: mode,
        mapSize: selectedMapSize,
        aiCount: parseInt(document.getElementById('mainMenuAiCount').value) || 3
    };
    
    sessionStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    
    // Navigate to game page
    window.location.href = 'game.html';
}

// Open settings page
function openSettings() {
    // Navigate to settings page
    window.location.href = 'settings.html';
}

// Toggle ammunition guide
function toggleAmmoGuide() {
    const startScreen = document.getElementById('startScreen');
    const ammoGuide = document.getElementById('ammoGuide');
    
    if (startScreen) startScreen.classList.add('hidden');
    if (ammoGuide) ammoGuide.classList.remove('hidden');
}

// Hide ammunition guide
function hideAmmoGuide() {
    const ammoGuide = document.getElementById('ammoGuide');
    const startScreen = document.getElementById('startScreen');
    
    if (ammoGuide) ammoGuide.classList.add('hidden');
    if (startScreen) startScreen.classList.remove('hidden');
}


// Initialize menu on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set default map size button as active
    const mediumBtn = document.getElementById('medium-btn');
    if (mediumBtn) {
        mediumBtn.classList.add('active');
    }
    
    // Set default AI count
    const mainMenuAiCount = document.getElementById('mainMenuAiCount');
    if (mainMenuAiCount) {
        mainMenuAiCount.value = 3;
    }
});