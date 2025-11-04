// Base XP value
// Max value to show end of bar
const BASE_VALUE = {
    xp: 10,
    max_Xp: 100,
    level: 1
};

function getXpState(callback) {
    chrome.storage.sync.get({ xpState: DEFAULT_XP_STATE }, ({ xpState }) => {
    callback(xpState);
    });
}

function setXpState(xpState, callback) {
    chrome.storage.sync.set({ xpState }, callback)
}