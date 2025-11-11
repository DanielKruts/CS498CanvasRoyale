// Base XP value and state management
const BASE_VALUE = {
    xp: 10,
    max_Xp: 100,
    level: 1
};

function getXpState(callback) {
    chrome.storage.sync.get({ xpState: BASE_VALUE }, ({ xpState }) => {
        callback(xpState);
    });
}

function setXpState(xpState, callback) {
    chrome.storage.sync.set({ xpState }, callback);
}

// Basic initialization
console.log("🟢 [NEW VERSION] Canvas Royale Content script loaded - XP system active");
console.log("🟢 [NEW VERSION] Current URL:", window.location.href);
console.log("🟢 [NEW VERSION] If you see this, the new version is running!");
