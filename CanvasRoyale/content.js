// CANVAS ROYALE - COMBINED CONTENT SCRIPT
// Integrates: Submission Detection + Visual Widget + Advanced Bonus XP System
(function () {
    'use strict';

    console.log("[Canvas Royale] COMBINED CONTENT SCRIPT LOADED!");

       // --- Safety stub for applyRankTheme to avoid runtime errors ---
    function applyRankTheme(widget, rankName) {
        // You can leave this empty or log for debugging:
        // console.log("[Canvas Royale] applyRankTheme called for", rankName);
    }

    (function injectXpFlashStyles() {
    if (document.getElementById("xp-flash-style")) return;

    const style = document.createElement("style");
    style.id = "xp-flash-style";
    style.textContent = `
        .xp-gain-flash {
            box-shadow: 0 0 16px #00e5ff, 0 0 28px #00e5ff !important;
        }
    `;
    document.head.appendChild(style);
})();


    // ===== CONFIGURATION =====
    const XP_STATE_KEY = "xpState";
    const SUBMISSION_XP_VALUE = 50; // Base XP per assignment
    const AWARDED_ASSIGNMENTS_KEY = "xpAwardedAssignments";

    const BASE_STATE = {
        xp: 0,
        maxXp: 100,
        level: 1,
    };

    // Track current XP for level-up detection
    let currentXP = 0;
    let xpAwardedForThisPage = false;

    // ===== XP LOGIC (From your Content.js) =====
    function growMaxXp(oldMax) {
        return oldMax + 50; // e.g., 100 → 150 → 200 ...
    }

    function applyXp(state, amount) {
        let { xp, maxXp, level } = { ...BASE_STATE, ...state };
        xp += amount;
        let leveledUp = false;

        while (xp >= maxXp) {
            xp -= maxXp;
            level += 1;
            maxXp = growMaxXp(maxXp);
            leveledUp = true;
        }

        return { xp, maxXp, level, leveledUp };
    }

    // Function called by bonusXp.js to update bonus displays
    window.updateCanvasRoyaleBonusDisplay = function(totalBonus, gradeBonus, timingBonus) {
        console.log(`[Canvas Royale] Global bonus update called: Total=${totalBonus}, Grade=${gradeBonus}, Timing=${timingBonus}`);
        
        // Find the Canvas Royale widget
        const widget = document.getElementById('canvas-royale-widget');
        if (widget) {
            console.log('[Canvas Royale] Widget found, updating bonus display...');
            updateBonusXPDisplay(widget, totalBonus, gradeBonus, timingBonus);
        } else {
            console.log('[Canvas Royale] Widget not found for bonus update - retrying in 500ms...');
            // Retry after a short delay in case widget isn't ready yet
            setTimeout(() => {
                const retryWidget = document.getElementById('canvas-royale-widget');
                if (retryWidget) {
                    console.log('[Canvas Royale] Widget found on retry, updating bonus display...');
                    updateBonusXPDisplay(retryWidget, totalBonus, gradeBonus, timingBonus);
                } else {
                    console.log('[Canvas Royale] Widget still not found after retry');
                }
            }, 500);
        }
    };

    // Function to trigger bonus XP calculation
    function checkAndUpdateBonusXP() {
        // Check if XP has already been awarded for this assignment
        const assignmentKey = getAssignmentKey();
        chrome.storage.local.get([AWARDED_ASSIGNMENTS_KEY, "bonusCalculatedAssignments"], (result) => {
            const awarded = result[AWARDED_ASSIGNMENTS_KEY] || {};
            const bonusCalculated = result.bonusCalculatedAssignments || {};

            if (awarded[assignmentKey] || bonusCalculated[assignmentKey]) {
                console.log("[Canvas Royale] XP already awarded for this assignment. Skipping bonus calculation.");
                return;
            }

            // Only proceed with bonus calculation if no XP has been awarded yet
            try {
                // Send message to background script to trigger bonus calculation
                chrome.runtime.sendMessage({
                    type: 'checkBonusXP',
                    url: window.location.href
                });
            } catch (error) {
                console.log('[Canvas Royale] Error checking bonus XP:', error);
            }
        });
    }

    // Enhanced function to handle all XP updates including bonuses
    function addXP(amount, reason = 'Submission') {
        chrome.storage.local.get([XP_STATE_KEY], (result) => {
            const prev = result[XP_STATE_KEY] || BASE_STATE;
            const next = applyXp(prev, amount);

            console.log(`[Canvas Royale] ${reason} detected – awarding ${amount} XP.`);
            console.log("[Canvas Royale] Previous:", prev, "→ New:", next);

            chrome.storage.local.set({ [XP_STATE_KEY]: next }, () => {
                if (chrome.runtime.lastError) {
                    console.error("[Canvas Royale] Error saving XP state:", chrome.runtime.lastError);
                    return;
                }

                // Update widget display
                const widget = document.getElementById("canvas-royale-widget");
                if (widget) {
                    if (next.leveledUp) {
                        animateLevelUp(widget, prev.xp, next.xp, amount);
                        console.log(`[Canvas Royale] Level up! Now level ${next.level}, next level at ${next.maxXp} XP`);
                    } else {
                        updateDisplay(widget, next.xp, next.maxXp, next.level);
                        showXPAnimation(amount);
                    }
                    currentXP = next.xp;
                }

                if (next.leveledUp) {
                    console.log(`[Canvas Royale] Level up! Now level ${next.level}, next level at ${next.maxXp} XP`);
                } else {
                    console.log("[Canvas Royale] XP applied successfully.");
                }
            });
        });
    }

    // Alias function for compatibility with existing code
    function awardSubmissionXp(amount, reason) {
        addXP(amount, reason);
    }

    // Make XP functions available globally for bonusXp.js integration
    window.addXP = addXP;
    window.awardSubmissionXp = awardSubmissionXp;

    // ===== WIDGET UI (From XPwidget content.js) =====
    function checkConnectionAndInitialize() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(["token", "canvasDomain"], function (result) {
                const isConnected = !!(result.token && result.canvasDomain);
                console.log(`[Canvas Royale] Connection status: ${isConnected}`);

                if (isConnected) {
                    createWidget();
                    console.log("[Canvas Royale] Widget created - connected to Canvas");
                } else {
                    console.log("[Canvas Royale] Widget hidden - not connected to Canvas");
                    removeWidgetIfExists();
                }
            });
        } else {
            // Fallback: show widget anyway for testing
            createWidget();
            console.log("[Canvas Royale] Widget created (no connection check)");
        }
    }

    function removeWidgetIfExists() {
        const existingWidget = document.getElementById("canvas-royale-widget");
        if (existingWidget) {
            existingWidget.remove();
            console.log("[Canvas Royale] Removed widget - not connected");
        }
    }

    function createWidget() {
        removeWidgetIfExists();

        console.log("[Canvas Royale] Creating Canvas Royale widget...");

        const widget = document.createElement("div");
        widget.id = "canvas-royale-widget";
        widget.style.position = "fixed";
        widget.style.bottom = "20px";
        widget.style.right = "20px";
        widget.style.zIndex = "9999";
        widget.style.background = "#2E7D32";
        widget.style.color = "white";
        widget.style.padding = "14px 16px";
        widget.style.borderRadius = "12px";
        widget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.3)";
        widget.style.fontFamily = "Segoe UI, sans-serif";
        widget.style.fontSize = "14px";
        widget.style.width = "220px";
        widget.style.border = "3px solid #4CAF50";

        widget.innerHTML = `
            <div style="font-weight:bold; text-align:center; font-size:16px; margin-bottom:5px;">CANVAS ROYALE</div>
            <div style="text-align:center; font-size:10px; color:#A5D6A7; margin-bottom:10px;">Advanced XP System Active</div>
            
            <div id="rank-info" style="margin-bottom:12px;">

                <!-- 1) Rank row (Top of widget) -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <img
                            id="rank-icon"
                            src=""
                            alt="Rank badge"
                            style="width:28px; height:28px; border-radius:50%; background:#1B5E20; object-fit:contain;"
                        />
                        <span id="rank-name" style="font-size:11px; color:#C8E6C9;">Unranked</span>
                    </div>
                    <span style="font-size:10px; color:#A5D6A7;">Rank</span>
                </div>

                <!-- 2) Level + XP row (Middle of Widget) -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:12px;">Level <span id="level-display">0</span></span>
                    <span style="font-size:11px;">
                        <span id="xp-display">0</span>/<span id="max-xp-display">100</span> XP
                    </span>
                </div>

                <!-- 4) XP BAR (Bottom of Widget) -->
                <div style="height:10px; width:100%; background:#1B5E20; border-radius:5px; overflow:hidden;">
                    <div
                        id="xp-bar"
                        style="
                            width:0%;
                            height:100%;
                            background:#00e5ff;
                            box-shadow: 0 0 8px #00e5ff;
                            transition: width 0.4s ease, box-shadow 0.4s ease;
                        "
                    ></div>
                </div>
            </div>

            `;

        document.body.appendChild(widget);

        // Pulls latest XP from storage right away to ensure sync
        syncXpFromStorageToWidget();

        console.log("[Canvas Royale] Canvas Royale widget created successfully!");

        setupEventListeners(widget);
        loadInitialData(widget);
    }

    function setupEventListeners(widget) {
    if (!widget) return;

    // Test Bonus button
    const testBonusBtn = widget.querySelector("#testBonus");
    if (testBonusBtn) {
        testBonusBtn.addEventListener("click", function () {
            console.log("[Canvas Royale] Test Bonus clicked");
            awardSubmissionXp(75, "test bonus");
        });
    }

    // View Stats button
    const showStatsBtn = widget.querySelector("#showStats");
    if (showStatsBtn) {
        showStatsBtn.addEventListener("click", function () {
            console.log("[Canvas Royale] View Stats clicked");

            chrome.storage.local.get(
                [XP_STATE_KEY, AWARDED_ASSIGNMENTS_KEY], 
                (result) => {
                    const xpState = result[XP_STATE_KEY] || BASE_STATE;
                    const awarded = result[AWARDED_ASSIGNMENTS_KEY] || {};
                    const assignmentCount = Object.keys(awarded).length;

                    alert(
                        `Canvas Royale Stats:\n` +
                        `Level: ${xpState.level}\n` +
                        `XP: ${xpState.xp}/${xpState.maxXp}\n` +
                        `Assignments Completed: ${assignmentCount}`
                    );
                }
            );
        });
    }
}


    function loadInitialData(widget) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get([XP_STATE_KEY], function (result) {
                const state = result[XP_STATE_KEY] || BASE_STATE;
                currentXP = state.xp;
                updateDisplay(widget, state.xp, state.maxXp, state.level);
                console.log(`[Canvas Royale] Loaded XP: ${state.xp}, Level: ${state.level}`);
            });
        }
    }

    function updateDisplay(widget, xp, maxXp, level) {
    if (!widget) return;

    // ---- Safety-normalized values ----
    const safeLevel = (typeof level === "number" && level > 0) ? level : 1;
    const safeMaxXp = (typeof maxXp === "number" && maxXp > 0) ? maxXp : 100;
    const safeXp = (typeof xp === "number" && xp >= 0) ? xp : 0;

    const progress = safeXp % safeMaxXp;
    const percentage = (progress / safeMaxXp) * 100;

    // ---- Level / XP text ----
    const levelDisplay = widget.querySelector("#level-display");
    if (levelDisplay) levelDisplay.textContent = safeLevel;

    const xpDisplay = widget.querySelector("#xp-display");
    if (xpDisplay) xpDisplay.textContent = progress;

    const maxXpDisplay = widget.querySelector("#max-xp-display");
    if (maxXpDisplay) maxXpDisplay.textContent = safeMaxXp;

    // ---- XP bar ----
    const xpBar = widget.querySelector("#xp-bar");
    if (xpBar) { 
        xpBar.style.width = percentage + "%";

    
    // XP Gain Glow – brief boost when XP changes
    xpBar.classList.add("xp-gain-flash");
    setTimeout(() => {
        xpBar.classList.remove("xp-gain-flash");
    }, 300);

    }

    // ---- Rank name + icon (based on level) ----
    const rankNameEl = widget.querySelector("#rank-name");
    const rankIconEl = widget.querySelector("#rank-icon");

    if (typeof getRankForLevel === "function") {
        const rank = getRankForLevel(safeLevel);

        // Rank text (Bronze / Silver / etc.)
        if (rankNameEl && rank && rank.name) {
            rankNameEl.textContent = rank.name;
        }

        // Rank icon
        if (rankIconEl && rank) {
            try {
                const iconUrl = getRankIconPath(rank);
                if (iconUrl) {
                    rankIconEl.src = iconUrl;
                }
            } catch (e) {
                console.warn("[Canvas Royale] Could not resolve rank icon:", e);
            }

            rankIconEl.alt = (rank.name || "Rank") + " rank badge";

            // Make icon slowly grow as level increases
            const baseSize = 28;
            const bonus = Math.min(32, Math.floor((safeLevel - 1) / 5) * 6); // +6px every 5 levels, capped
            const size = baseSize + bonus;

            rankIconEl.style.width = size + "px";
            rankIconEl.style.height = size + "px";
        }

        if (rank && rank.name) {
            // Make sure the widget itself can show strong glow
            widget.style.borderRadius = "12px";
            widget.style.overflow = "visible";

            switch (rank.name) {
                case "Bronze":
                    widget.style.boxShadow =
                        "0 0 20px rgba(205, 127, 50, 1), 0 0 40px rgba(205, 127, 50, 0.95)";
                    break;
                case "Silver":
                    widget.style.boxShadow =
                        "0 0 22px rgba(192, 192, 192, 1), 0 0 44px rgba(224, 224, 224, 1)";
                    break;
                case "Gold":
                    widget.style.boxShadow =
                        "0 0 24px rgba(255, 215, 0, 1), 0 0 50px rgba(255, 235, 59, 1)";
                    break;
                case "Platinum":
                    widget.style.boxShadow =
                        "0 0 26px rgba(187, 222, 251, 1), 0 0 52px rgba(144, 202, 249, 1)";
                    break;
                case "Diamond":
                    widget.style.boxShadow =
                        "0 0 30px rgba(129, 212, 250, 1), 0 0 60px rgba(224, 247, 250, 1)";
                    break;
                default:
                    widget.style.boxShadow = "0 0 14px rgba(0,0,0,0.8)";
            }
}


    }
}

    function syncXpFromStorageToWidget() {
    const widget = document.getElementById("canvas-royale-widget");
    if (!widget) return;

    chrome.storage.local.get(["xpState"], (result) => {
        const state = result.xpState || {};

        const xp = typeof state.xp === "number" ? state.xp : 0;
        const maxXp = typeof state.maxXp === "number" ? state.maxXp : 100;
        const level = typeof state.level === "number" ? state.level : 1;

        updateDisplay(widget, xp, maxXp, level);
    });
}

    // Re-sync XP widget when navigating with back/forward buttons
    window.addEventListener("pageshow", () => {
    syncXpFromStorageToWidget();
});


    // Function to update bonus XP display (simplified - bonuses work behind the scenes)
    function updateBonusXPDisplay(widget, totalBonus, gradeBonus, timingBonus) {
        console.log(`[Canvas Royale] Bonus XP calculated: Total=${totalBonus}, Grade=${gradeBonus}, Timing=${timingBonus}`);
        console.log(`[Canvas Royale] Bonuses are automatically added to total XP progression`);
        
        // Note: Bonus XP breakdown is no longer displayed in the widget,
        // but bonuses are still calculated and added to the player's total XP
    }

    function animateLevelUp(widget, currentXP, newXP, amount) {
        // First, animate to 100% in current level
        const xpBar = widget.querySelector("#xp-bar");
        if (xpBar) {
            xpBar.style.width = '100%';
        }

        // Show level-up animation
        chrome.storage.local.get([XP_STATE_KEY], (result) => {
            const state = result[XP_STATE_KEY] || BASE_STATE;
            showLevelUpAnimation(state.level);
            
            // After a delay, reset to new level and progress
            setTimeout(() => {
                updateDisplay(widget, state.xp, state.maxXp, state.level);
                showXPAnimation(amount);
            }, 800);
        });
    }

    function showLevelUpAnimation(newLevel) {
        const anim = document.createElement("div");
        anim.textContent = "LEVEL " + newLevel + "!";
        anim.style.position = "fixed";
        anim.style.bottom = "120px";
        anim.style.right = "80px";
        anim.style.fontSize = "18px";
        anim.style.fontWeight = "bold";
        anim.style.color = "#FFD700";
        anim.style.textShadow = "0 2px 8px rgba(0,0,0,0.8)";
        anim.style.zIndex = "10000";
        anim.style.opacity = "1";
        anim.style.background = "rgba(0,0,0,0.7)";
        anim.style.padding = "10px 15px";
        anim.style.borderRadius = "10px";
        anim.style.border = "2px solid #FFD700";
        document.body.appendChild(anim);

        let pos = 0;
        const interval = setInterval(() => {
            pos++;
            anim.style.transform = "translateY(-" + pos + "px)";
            anim.style.opacity = (1 - pos / 60).toString();

            if (pos > 60) {
                clearInterval(interval);
                anim.remove();
            }
        }, 20);
    }

    function showXPAnimation(amount) {
        const anim = document.createElement("div");
        anim.textContent = typeof amount === 'number' ? "+" + amount + " XP!" : amount;
        anim.style.position = "fixed";
        anim.style.bottom = "80px";
        anim.style.right = "80px";
        anim.style.fontSize = "16px";
        anim.style.fontWeight = "bold";
        anim.style.color = typeof amount === 'number' ? "#4CAF50" : "#ff9800";
        anim.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
        anim.style.zIndex = "10000";
        anim.style.opacity = "1";
        document.body.appendChild(anim);

        let pos = 0;
        const interval = setInterval(() => {
            pos++;
            anim.style.transform = "translateY(-" + pos + "px)";
            anim.style.opacity = (1 - pos / 40).toString();

            if (pos > 40) {
                clearInterval(interval);
                anim.remove();
            }
        }, 20);
    }

    // ===== SUBMISSION DETECTION (From your Content.js) =====
    function getAssignmentKey() {
        return window.location.pathname;
    }

    function findSubmittedSpan() {
        const spans = document.querySelectorAll("span.visible-desktop");
        
        for (const span of spans) {
            const text = span.innerText.trim().toUpperCase();
            if (text.startsWith("SUBMITTED:")) {
                return span;
            }
        }
        return null;
    }

    function pageShowsSubmitted() {
        return !!findSubmittedSpan();
    }

    function handleSubmissionDetected() {
        if (xpAwardedForThisPage) return;
        xpAwardedForThisPage = true;

        const assignmentKey = getAssignmentKey();

        chrome.storage.local.get([AWARDED_ASSIGNMENTS_KEY, "bonusCalculatedAssignments"], (result) => {
            const awarded = result[AWARDED_ASSIGNMENTS_KEY] || {};
            const bonusCalculated = result.bonusCalculatedAssignments || {};

            if (awarded[assignmentKey]) {
                console.log("[Canvas Royale] XP for this assignment was already awarded before. Skipping all XP awards.");
                return;
            }

            if (bonusCalculated[assignmentKey]) {
                console.log("[Canvas Royale] Bonus XP for this assignment was already calculated. Skipping all XP awards.");
                return;
            }

            // Mark this assignment as awarded (for both base and bonus XP)
            awarded[assignmentKey] = true;
            bonusCalculated[assignmentKey] = true;

            chrome.storage.local.set({ 
                [AWARDED_ASSIGNMENTS_KEY]: awarded,
                bonusCalculatedAssignments: bonusCalculated 
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("[Canvas Royale] Error saving awarded assignment map:", chrome.runtime.lastError);
                    return;
                }

                console.log("[Canvas Royale] First time awarding XP for this assignment. Proceeding.");
                
                // Award base XP
                awardSubmissionXp(SUBMISSION_XP_VALUE, "base submission");
                
                // Check for bonus XP with a small delay to ensure everything is ready
                console.log("[Canvas Royale] Checking for bonus XP...");
                setTimeout(() => {
                    checkAndUpdateBonusXP();
                }, 500); // Small delay to ensure widget and scripts are ready
            });
        });
    }

    function setupRealSubmissionDetection() {
        // Only run submission detection on assignment pages
        if (!window.location.pathname.includes('/assignments/')) {
            console.log("[Canvas Royale] Not on assignment page, skipping submission detection");
            return;
        }
        
        // Check if this assignment has already been awarded XP before doing anything
        const assignmentKey = getAssignmentKey();
        chrome.storage.local.get([AWARDED_ASSIGNMENTS_KEY, "bonusCalculatedAssignments"], (result) => {
            const awarded = result[AWARDED_ASSIGNMENTS_KEY] || {};
            const bonusCalculated = result.bonusCalculatedAssignments || {};

            if (awarded[assignmentKey] || bonusCalculated[assignmentKey]) {
                console.log("[Canvas Royale] XP already awarded for this assignment. No further XP will be given.");
                xpAwardedForThisPage = true; // Prevent any further XP awards
                return;
            }

            // Only proceed with submission detection if no XP has been awarded
            if (pageShowsSubmitted()) {
                console.log("[Canvas Royale] Submission already present on load.");
                handleSubmissionDetected();
                return;
            }

            console.log("[Canvas Royale] Watching for submission confirmation...");

            const observer = new MutationObserver(() => {
                if (pageShowsSubmitted()) {
                    console.log("[Canvas Royale] Detected submitted span: assignment is submitted.");
                    handleSubmissionDetected();
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
            });
        });
    }

    // ===== INTEGRATION & INITIALIZATION =====
    function init() {
        console.log("[Canvas Royale] Initializing combined system...");
        
        // Initialize widget
        checkConnectionAndInitialize();
        
        // Initialize submission detection
        setupRealSubmissionDetection();
        
        // Listen for XP updates from other scripts (like bonusXp.js)
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (areaName !== "local") return;

                if (changes[XP_STATE_KEY]) {
                    const { newValue } = changes[XP_STATE_KEY];
                    console.log("[Canvas Royale] XP state changed:", newValue);

                    const widget = document.getElementById("canvas-royale-widget");
                    if (widget && newValue) {
                        updateDisplay(widget, newValue.xp, newValue.maxXp, newValue.level);
                        currentXP = newValue.xp;
                    }
                }
            });
        }
        
        // Test hook for development
        window.addEventListener("keydown", (e) => {
            if (e.altKey && e.key.toLowerCase() === "x") {
                console.log("[Canvas Royale] Alt+X pressed – simulating submission.");
                handleSubmissionDetected();
            }
        });
        
        console.log("[Canvas Royale] Combined system initialization complete!");
    }

    // Message listener for background script communications
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === "xpUpdated") {
            // Update widget when XP changes
            updateDisplay(message.xp);
        } else if (message.type === "triggerBonusCalculation") {
            console.log("[Canvas Royale] Triggered bonus calculation from background");
            // Call the bonus calculation function if available
            if (typeof window.calculateAndDisplayBonusXP === 'function') {
                window.calculateAndDisplayBonusXP();
            }
        } else if (message.type === "checkConnection") {
            console.log("[Canvas Royale] Received checkConnection message from popup");
            // Re-check connection and show/hide widget accordingly
            checkConnectionAndInitialize();
        }
    });

    // Start when ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();