(function () {
    console.log("[Canvas Royale] Injecting XP system...");

    // XP Configuration
    const XP_CONFIG = {
        ASSIGNMENT_BASE: 20,
        GRADE_BONUS: {
            A: 20,        // x >= 90%
            B: 10,        // 80% <= x < 90%
            C: 0,         // 70% <= x < 80%
            BELOW_C: -10   // x < 70%
        },
    };

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
})();