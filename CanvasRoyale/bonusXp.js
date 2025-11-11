// Constant variables and classes and whatnot for use of whole program
const currentDate = new Date();//Current date and time of user's system

console.log("[Bonus XP] Script loaded! Looking for due dates and grades...");
console.log("[Bonus XP] Current URL:", window.location.href);
console.log("[Bonus XP] Current domain:", window.location.hostname);

// Check immediately if due date element exists
console.log("[Bonus XP] Looking for due date element...");
const immediateCheck = document.querySelector('[data-testid="due-date"]');
if (immediateCheck) {
    console.log("[Bonus XP] Found due date element immediately!");
} else {
    console.log("[Bonus XP] No due date element found yet, setting up observer...");
}

// This is all Daniel's section for extracting the date and times and parsing through them for what I want to use for computing bonus exp
// This mess magically extracts the data point of due-date from the HTML page. Using innerText, I can extract the value of the
// due date I want and parse through it for the specific values of the field I need
const targetNode = document.body; // Or a more specific container if you know it
const config = { childList: true, subtree: true };

// Function to handle the due date parsing
function parseDueDate(dueDateElement) {
    const dueText = dueDateElement.innerText.trim();
    
    // Try the original format first: "Due: Thu Sep 5, 2025"
    const originalMatch = dueText.match(/Due:\s\w+\s(\w+)\s(\d+),/);
    if (originalMatch) {
        const [, month, day] = originalMatch;
        console.log("Original format - Month:", month, "Day:", day);
        return { month, day };
    }
    
    // Try simple date format: "9/5/2025" or "Sep 5, 2025"
    const simpleMatch = dueText.match(/(\d+)\/(\d+)\/(\d+)/);
    if (simpleMatch) {
        const [, month, day, year] = simpleMatch;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthName = monthNames[parseInt(month) - 1];
        console.log("📅 Simple format - Month:", monthName, "Day:", day);
        return { month: monthName, day: parseInt(day) };
    }
    
    console.log("No date match found for:", dueText);
    return null;
}
// Function to process the due date element when found
async function processDueDate(dueDateElement) {
    console.log("Due Date Element found:", dueDateElement);
    console.log("Inner Text:", dueDateElement.innerText);
    
    // Parse the due date
    const parsedDate = parseDueDate(dueDateElement);
    
    // Calculate total bonus XP (due date + grade)
    const totalBonusXp = await calculateTotalBonusXP(parsedDate);
    updateBonusXP(totalBonusXp);
    
    // Send message to background script if needed
    chrome.runtime.sendMessage({ 
        type: "BONUS_XP_CALCULATED", 
        dueDateBonus: calculateBonusExp(parsedDate) || 0,
        gradeBonus: await checkForGradeBonus(),
        total: totalBonusXp
    });
}
// Waits for changes to the webpage's structure to give the webpage time
// to load the due date element before trying to access it
const callback = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const dueDateElement = document.querySelector('[data-testid="due-date"]');
            if (dueDateElement) {
                processDueDate(dueDateElement);
                observer.disconnect(); // Stop observing once found
                return; // Exit callback once element is found
            }
        }
    }
};

const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// Also check immediately in case the element is already present when the script runs
const initialDueDateElement = document.querySelector('[data-testid="due-date"]');
if (initialDueDateElement) {
    processDueDate(initialDueDateElement);
    observer.disconnect(); // Stop observing if found right away
}

//Enumerates the months of the year to compare for bonus XP calculation
function getMonthNumber(monthName){
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames.indexOf(monthName);
}

// The main function for calculating the bonus XP based on the due date and current date
function calculateBonusExp(dueDateParsed){
    if(!dueDateParsed) return 0;
    
    let bonusXp = 0; // Declare the variable
    
    if (currentDate.getMonth() < getMonthNumber(dueDateParsed.month)) {
        if(currentDate.getMonth() - getMonthNumber(dueDateParsed.month) === 1){
            console.log("Eligible for bonus XP! Calculating...");
            bonusXp = (dueDateParsed.day - currentDate.getDate()) * 5;
            console.log("Bonus XP awarded: " + bonusXp);
        }else{
            console.log("Bonus XP not available yet, not the month before the due date.");
            bonusXp = 0;
        }
    }else if (currentDate.getMonth() === getMonthNumber(dueDateParsed.month)){
        console.log("Same month, checking day...");
        if(currentDate.getDate() < dueDateParsed.day){
            console.log("Eligible for bonus XP!");
            bonusXp = (dueDateParsed.day - currentDate.getDate()) * 5;
            console.log("Bonus XP awarded: " + bonusXp);
        }else{
            console.log("Not eligible for bonus XP.");
            bonusXp = 0;
        }
    }
    return bonusXp;
}

