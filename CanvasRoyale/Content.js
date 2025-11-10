// Base XP value and state management (from incoming changes)
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

// Your Canvas API integration for grade bonus XP
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
        if (percentage >= 90) return XP_CONFIG.GRADE_BONUS.A;
        if (percentage >= 80) return XP_CONFIG.GRADE_BONUS.B;
        if (percentage >= 70) return XP_CONFIG.GRADE_BONUS.C;
        return XP_CONFIG.GRADE_BONUS.BELOW_C;
    }

    // Extract course/assignments IDs from URL
    function extractCourseIDFromURL() {
        const match = window.location.pathname.match(/\/courses\/(\d+)/);
        return match ? match[1] : null;
    }

    function extractAssignmentIDfromURL() {
        const match = window.location.pathname.match(/\/assignments\/(\d+)/);
        return match ? match[1] : null;
    }

    // API-based grade checking
    async function checkForGradesViaAPI() {
        const courseID = extractCourseIDFromURL();
        const assignmentID = extractAssignmentIDfromURL();
        
        console.log(`[Canvas Royale] Course ID: ${courseID}, Assignment ID: ${assignmentID}`);
        
        if (!courseID || !assignmentID) {
            console.log("[Canvas Royale] Not on an assignment page or missing IDs");
            return;
        }

        try {
            const token = '1139~GF4V6MfF7LwauzKZnFKhB6kvUBCC24F6HVKavLBC8f8mvBBzCcthB4YuatRvXMxE'; // Replace with your actual Canvas API token
            const apiURL = `${window.location.origin}/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/self`;
            
            console.log(`[Canvas Royale] Making API call to: ${apiURL}`);
            
            const response = await fetch(apiURL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const submission = await response.json();
                console.log("[Canvas Royale] API Response:", submission);
                
                if (submission.score !== null) {
                    // Try to get points possible from different possible locations
                    let pointsPossible = submission.assignment?.points_possible || 
                                       submission.points_possible || 
                                       100; // Default assumption
                    
                    // If we have a grade like "93" and score "93", it might be out of 100
                    if (submission.grade && submission.grade === submission.score.toString()) {
                        pointsPossible = 100;
                    }
                    
                    const percentage = (submission.score / pointsPossible) * 100;
                    const bonusXP = calculateGradeBonus(percentage);
                    
                    console.log(`🎯 GRADE: ${submission.score}/${pointsPossible} = ${percentage.toFixed(1)}%`);
                    console.log(`⭐ BONUS XP: ${bonusXP}`);
                } else {
                    console.log("❌ No grade found for this assignment");
                }
            } else {
                console.error(`[Canvas Royale] API Error: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error("[Canvas Royale] API grade check failed:", error);
        }
    }

    // Initialize and test the grade checking
    console.log("[Canvas Royale] Starting grade check...");
    checkForGradesViaAPI();

})();
