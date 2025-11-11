# CS498CanvasRoyale
Chrome Web Extension for Canvas to better motivate students to turn in assignments early and with good grades as the outcome

# How to run
1. Locate your extension settings on your browser, will work best on chrome.
2. Locate the developer mode button in the top right of your screen and set it to on.
3. Click the "Load unpacked" button in the top left and when prompted, choose the CanvasRoyale folder that you have downloaded
4. Have fun watching your exp go up as you continue your week and submit your assignments!!

# User Stories for Prototype
As a student, I want to earn XP for completing Canvas assignments so that I feel rewarded for staying on top of my work. 
    Acceptance Criteria:	 
        - When I submit an assignment on Canvas, the extension detects it and adds XP 
        - Submitting before the due date	give extra XP, and late submissions give less 
        - My total XP updates right away in the extension’s dashboard 
As a student, I want my XP to increase my rank (Bronze -> Silver -> Gold -> Platinum -> Diamond) so that I can see my overall progress. 
    Acceptance Criteria: 
        - Each rank has a specific XP range 
        - When I level up, my badge and profile background change 
        - I can see how close I am to the next rank on my progress bar 
As a student, I want to get extra XP for high grades so that doing well in class gives me extra rewards. 
    Acceptance Criteria: 
        - The extension uses Canvas’s grade data to calculate bonus XP 
        - Higher grades give a bigger bonus 
        - Top 10% of the class gets an additional XP boost 