// Check if it already exists (avoid duplicates)
if (!document.getElementById("bonusxp-box")) {
  // Create a container for the XP box
  const box = document.createElement("div");
  box.id = "bonusxp-box";
  
  // Set its contents (this can later be updated dynamically)
  box.innerHTML = `
    <div style="font-size:18px; font-weight:bold;">🏅 Bonus XP</div>
    <div id="bonusxp-value" style="font-size:24px;">0</div>
  `;
  
  // Base positioning and layout styles
  Object.assign(box.style, {
    position: "fixed",
    top: "100px",          // adjust to move vertically
    left: "540.88px",      // adjust horizontally
    padding: "15px 20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    fontFamily: "sans-serif",
    zIndex: "9999",
    width: "150px",
    textAlign: "center",
    transition: "background-color 0.3s, color 0.3s, box-shadow 0.3s"
  });
  
  // Add to page
  document.body.appendChild(box);

  // Add adaptive theme styles
  const style = document.createElement("style");
  style.textContent = `
    /* Light Mode */
    @media (prefers-color-scheme: light) {
      #bonusxp-box {
        background-color: white;
        color: black;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      #bonusxp-value {
        color: #4caf50;
      }
    }

    /* Dark Mode */
    @media (prefers-color-scheme: dark) {
      #bonusxp-box {
        background-color: #1e1e1e;
        color: #f1f1f1;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
      }
      #bonusxp-value {
        color: #8bc34a;
      }
    }
  `;
  document.head.appendChild(style);
}

// Function to update Bonus XP value dynamically
function updateBonusXP(value) {
  const xpValue = document.getElementById("bonusxp-value");
  if (xpValue) xpValue.textContent = value;
}

// Grade Bonus XP Configuration
const GRADE_BONUS_CONFIG = {
    A: 20,        // x >= 90%
    B: 10,        // 80% <= x < 90%
    C: 0,         // 70% <= x < 80%
    BELOW_C: -10  // x < 70%
};

// Calculate grade bonus XP
function calculateGradeBonus(percentage) {
    if (percentage >= 90) return GRADE_BONUS_CONFIG.A;
    if (percentage >= 80) return GRADE_BONUS_CONFIG.B;
    if (percentage >= 70) return GRADE_BONUS_CONFIG.C;
    return GRADE_BONUS_CONFIG.BELOW_C;
}

// Extract course/assignment IDs from URL
function extractCourseIDFromURL() {
    const match = window.location.pathname.match(/\/courses\/(\d+)/);
    return match ? match[1] : null;
}

function extractAssignmentIDfromURL() {
    const match = window.location.pathname.match(/\/assignments\/(\d+)/);
    return match ? match[1] : null;
}

// Check for grades via Canvas API
async function checkForGradeBonus() {
    const courseID = extractCourseIDFromURL();
    const assignmentID = extractAssignmentIDfromURL();
    
    if (!courseID || !assignmentID) {
        console.log("[Grade Bonus] Not on assignment page");
        return 0;
    }

    try {
        const token = '1139~GAkLm4nT6hYxyN8JVtuNmfGKxteCZ3vYWuhZmhDXHeNaYNMC94uyyuWr8ua8A9Mk'; // Temporary hardcoded token
        const apiURL = `${window.location.origin}/api/v1/courses/${courseID}/assignments/${assignmentID}/submissions/self`;
        const response = await fetch(apiURL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const submission = await response.json();
            console.log("🔍 [DEBUG] Full submission object:", submission);
            
            // Show submission timing information
            if (submission.submitted_at) {
                const submittedDate = new Date(submission.submitted_at);
                console.log("SUBMITTED AT:", submittedDate.toLocaleString());
                console.log("Submitted timestamp:", submission.submitted_at);
            }
            
            if (submission.assignment?.due_at) {
                const dueDate = new Date(submission.assignment.due_at);
                console.log("DUE AT:", dueDate.toLocaleString());
                console.log("Due timestamp:", submission.assignment.due_at);
            }
            
            // Calculate if submitted early/late
            if (submission.submitted_at && submission.assignment?.due_at) {
                const submitTime = new Date(submission.submitted_at);
                const dueTime = new Date(submission.assignment.due_at);
                const timeDiff = dueTime - submitTime;
                const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                
                if (daysDiff > 0) {
                    console.log(`SUBMITTED EARLY: ${daysDiff} days before due date`);
                } else if (daysDiff < 0) {
                    console.log(`SUBMITTED LATE: ${Math.abs(daysDiff)} days after due date`);
                } else {
                    console.log("SUBMITTED ON DUE DATE");
                }
            }
            
            if (submission.score !== null) {
                // Try multiple sources for points possible
                let pointsPossible = submission.assignment?.points_possible || 
                                   submission.points_possible || 
                                   submission.assignment_points_possible;
                
                console.log("[DEBUG] Raw points possible:", pointsPossible);
                console.log("[DEBUG] Score:", submission.score);
                console.log("[DEBUG] Grade:", submission.grade);
                
                // If we can't find points possible, try to infer from the grade
                if (!pointsPossible || pointsPossible === 100) {
                    // Check if grade matches score (like "10" and 10)
                    if (submission.grade && submission.grade === submission.score.toString()) {
                        // This might be a case where it's actually out of the score value
                        // For a 10/10 assignment, score=10, grade="10", we want pointsPossible=10
                        pointsPossible = submission.score;
                        console.log("[DEBUG] Inferred points possible from score:", pointsPossible);
                    } else {
                        // Default fallback
                        pointsPossible = pointsPossible || 100;
                    }
                }
                
                const percentage = (submission.score / pointsPossible) * 100;
                const gradeBonus = calculateGradeBonus(percentage);
                
                console.log(`GRADE: ${submission.score}/${pointsPossible} = ${percentage.toFixed(1)}%`);
                console.log(`GRADE BONUS: ${gradeBonus} XP`);
                
                return gradeBonus;
            }
        }
    } catch (error) {
        console.error("[Grade Bonus] API failed:", error);
    }
    
    return 0;
}

