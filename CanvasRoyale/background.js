async function getAuth() {
    return await chrome.storage.local.get(["token", "canvasDomain"]);
}

async function fetchAssignment(courseId, assignmentId, token, canvasDomain) {
    const url = `https://${canvasDomain}/api/v1/courses/${courseId}/assignments/${assignmentId}`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Assignment fetch failed: ${res.status}`);
    return res.json();
}

async function fetchSubmission(courseId, assignmentId, token, canvasDomain) {
    const url = `https://${canvasDomain}/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Submission fetch failed: ${res.status}`);
    return res.json();
}

function calculateXP(submission, assignment, isTest = false) {
    let xp = 100; // Base XP

    if (isTest) {
        console.log("[Canvas Ranked] Test submission - awarding base XP only");
        return xp;
    }

    if (assignment.due_at && submission.submitted_at) {
        const due = new Date(assignment.due_at);
        const submitted = new Date(submission.submitted_at);

        if (submitted < due) {
            xp += 50;     // Early bonus
            console.log(`[Canvas Ranked] Early submission! +50 XP bonus`);
        } else if (submitted > due) {
            xp = Math.max(70, xp - 30); // Late penalty, minimum 70 XP
            console.log(`[Canvas Ranked] Late submission! -30 XP penalty`);
        }
    }

    console.log(`[Canvas Ranked] XP earned: ${xp}`);
    return xp;
}

async function addXP(amount, reason = "") {
    const { xp = 0 } = await chrome.storage.local.get("xp");
    const newXP = xp + amount;
    await chrome.storage.local.set({ xp: newXP });

    console.log(`[Canvas Ranked] ${reason} - Added ${amount} XP. Total: ${newXP}`);

    // Notify all tabs to update display
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: "xpUpdated", xp: newXP })
                .catch(err => { });
        });
    });
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.type === "assignmentSubmitted") {
        const { courseId, assignmentId, isTest } = msg;
        const { token, canvasDomain } = await getAuth();

        if (!token || !canvasDomain) {
            console.warn("[Canvas Ranked] No authentication found.");
            return;
        }

        if (!courseId || !assignmentId) {
            console.warn("[Canvas Ranked] Missing course or assignment ID.");
            return;
        }

        try {
            console.log(`[Canvas Ranked] Processing ${isTest ? 'TEST ' : ''}submission`);

            if (isTest) {
                await addXP(100, "Test assignment submission");
                return;
            }

            const [assignment, submission] = await Promise.all([
                fetchAssignment(courseId, assignmentId, token, canvasDomain),
                fetchSubmission(courseId, assignmentId, token, canvasDomain)
            ]);

            if (!submission || submission.errors) {
                console.warn("[Canvas Ranked] No submission data found");
                return;
            }

            if (submission.workflow_state === "submitted" || submission.submitted_at) {
                const xp = calculateXP(submission, assignment, isTest);
                await addXP(xp, `Assignment submission`);
            }
        } catch (err) {
            console.error("[Canvas Ranked] Error processing submission:", err);
        }
    }

    // New handler for bonus XP checks
    if (msg.type === "checkBonusXP") {
        try {
            console.log("[Canvas Ranked] Bonus XP check requested");
            // Send message to the same tab to trigger bonus calculation
            chrome.tabs.sendMessage(sender.tab.id, { 
                type: "triggerBonusCalculation",
                url: msg.url 
            });
        } catch (err) {
            console.error("[Canvas Ranked] Error triggering bonus calculation:", err);
        }
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("[Canvas Ranked] Extension installed!");
});