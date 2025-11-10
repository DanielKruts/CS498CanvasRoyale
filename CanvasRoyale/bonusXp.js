// Constant variables and classes and whatnot for use of whole program
const currentDate = new Date();//Current date and time of user's system

// This is all Daniel's section for extracting the date and times and parsing through them for what I want to use for computing bonus exp
// This mess magically extracts the data point of due-date from the HTML page. Using innerText, I can extract the value of the
// due date I want and parse through it for the specific values of the field I need
const targetNode = document.body; // Or a more specific container if you know it
const config = { childList: true, subtree: true };

// Function to handle the due date parsing
function parseDueDate(dueDateElement) {
    const dueText = dueDateElement.innerText.trim();
    const parsedMatch = dueText.match(/Due:\s\w+\s(\w+)\s(\d+),/);
    if (parsedMatch) {
        const [, month, day] = parsedMatch; // skip "Due:" and day name
        console.log("Month:", month);
        console.log("Day:", day);
        return { month, day };
    } else {
        console.log("No match found");
        return null;
    }
}
// Function to process the due date element when found
function processDueDate(dueDateElement) {
    console.log("Due Date Element found:", dueDateElement);
    console.log("Inner Text:", dueDateElement.innerText);
    
    // Parse the due date
    const parsedDate = parseDueDate(dueDateElement);
    const bonusXp = calculateBonusExp(parsedDate);
    updateBonusXP(bonusXp || 0);
    // Send message to background script if needed
    chrome.runtime.sendMessage({ 
        type: "DUE_DATE_FOUND", 
        data: dueDateElement.innerText,
        parsed: parsedDate
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
    if(!dueDateParsed) return;
    if (currentDate.getMonth() < getMonthNumber(dueDateParsed.month)) {
        if(currentDate.getMonth() - getMonthNumber(dueDateParsed.month) === 1){
            console.log("Eligible for bonus XP! Caclulating...");
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
dueDateParser(dueDateElement);