// Enhanced function to calculate total bonus (due date + grade)
async function calculateTotalBonusXP(dueDateParsed) {
    // Calculate due date bonus (enhanced logic with submission timing)
    let dueDateBonus = 0;
    if (dueDateParsed) {
        dueDateBonus = await calculateSubmissionTimingBonus(dueDateParsed);
    }
    
    // Calculate grade bonus (new logic)
    const gradeBonus = await checkForGradeBonus();
    
    // Total bonus
    const totalBonus = dueDateBonus + gradeBonus;
    
    console.log(`TOTAL BONUS: Due Date (${dueDateBonus}) + Grade (${gradeBonus}) = ${totalBonus} XP`);
    
    return totalBonus;
}

// New function to calculate submission timing bonus
async function calculateSubmissionTimingBonus(dueDateParsed) {
    try {
        // Get submission data from Canvas API
        const assignmentId = extractAssignmentIDfromURL();
        if (!assignmentId) {
            console.log("[Submission Timing] No assignment ID found");
            return 0;
        }

        const courseId = extractCourseIDFromURL();
        const token = '1139~GAkLm4nT6hYxyN8JVtuNmfGKxteCZ3vYWuhZmhDXHeNaYNMC94uyyuWr8ua8A9Mk'; // Use same token as grade bonus
        
        const apiURL = `${window.location.origin}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self`;
        const response = await fetch(apiURL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            console.log("[Submission Timing] No submission data found");
            return 0;
        }

        const submission = await response.json();
        
        if (!submission.submitted_at) {
            console.log("[Submission Timing] Assignment not submitted yet");
            return 0;
        }

        // Parse submission date
        const submissionDate = new Date(submission.submitted_at);
        console.log(`SUBMISSION DATE: ${submissionDate.toLocaleDateString()}, ${submissionDate.toLocaleTimeString()}`);
        
        // Parse due date - convert parsed due date back to Date object
        let dueDate;
        if (dueDateParsed.month && dueDateParsed.day) {
            // Assume current year if not specified
            const year = dueDateParsed.year || new Date().getFullYear();
            const monthIndex = getMonthNumber(dueDateParsed.month);
            dueDate = new Date(year, monthIndex, dueDateParsed.day, 23, 59, 59); // End of due date
        }
        
        if (!dueDate) {
            console.log("[Submission Timing] Could not parse due date");
            return 0;
        }
        
        console.log(`DUE DATE: ${dueDate.toLocaleDateString()}, ${dueDate.toLocaleTimeString()}`);
        
        // Calculate difference in days
        const timeDifference = dueDate.getTime() - submissionDate.getTime();
        const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        
        console.log(`DAYS DIFFERENCE: ${daysDifference} days`);
        
        let timingBonus = 0;
        
        if (daysDifference > 0) {
            // Submitted early - bonus XP
            timingBonus = Math.min(daysDifference * 5, 50); // Max 50 XP for early submission
            console.log(`EARLY SUBMISSION: ${daysDifference} days early = ${timingBonus} XP bonus`);
        } else if (daysDifference < 0) {
            // Submitted late - penalty
            timingBonus = Math.max(daysDifference * 2, -20); // Max -20 XP penalty for late
            console.log(`LATE SUBMISSION: ${Math.abs(daysDifference)} days late = ${timingBonus} XP penalty`);
        } else {
            // Submitted on due date
            console.log(`ON TIME SUBMISSION: No bonus or penalty`);
        }
        
        return timingBonus;
        
    } catch (error) {
        console.error("[Submission Timing] Error calculating timing bonus:", error);
        return 0;
    }
}
// dueDateParser(dueDateElement);