document.addEventListener('DOMContentLoaded', async () => {
    const xpDisplay = document.getElementById('xp');
    const gainBtn = document.getElementById('gainXP');

    // Load XP from storage
    chrome.storage.local.get(['xp'], (result) => {
        xpDisplay.textContent = result.xp || 0;
    });

    // Button gives user XP
    gainBtn.addEventListener('click', () => {
        chrome.storage.local.get(['xp'], (result) => {
            let newXP = (result.xp || 0) + 10;
            chrome.storage.local.set({ xp: newXP });
            xpDisplay.textContent = newXP;
        });
    });
});
