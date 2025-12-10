// THIS FILE WORKS, CAN DETECT SUBMISSION AND TEST BUTTON COMBO OF ALT X
// CLEAN UP FILE AND REMOVE TEST CODE NO LONGER NEEDED
// RIGHT CLICK THE PAGE, INSPECT, GO TO CONSOLE, AND CHECK LOGS FOR XP AWARDING
// This file is Kaelin's part of the assignment. This will handle awarding a base amount of xp, 
// and detect when an assignment is submitted, or has already been submitted when the page loads.
// XP will only be given once per assignment. Was having trouble getting a bar for XP to show,
// So testing occurs through console logs for now. The script also handles level ups and increasing
// the XP needed for each level

// CONFIG
const XP_STATE_KEY = "xpState";
const SUBMISSION_XP_VALUE = 50; // XP per assignment
const AWARDED_ASSIGNMENTS_KEY = "xpAwardedAssignments";

const BASE_STATE = {
  xp: 0,
  maxXp: 100,
  level: 1,
  totalXp: 0,          // total lifetime XP
  streakDays: 0,       // current streak length in days
  lastActiveDate: null // "YYYY-MM-DD" of last XP gain
};



// Increase the XP needed each level
function growMaxXp(oldMax) {
  return oldMax + 50; // e.g., 100 → 150 → 200 ...
}

// ===== XP LOGIC =====
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

function awardSubmissionXp(amount) {
  chrome.storage.local.get([XP_STATE_KEY], (result) => {
    const prev = result[XP_STATE_KEY] || BASE_STATE;
    const next = applyXp(prev, amount);

    console.log("[XP] Submission detected – awarding XP.");
    console.log("[XP] Previous:", prev, "→ New:", next);

    chrome.storage.local.set({ [XP_STATE_KEY]: next }, () => {
      if (chrome.runtime.lastError) {
        console.error("[XP] Error saving XP state:", chrome.runtime.lastError);
        return;
      }
      if (next.leveledUp) {
        console.log(
          `[XP] Level up! Now level ${next.level}, next level at ${next.maxXp} XP`
        );
      } else {
        console.log("[XP] XP applied successfully.");
      }
    });
  });
}

// Optional: log whenever XP state changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  if (changes[XP_STATE_KEY]) {
    const { oldValue, newValue } = changes[XP_STATE_KEY];

    console.log("[XP] xpState changed:");
    console.log("   Old →", oldValue || "(none)");
    console.log("   New →", newValue);

    // Optional: single-line summary
    if (newValue) {
      console.log(
        `[XP] Now at ${newValue.xp}/${newValue.maxXp} XP (Level ${newValue.level})`
      );
    }
  }
});

// SUBMISSION DETECTION 

// Flag to avoid double-awarding on the same page
let xpAwardedForThisPage = false;

// Gets unique key for each assignment based on URL
function getAssignmentKey() {
  // e.g. "/courses/123/assignments/456"
  return window.location.pathname;
}



// Backup submission check for DOM text for submission indicators
// Find the specific span that shows "SUBMITTED: ..."
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

// True if the page currently shows that submitted span
function pageShowsSubmitted() {
  return !!findSubmittedSpan();
}


function handleSubmissionDetected() {
   if (xpAwardedForThisPage) return; // already handled this page
  xpAwardedForThisPage = true;

  const assignmentKey = getAssignmentKey();

  chrome.storage.local.get([AWARDED_ASSIGNMENTS_KEY], (result) => {
    const awarded = result[AWARDED_ASSIGNMENTS_KEY] || {};

    if (awarded[assignmentKey]) {
      console.log(
        "[XP] XP for this assignment was already awarded before. Skipping."
      );
      return;
    }

    // Mark this assignment as awarded
    awarded[assignmentKey] = true;

    chrome.storage.local.set(
      { [AWARDED_ASSIGNMENTS_KEY]: awarded },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "[XP] Error saving awarded assignment map:",
            chrome.runtime.lastError
          );
          return;
        }

        console.log(
          "[XP] First time awarding XP for this assignment. Proceeding."
        );
        awardSubmissionXp(SUBMISSION_XP_VALUE);
      }
    );
  });
}

// Watch for DOM changes that might reveal a “Submitted” message
function observeForSubmission() {
  const observer = new MutationObserver(() => {
    if (pageShowsSubmitted()) {
      console.log("[XP] Submission state detected in DOM.");
      handleSubmissionDetected();
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("[XP] Watching for submission confirmation in DOM…");
}

// ===== INIT =====
function init() {
  // If page already shows a submission (e.g., you reload after submitting)
  if (pageShowsSubmitted()) {
    console.log("[XP] Submission already present on load.");
    handleSubmissionDetected();
  } else {
    setupRealSubmissionDetection();
  }

  // TEMP TEST HOOK: simulate submission with Alt+X
  // REMOVE FOR FINAL SUBMISSION
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.key.toLowerCase() === "x") {
      console.log("[XP TEST] Alt+X pressed – simulating submission.");
      handleSubmissionDetected();
    }
  });
}

function setupRealSubmissionDetection() {
  // If already shows as submitted when the page loads
  if (pageShowsSubmitted()) {
    console.log("[XP] Submission already present on load.");
    handleSubmissionDetected();
    return;
  }

  console.log("[XP] Watching for submitted span in DOM…");

  const observer = new MutationObserver(() => {
    if (pageShowsSubmitted()) {
      console.log("[XP] Detected submitted span: assignment is submitted.");
      handleSubmissionDetected();
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

function init() {
  setupRealSubmissionDetection();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
