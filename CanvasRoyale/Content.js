(function () {
    console.log("[Canvas Royale] Injecting XP system...");

    // XP Configuration
    const XP_CONFIG = {
        ASSIGNMENT_BASE: 20,
        EARLY_SUBMISSION_BONUS: 15,
        LATE_SUBMISSION_PENALTY: -10,
        GRADE_BONUS: {
            A_PLUS: 50,   // 97-100%
            A: 40,        // 93-96%
            A_MINUS: 30,  // 90-92%
            B_PLUS: 20,   // 87-89%
            B: 15,        // 83-86%
            B_MINUS: 10,  // 80-82%
            C_PLUS: 5,    // 77-79%
            C: 0,         // 73-76%
            BELOW_C: -5   // Below 73%
        },
        TOP_10_PERCENT_BONUS: 25
    };

    // Rank thresholds
    const RANKS = {
        BRONZE: { min: 0, max: 199, name: "Bronze", color: "#CD7F32" },
        SILVER: { min: 200, max: 499, name: "Silver", color: "#C0C0C0" },
        GOLD: { min: 500, max: 999, name: "Gold", color: "#FFD700" },
        PLATINUM: { min: 1000, max: 1999, name: "Platinum", color: "#E5E4E2" },
        DIAMOND: { min: 2000, max: Infinity, name: "Diamond", color: "#B9F2FF" }
    };

    // Create the XP display widget
    function createXPWidget() {
        const widget = document.createElement("div");
        widget.id = "canvas-royale-widget";
        widget.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 18px;
            border-radius: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 120px;
            text-align: center;
        `;
        
        widget.innerHTML = `
            <div style="font-size: 14px; margin-bottom: 4px;">XP: <span id="xp-value">loading...</span></div>
            <div id="rank-display" style="font-size: 12px; opacity: 0.9;">Bronze</div>
        `;

        // Hover effect
        widget.addEventListener('mouseenter', () => {
            widget.style.transform = 'scale(1.05)';
            widget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        });
        
        widget.addEventListener('mouseleave', () => {
            widget.style.transform = 'scale(1)';
            widget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });

        document.body.appendChild(widget);
        return widget;
    }

    // Calculate rank based on XP
    function calculateRank(xp) {
        for (const [key, rank] of Object.entries(RANKS)) {
            if (xp >= rank.min && xp <= rank.max) {
                return rank;
            }
        }
        return RANKS.BRONZE;
    }

    // Update XP display
    function updateXPDisplay(xp) {
        const xpValueElement = document.getElementById('xp-value');
        const rankElement = document.getElementById('rank-display');
        const widget = document.getElementById('canvas-royale-widget');
        
        if (xpValueElement && rankElement && widget) {
            xpValueElement.textContent = xp;
            const rank = calculateRank(xp);
            rankElement.textContent = rank.name;
            
            // Update widget color based on rank
            widget.style.background = `linear-gradient(135deg, ${rank.color} 0%, #764ba2 100%)`;
        }
    }

    // Show XP animation
    function showXPAnimation(amount, reason = "") {
        const animation = document.createElement("div");
        const isPositive = amount > 0;
        
        animation.textContent = `${isPositive ? '+' : ''}${amount} XP${reason ? ' - ' + reason : '!'}`;
        animation.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 30px;
            z-index: 10000;
            font-size: 18px;
            font-weight: bold;
            color: ${isPositive ? '#43a047' : '#d32f2f'};
            background: white;
            padding: 8px 12px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 1.5s ease-out;
            opacity: 1;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        
        document.body.appendChild(animation);

        setTimeout(() => {
            animation.style.transform = "translateY(-60px)";
            animation.style.opacity = "0";
        }, 100);
        
        setTimeout(() => animation.remove(), 1600);
    }

    // Parse grade percentage from Canvas grade display
    function parseGradePercentage(gradeText) {
        // Look for percentage patterns like "85%", "92.5%", etc.
        const percentMatch = gradeText.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
            return parseFloat(percentMatch[1]);
        }
        
        // Look for fraction patterns like "85/100", "42.5/50", etc.
        const fractionMatch = gradeText.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
        if (fractionMatch) {
            const earned = parseFloat(fractionMatch[1]);
            const total = parseFloat(fractionMatch[2]);
            return (earned / total) * 100;
        }
        
        return null;
    }

    // Calculate grade bonus XP
    function calculateGradeBonus(percentage) {
        if (percentage >= 97) return XP_CONFIG.GRADE_BONUS.A_PLUS;
        if (percentage >= 93) return XP_CONFIG.GRADE_BONUS.A;
        if (percentage >= 90) return XP_CONFIG.GRADE_BONUS.A_MINUS;
        if (percentage >= 87) return XP_CONFIG.GRADE_BONUS.B_PLUS;
        if (percentage >= 83) return XP_CONFIG.GRADE_BONUS.B;
        if (percentage >= 80) return XP_CONFIG.GRADE_BONUS.B_MINUS;
        if (percentage >= 77) return XP_CONFIG.GRADE_BONUS.C_PLUS;
        if (percentage >= 73) return XP_CONFIG.GRADE_BONUS.C;
        return XP_CONFIG.GRADE_BONUS.BELOW_C;
    }

    // Check for new grades and award bonus XP
    function checkForGrades() {
        // Look for grade displays in various Canvas page types
        const gradeSelectors = [
            '.grade',
            '.score',
            '[data-testid="grade-display"]',
            '.assignment-score',
            '.points_possible',
            '.grade-display'
        ];
        
        gradeSelectors.forEach(selector => {
            const gradeElements = document.querySelectorAll(selector);
            gradeElements.forEach(element => {
                if (element.dataset.xpProcessed) return; // Skip if already processed
                
                const gradeText = element.textContent.trim();
                const percentage = parseGradePercentage(gradeText);
                
                if (percentage !== null) {
                    element.dataset.xpProcessed = 'true';
                    awardGradeBonus(percentage);
                }
            });
        });
    }

    // Award grade bonus XP
    function awardGradeBonus(percentage) {
        const bonusXP = calculateGradeBonus(percentage);
        
        if (bonusXP !== 0) {
            chrome.storage.local.get(['xp'], (result) => {
                const newXP = (result.xp || 0) + bonusXP;
                chrome.storage.local.set({ xp: newXP });
                updateXPDisplay(newXP);
                
                const gradeMessage = percentage >= 90 ? "Great work!" : 
                                   percentage >= 80 ? "Good job!" : "Keep trying!";
                showXPAnimation(bonusXP, gradeMessage);
            });
        }
    }

    // Check if assignment was submitted early/late
    function checkSubmissionTiming() {
        // Look for due date and submission date information
        const dueDateElements = document.querySelectorAll('[data-testid="due-date"], .due-date, .assignment-due-date');
        const submissionElements = document.querySelectorAll('[data-testid="submission-date"], .submission-date, .submitted-at');
        
        // This is a simplified check - in a real implementation, you'd parse the dates and compare
        // For now, we'll award base XP for being on an assignment page
        if (window.location.href.includes('/assignments/') && !document.body.dataset.xpAwarded) {
            document.body.dataset.xpAwarded = 'true';
            awardAssignmentXP();
        }
    }

    // Award base assignment XP
    function awardAssignmentXP() {
        chrome.storage.local.get(['xp'], (result) => {
            const baseXP = XP_CONFIG.ASSIGNMENT_BASE;
            const newXP = (result.xp || 0) + baseXP;
            chrome.storage.local.set({ xp: newXP });
            updateXPDisplay(newXP);
            showXPAnimation(baseXP, "Assignment viewed!");
        });
    }

    // Initialize the extension
    function initialize() {
        const widget = createXPWidget();
        
        // Load and display current XP
        chrome.storage.local.get(['xp'], (result) => {
            const currentXP = result.xp || 0;
            updateXPDisplay(currentXP);
        });

        // Check for grades periodically
        setInterval(checkForGrades, 3000);
        
        // Check submission timing
        setTimeout(checkSubmissionTiming, 1000);
        
        // Manual XP gain on widget click (for testing)
        widget.addEventListener('click', () => {
            chrome.storage.local.get(['xp'], (result) => {
                const newXP = (result.xp || 0) + 10;
                chrome.storage.local.set({ xp: newXP });
                updateXPDisplay(newXP);
                showXPAnimation(10, "Manual boost!");
            });
        });
    }

    // Start the extension when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();