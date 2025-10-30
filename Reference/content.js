(function () {
    console.log("[Canvas Ranked] Injecting widget...");

    // Create the XP display element
    const widget = document.createElement("div");
    widget.id = "canvas-ranked-widget";
    widget.style.position = "fixed";
    widget.style.bottom = "20px";
    widget.style.right = "20px";
    widget.style.zIndex = "9999";
    widget.style.background = "#1976d2";
    widget.style.color = "white";
    widget.style.padding = "10px 16px";
    widget.style.borderRadius = "12px";
    widget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    widget.style.fontFamily = "sans-serif";
    widget.style.fontWeight = "bold";
    widget.style.cursor = "pointer";
    widget.textContent = "XP: loading...";

    document.body.appendChild(widget);

    // Load XP from storage
    chrome.storage.local.get(["xp"], (result) => {
        let currentXP = result.xp || 0;
        widget.textContent = `XP: ${currentXP}`;
    });

    // Award XP if on assignment page
    if (window.location.href.includes("/assignments/")) {
        chrome.storage.local.get(["xp"], (result) => {
            let newXP = (result.xp || 0) + 20;
            chrome.storage.local.set({ xp: newXP });
            widget.textContent = `XP: ${newXP}`;

            // Show +20 animation
            const anim = document.createElement("div");
            anim.textContent = "+20 XP!";
            anim.style.position = "fixed";
            anim.style.bottom = "60px";
            anim.style.right = "30px";
            anim.style.fontSize = "18px";
            anim.style.fontWeight = "bold";
            anim.style.color = "#43a047";
            anim.style.transition = "all 1.5s ease-out";
            anim.style.opacity = "1";
            document.body.appendChild(anim);

            setTimeout(() => {
                anim.style.transform = "translateY(-40px)";
                anim.style.opacity = "0";
            }, 100);
            setTimeout(() => anim.remove(), 1500);
        });
    }

    // Clicking the widget gives bonus XP
    widget.addEventListener("click", () => {
        chrome.storage.local.get(["xp"], (result) => {
            let newXP = (result.xp || 0) + 10;
            chrome.storage.local.set({ xp: newXP });
            widget.textContent = `XP: ${newXP}`;
        });
    });
})();
