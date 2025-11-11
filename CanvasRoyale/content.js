(function () {
    'use strict';

    console.log("[Canvas Ranked] CONTENT SCRIPT LOADED SUCCESSFULLY!");

    // Track current XP for level-up detection
    let currentXP = 0;

    // Check connection status first, then decide whether to show widget
    checkConnectionAndInitialize();

    function checkConnectionAndInitialize() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            // Use chrome.storage to check connection
            chrome.storage.local.get(["token", "canvasDomain"], function (result) {
                const isConnected = !!(result.token && result.canvasDomain);
                console.log(`[Canvas Ranked] Connection status: ${isConnected}`);

                if (isConnected) {
                    createWidget();
                    console.log("[Canvas Ranked] Widget created - connected to Canvas");
                } else {
                    console.log("[Canvas Ranked] Widget hidden - not connected to Canvas");
                    removeWidgetIfExists();
                }
            });
        } else {
            // Fallback: check localStorage
            const token = localStorage.getItem('canvas_token');
            const domain = localStorage.getItem('canvas_domain');
            const isConnected = !!(token && domain);
            console.log(`[Canvas Ranked] LocalStorage connection status: ${isConnected}`);

            if (isConnected) {
                createWidget();
            } else {
                removeWidgetIfExists();
            }
        }
    }

    function removeWidgetIfExists() {
        const existingWidget = document.getElementById("canvas-ranked-widget");
        if (existingWidget) {
            existingWidget.remove();
            console.log("[Canvas Ranked] Removed widget - not connected");
        }
    }

    function createWidget() {
        // Remove existing widget if any
        removeWidgetIfExists();

        console.log("[Canvas Ranked] Creating connected widget...");

        const widget = document.createElement("div");
        widget.id = "canvas-ranked-widget";
        widget.style.position = "fixed";
        widget.style.bottom = "20px";
        widget.style.right = "20px";
        widget.style.zIndex = "9999";
        widget.style.background = "#1e88e5";
        widget.style.color = "white";
        widget.style.padding = "14px 16px";
        widget.style.borderRadius = "12px";
        widget.style.boxShadow = "0 3px 6px rgba(0,0,0,0.3)";
        widget.style.fontFamily = "Segoe UI, sans-serif";
        widget.style.fontSize = "14px";
        widget.style.width = "220px";
        widget.style.border = "3px solid #4CAF50";

        widget.innerHTML = `
            <div style="font-weight:bold; text-align:center; font-size:16px; margin-bottom:5px;">CANVAS RANKED</div>
            <div style="text-align:center; font-size:10px; color:#b3e5fc; margin-bottom:10px;">Connected to Canvas</div>
            
            <div id="rank-info" style="margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:12px;">Level <span id="level-display">0</span></span>
                    <span style="font-size:11px;"><span id="xp-display">0</span>/100 XP</span>
                </div>
                <div style="height:10px; width:100%; background:#1565c0; border-radius:5px; overflow:hidden;">
                    <div id="xp-bar" style="width:0%; height:100%; background:#4caf50; transition: width 0.5s ease;"></div>
                </div>
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom:8px;">
                <button id="addXP" style="background:#43a047; border:none; color:white; border-radius:6px; padding:6px; cursor:pointer; font-size:11px; font-weight:bold;">+10 XP</button>
                <button id="testSubmit" style="background:#2196F3; border:none; color:white; border-radius:6px; padding:6px; cursor:pointer; font-size:11px; font-weight:bold;">Test Submit</button>
            </div>
            
            <button id="resetXP" style="background:#e53935; border:none; color:white; border-radius:6px; padding:6px; cursor:pointer; font-size:11px; font-weight:bold; width:100%;">Reset XP</button>
        `;

        document.body.appendChild(widget);
        console.log("[Canvas Ranked] Connected widget created successfully!");

        // Set up event listeners
        setupEventListeners(widget);

        // Load initial data
        loadInitialData(widget);
    }

    function setupEventListeners(widget) {
        // +XP button
        widget.querySelector("#addXP").addEventListener("click", function () {
            console.log("[Canvas Ranked] +10 XP clicked");
            addXP(10);
        });

        // Test Submit button
        widget.querySelector("#testSubmit").addEventListener("click", function () {
            console.log("[Canvas Ranked] Test Submit clicked");

            // Send test submission to background for processing
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                chrome.runtime.sendMessage({
                    type: "assignmentSubmitted",
                    courseId: "test",
                    assignmentId: "test",
                    isTest: true
                });
            } else {
                // Fallback: manually add XP with proper animation
                addXP(100);
            }
        });

        // Reset XP button
        widget.querySelector("#resetXP").addEventListener("click", function () {
            console.log("[Canvas Ranked] Reset XP clicked");
            const confirmReset = confirm("Are you sure you want to reset your XP to 0?");
            if (confirmReset) {
                resetXP();
            }
        });
    }

    function loadInitialData(widget) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(["xp"], function (result) {
                const xp = result.xp || 0;
                currentXP = xp; // Store current XP
                updateDisplay(widget, xp);
                console.log(`[Canvas Ranked] Loaded XP: ${xp}`);
            });
        } else {
            const xp = parseInt(localStorage.getItem('canvas_ranked_xp')) || 0;
            currentXP = xp; // Store current XP
            updateDisplay(widget, xp);
            console.log(`[Canvas Ranked] Loaded XP from localStorage: ${xp}`);
        }
    }

    function updateDisplay(widget, xp) {
        const XP_PER_LEVEL = 100;
        const level = Math.floor(xp / XP_PER_LEVEL);
        const progress = xp % XP_PER_LEVEL;
        const percentage = (progress / XP_PER_LEVEL) * 100;

        // Update level display
        const levelDisplay = widget.querySelector("#level-display");
        if (levelDisplay) levelDisplay.textContent = level;

        // Update XP display
        const xpDisplay = widget.querySelector("#xp-display");
        if (xpDisplay) xpDisplay.textContent = progress;

        // Update XP bar
        const xpBar = widget.querySelector("#xp-bar");
        if (xpBar) {
            xpBar.style.width = percentage + '%';
        }
    }

    function addXP(amount) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(["xp"], function (result) {
                const currentXP = result.xp || 0;
                const newXP = currentXP + amount;

                // Calculate current and new levels
                const XP_PER_LEVEL = 100;
                const currentLevel = Math.floor(currentXP / XP_PER_LEVEL);
                const newLevel = Math.floor(newXP / XP_PER_LEVEL);

                chrome.storage.local.set({ xp: newXP });

                const widget = document.getElementById("canvas-ranked-widget");
                if (widget) {
                    if (newLevel > currentLevel) {
                        // Level up! Animate to 100% first, then reset
                        animateLevelUp(widget, currentXP, newXP, amount);
                    } else {
                        // Normal XP gain - update display directly
                        updateDisplay(widget, newXP);
                        showXPAnimation(amount);
                    }
                }
                console.log(`[Canvas Ranked] Added ${amount} XP. Total: ${newXP}`);
            });
        } else {
            const currentXP = parseInt(localStorage.getItem('canvas_ranked_xp')) || 0;
            const newXP = currentXP + amount;
            const XP_PER_LEVEL = 100;
            const currentLevel = Math.floor(currentXP / XP_PER_LEVEL);
            const newLevel = Math.floor(newXP / XP_PER_LEVEL);

            localStorage.setItem('canvas_ranked_xp', newXP.toString());

            const widget = document.getElementById("canvas-ranked-widget");
            if (widget) {
                if (newLevel > currentLevel) {
                    animateLevelUp(widget, currentXP, newXP, amount);
                } else {
                    updateDisplay(widget, newXP);
                    showXPAnimation(amount);
                }
            }
            console.log(`[Canvas Ranked] Added ${amount} XP via localStorage. Total: ${newXP}`);
        }
    }

    // New function to handle level-up animation
    function animateLevelUp(widget, currentXP, newXP, amount) {
        const XP_PER_LEVEL = 100;
        const currentLevel = Math.floor(currentXP / XP_PER_LEVEL);

        // First, animate to 100% in current level
        const xpBar = widget.querySelector("#xp-bar");
        if (xpBar) {
            xpBar.style.width = '100%';
        }

        // Show level-up animation
        showLevelUpAnimation(currentLevel + 1);

        // After a delay, reset to new level and progress
        setTimeout(() => {
            updateDisplay(widget, newXP);
            showXPAnimation(amount);
        }, 800); // Match this delay with the level-up animation duration
    }

    // New function for level-up celebration
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

    function resetXP() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ xp: 0 });

            const widget = document.getElementById("canvas-ranked-widget");
            if (widget) {
                updateDisplay(widget, 0);
                showXPAnimation("XP Reset");
            }
            console.log("[Canvas Ranked] XP reset to 0");
        } else {
            localStorage.setItem('canvas_ranked_xp', '0');

            const widget = document.getElementById("canvas-ranked-widget");
            if (widget) {
                updateDisplay(widget, 0);
                showXPAnimation("XP Reset");
            }
            console.log("[Canvas Ranked] XP reset to 0 via localStorage");
        }
    }

    function showXPAnimation(amount) {
        const anim = document.createElement("div");
        anim.textContent = typeof amount === 'number' ? "+" + amount + " XP!" : amount;
        anim.style.position = "fixed";
        anim.style.bottom = "80px";
        anim.style.right = "80px";
        anim.style.fontSize = "16px";
        anim.style.fontWeight = "bold";
        anim.style.color = typeof amount === 'number' ? "#00e676" : "#ff9800";
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

    // Listen for connection changes
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener(function (changes, namespace) {
            if (namespace === 'local' && (changes.token || changes.canvasDomain)) {
                console.log("[Canvas Ranked] Connection status changed, rechecking...");
                setTimeout(checkConnectionAndInitialize, 500);
            }
        });

        // Listen for XP updates from background/popup - FIXED VERSION
        chrome.runtime.onMessage.addListener(function (msg) {
            if (msg.type === "xpUpdated") {
                console.log(`[Canvas Ranked] XP updated to: ${msg.xp}`);
                const widget = document.getElementById("canvas-ranked-widget");
                if (widget) {
                    // Check if this is a level-up
                    const XP_PER_LEVEL = 100;
                    const currentLevel = Math.floor(currentXP / XP_PER_LEVEL);
                    const newLevel = Math.floor(msg.xp / XP_PER_LEVEL);

                    if (newLevel > currentLevel) {
                        // Level up! Use the animation
                        animateLevelUp(widget, currentXP, msg.xp, msg.xp - currentXP);
                    } else {
                        // Normal XP gain
                        updateDisplay(widget, msg.xp);
                        showXPAnimation(msg.xp - currentXP);
                    }

                    // Update current XP
                    currentXP = msg.xp;
                }
            } else if (msg.type === "checkConnection") {
                checkConnectionAndInitialize();
            }
        });
    }

    // Assignment submission detection
    document.addEventListener('submit', function (e) {
        if (e.target.matches('form.submit_assignment_form')) {
            console.log("[Canvas Ranked] Real assignment submission detected!");

            // Extract course and assignment IDs from the page
            const courseId = extractCourseId();
            const assignmentId = extractAssignmentId();

            if (courseId && assignmentId) {
                // Send to background for proper processing with timing logic
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage({
                        type: "assignmentSubmitted",
                        courseId: courseId,
                        assignmentId: assignmentId,
                        isTest: false
                    });
                }
                console.log(`[Canvas Ranked] Sent to background: course=${courseId}, assignment=${assignmentId}`);
            } else {
                console.warn("[Canvas Ranked] Could not extract course/assignment IDs, using fallback");
                // Fallback: use the simple XP award after delay
                setTimeout(() => {
                    addXP(100); // Base XP only since we can't calculate timing
                }, 2000);
            }
        }
    });

    // Helper functions to extract IDs from Canvas page
    function extractCourseId() {
        // Try multiple methods to find course ID
        const courseLink = document.querySelector('a[href*="/courses/"]');
        if (courseLink) {
            const match = courseLink.href.match(/\/courses\/(\d+)/);
            if (match) return match[1];
        }

        // Check data attributes
        const bodyData = document.body.getAttribute('data-course-id');
        if (bodyData) return bodyData;

        // Check URL
        const urlMatch = window.location.href.match(/\/courses\/(\d+)/);
        if (urlMatch) return urlMatch[1];

        return null;
    }

    function extractAssignmentId() {
        // Try multiple methods to find assignment ID
        const urlMatch = window.location.href.match(/\/assignments\/(\d+)/);
        if (urlMatch) return urlMatch[1];

        // Check data attributes
        const assignmentElement = document.querySelector('[data-assignment-id]');
        if (assignmentElement) {
            return assignmentElement.getAttribute('data-assignment-id');
        }

        // Check for hidden form fields
        const assignmentInput = document.querySelector('input[name="assignment_id"]');
        if (assignmentInput) return assignmentInput.value;

        return null;
    }

    console.log("[Canvas Ranked] Initialization complete!");

})();