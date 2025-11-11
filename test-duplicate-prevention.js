// Test script to check and clear XP storage for testing duplicate prevention
// Run this in the browser console on a Canvas assignment page

console.log("🧪 Testing Canvas Royale duplicate XP prevention...");

// Check current storage state
chrome.storage.local.get(['xpState', 'xpAwardedAssignments', 'bonusCalculatedAssignments'], (result) => {
    console.log("📊 Current Storage State:");
    console.log("XP State:", result.xpState);
    console.log("Awarded Assignments:", result.xpAwardedAssignments);
    console.log("Bonus Calculated Assignments:", result.bonusCalculatedAssignments);
    
    const currentPath = window.location.pathname;
    console.log("📍 Current Assignment Path:", currentPath);
    
    if (result.xpAwardedAssignments && result.xpAwardedAssignments[currentPath]) {
        console.log("✅ This assignment has base XP already awarded");
    } else {
        console.log("❌ This assignment has NOT received base XP");
    }
    
    if (result.bonusCalculatedAssignments && result.bonusCalculatedAssignments[currentPath]) {
        console.log("✅ This assignment has bonus XP already calculated");
    } else {
        console.log("❌ This assignment has NOT received bonus XP");
    }
});

// Function to clear XP for current assignment (for testing)
window.clearCurrentAssignmentXP = function() {
    const currentPath = window.location.pathname;
    chrome.storage.local.get(['xpAwardedAssignments', 'bonusCalculatedAssignments'], (result) => {
        const awarded = result.xpAwardedAssignments || {};
        const bonusCalculated = result.bonusCalculatedAssignments || {};
        
        delete awarded[currentPath];
        delete bonusCalculated[currentPath];
        
        chrome.storage.local.set({
            xpAwardedAssignments: awarded,
            bonusCalculatedAssignments: bonusCalculated
        }, () => {
            console.log("🧹 Cleared XP tracking for current assignment");
            console.log("Now you can test awarding XP again by refreshing the page");
        });
    });
};

// Function to clear ALL XP data (for testing)
window.clearAllXPData = function() {
    chrome.storage.local.clear(() => {
        console.log("🧹 Cleared ALL XP data");
        console.log("Refresh the page to start fresh");
    });
};

console.log("🔧 Test functions available:");
console.log("- clearCurrentAssignmentXP() - Clear XP tracking for this assignment");
console.log("- clearAllXPData() - Clear all XP data");