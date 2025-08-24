// Utility Helper Functions

/**
 * Generate a random RGB color
 * @returns {string} RGB color string
 */
export function generateRandomRGBColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Calculate distance between two points
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number} Distance
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {number} Angle in radians
 */
export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize an angle to be between -PI and PI
 * @param {number} angle 
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/**
 * Check if two rectangles are colliding
 * @param {Object} rect1 
 * @param {Object} rect2 
 * @returns {boolean}
 */
export function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Check if a point is inside a rectangle
 * @param {number} px 
 * @param {number} py 
 * @param {Object} rect 
 * @returns {boolean}
 */
export function pointInRect(px, py, rect) {
    return px >= rect.x && 
           px <= rect.x + rect.width &&
           py >= rect.y && 
           py <= rect.y + rect.height;
}

/**
 * Check circle collision
 * @param {Object} circle1 
 * @param {Object} circle2 
 * @returns {boolean}
 */
export function circleCollision(circle1, circle2) {
    const dx = circle1.x - circle2.x;
    const dy = circle1.y - circle2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

/**
 * Clamp a value between min and max
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} start 
 * @param {number} end 
 * @param {number} t 
 * @returns {number}
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Random float between min and max
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random element from an array
 * @param {Array} array 
 * @returns {*}
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle an array in place
 * @param {Array} array 
 * @returns {Array}
 */
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Deep clone an object
 * @param {Object} obj 
 * @returns {Object}
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Format time in seconds to MM:SS
 * @param {number} seconds 
 * @returns {string}
 */
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get canvas coordinates from mouse event
 * @param {HTMLCanvasElement} canvas 
 * @param {MouseEvent} event 
 * @returns {Object} {x, y}
 */
export function getCanvasCoordinates(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number}
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number}
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}