// Constant variables and classes and whatnot for use of whole program
const currentDate = new Date();


// Base XP value
// Max value to show end of bar
const BASE_VALUE = {
    xp: 10,
    max_Xp: 100,
    level: 1
};

function getXpState(callback) {
    chrome.storage.sync.get({ xpState: DEFAULT_XP_STATE }, ({ xpState }) => {
    callback(xpState);
    });
}

function setXpState(xpState, callback) {
    chrome.storage.sync.set({ xpState }, callback)
}



// This is all Daniel's section for extracting the date and times and parsing through them for what I want to use for computing bonus exp
// This mess magically extracts the data point of due-date from the HTML page. Using innerText, I can extract the value of the
// due date I want and parse through it for the specific values of the field I need
// Wait for the DOM to be fully loaded before trying to access elements.

const targetNode = document.body; // Or a more specific container if you know it
const config = { childList: true, subtree: true };

// Function to handle the due date parsing
function parseDueDate(dueDateElement) {
    const dueText = dueDateElement.innerText.trim();
    const parsedMatch = dueText.match(/Due: \w+/);
    console.log("Parsed String: ", parsedMatch);
    return parsedMatch;
}

// Function to process the due date element when found
function processDueDate(dueDateElement) {
    console.log("Due Date Element found:", dueDateElement);
    console.log("Inner Text:", dueDateElement.innerText);
    
    // Parse the due date
    const parsedDate = parseDueDate(dueDateElement);
    
    // Send message to background script if needed
    chrome.runtime.sendMessage({ 
        type: "DUE_DATE_FOUND", 
        data: dueDateElement.innerText,
        parsed: parsedDate
    });
}

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


function calculateBonusExp(dueDateParsed){

}

dueDateParser(dueDateElement);