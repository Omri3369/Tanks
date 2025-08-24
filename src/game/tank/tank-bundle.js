// Tank System Bundle - Load all tank-related classes

// Load individual helper classes
document.write('<script src="src/game/tank/TankAI.js"></script>');
document.write('<script src="src/game/tank/TankRenderer.js"></script>');
document.write('<script src="src/game/tank/TankMovement.js"></script>');
document.write('<script src="src/game/tank/TankCombat.js"></script>');
document.write('<script src="src/game/tank/TankAnimator.js"></script>');

// Expose globally for backward compatibility
window.TankAI = TankAI;
window.TankRenderer = TankRenderer;
window.TankMovement = TankMovement;
window.TankCombat = TankCombat;
window.TankAnimator = TankAnimator;