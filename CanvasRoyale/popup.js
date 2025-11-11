// 1139~rzEvfhDWLFUBT4kQhkZxDJNaADMUkJaBJxYV9hTCAUkLcPPZKVECXFzRU2LXhYV8

// Manual token setup
document.getElementById('saveSettings').addEventListener('click', async () => {
    const domain = document.getElementById('canvasDomain').value.trim().replace(/^https?:\/\//, '');
    const token = document.getElementById('accessToken').value.trim();

    if (!domain || !token) {
        alert("Please enter both a Canvas domain and access token.");
        return;
    }

    await chrome.storage.local.set({
        token: token,
        canvasDomain: domain
    });

    const isValid = await testCanvasConnection(domain, token);
    if (isValid) {
        alert("Canvas connected successfully! The widget will now appear on Canvas pages.");

        // Tell all Canvas tabs to show the widget
        await notifyCanvasTabsToShowWidget();

        checkAuthStatus();
    } else {
        alert("Connection failed. Please check your domain and token.");
    }
});

// Disconnect button
document.getElementById('disconnectCanvas').addEventListener('click', async () => {
    const confirmDisconnect = confirm("Are you sure you want to disconnect from Canvas? Your XP will be saved.");
    if (confirmDisconnect) {
        await chrome.storage.local.remove(["token", "canvasDomain"]);
        alert("Disconnected from Canvas. The widget will disappear from Canvas pages.");

        // Tell all Canvas tabs to hide the widget
        await notifyCanvasTabsToHideWidget();

        checkAuthStatus();
    }
});

// Test Canvas API connection
async function testCanvasConnection(domain, token) {
    try {
        const response = await fetch(`https://${domain}/api/v1/users/self`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.ok;
    } catch (error) {
        console.error("Connection test failed:", error);
        return false;
    }
}

// Notify all Canvas tabs to check connection and show widget
async function notifyCanvasTabsToShowWidget() {
    try {
        const tabs = await chrome.tabs.query({ url: "https://*.instructure.com/*" });

        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { type: "checkConnection" });
                console.log(`[Canvas Ranked] Notified tab ${tab.id} to show widget`);
            } catch (error) {
                console.log(`[Canvas Ranked] Tab ${tab.id} not ready yet`);
            }
        }
    } catch (error) {
        console.error("[Canvas Ranked] Error notifying tabs:", error);
    }
}

// Notify all Canvas tabs to hide widget
async function notifyCanvasTabsToHideWidget() {
    try {
        const tabs = await chrome.tabs.query({ url: "https://*.instructure.com/*" });

        for (const tab of tabs) {
            try {
                await chrome.tabs.sendMessage(tab.id, { type: "checkConnection" });
                console.log(`[Canvas Ranked] Notified tab ${tab.id} to hide widget`);
            } catch (error) {
                console.log(`[Canvas Ranked] Tab ${tab.id} not ready yet`);
            }
        }
    } catch (error) {
        console.error("[Canvas Ranked] Error notifying tabs:", error);
    }
}

// How to get access token instructions
document.getElementById("connectCanvas").addEventListener("click", () => {
    const instructions = `How to Get Your Canvas Access Token:

1. Go to your Canvas account (your-school.instructure.com)
2. Click on "Account" -> "Settings"
3. Scroll down to "Approved Integrations"
4. Click "+ New Access Token"
5. Enter:
   - Purpose: "Canvas Ranked Extension"
   - Expires: Choose a date far in the future
6. Click "Generate Token"
7. COPY the token (you won't see it again!)
8. Paste it in the "Access Token" field above

Your domain is usually: your-school.instructure.com`;
    alert(instructions);
});

// Check and display current auth status
async function checkAuthStatus() {
    const { token, canvasDomain} = await chrome.storage.local.get(["token", "canvasDomain"]);
    const statusElement = document.getElementById('authStatus');
    const connectedSection = document.getElementById('connectedSection');
    const setupSection = document.getElementById('setupSection');

    if (token && canvasDomain) {
        const isValid = await testCanvasConnection(canvasDomain, token);
        if (isValid) {
            statusElement.innerHTML = '<span style="color: green;">Connected to ' + canvasDomain + '</span>';
            statusElement.style.backgroundColor = '#f0f9f0';
            setupSection.style.display = 'none';
            connectedSection.style.display = 'block';
        } else {
            statusElement.innerHTML = '<span style="color: orange;">Connection issue with ' + canvasDomain + '</span>';
            statusElement.style.backgroundColor = '#fff9f0';
            setupSection.style.display = 'block';
            connectedSection.style.display = 'none';
        }
    } else {
        statusElement.innerHTML = '<span style="color: red;">Not connected to Canvas</span>';
        statusElement.style.backgroundColor = '#fff0f0';
        setupSection.style.display = 'block';
        connectedSection.style.display = 'none';
    }
}

// Load saved settings when popup opens
async function loadSavedSettings() {
    const { token, canvasDomain } = await chrome.storage.local.get(["token", "canvasDomain"]);
    if (canvasDomain) {
        document.getElementById('canvasDomain').value = canvasDomain;
    }
    if (token) {
        document.getElementById('accessToken').value = '********' + token.slice(-4);
    }
}

// Initialize
loadSavedSettings();
checkAuthStatus();