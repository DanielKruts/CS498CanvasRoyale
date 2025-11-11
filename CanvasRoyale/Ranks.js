const RANKS = [
  { name: "Bronze",   min: 0,     max: 499,  badge: "",   bg: "" },
  { name: "Silver",   min: 500,   max: 1499, badge: "",   bg: "" },
  { name: "Gold",     min: 1500,  max: 3499, badge: "",     bg: "" },
  { name: "Platinum", min: 3500,  max: 6999, badge: "", bg: "" },
  { name: "Diamond",  min: 7000,  max: Infinity, badge: "", bg: "" },
];

function getRankFor(totalXp) {
    const Rank = RANKS.find(r => totalXp >= r.min && totalXp <= r.max) || RANKS[RANKS.length - 1];
    console.log(Rank);
    return Rank;
}

function getProgressInRank(totalXp) {
  const r = getRankFor(totalXp);
  const span = (r.max === Infinity ? Math.max(1, r.min) : (r.max - r.min + 1));
  const into = totalXp - r.min;
  const pct = r.max === Infinity ? 100 : Math.max(0, Math.min(100, Math.floor((into / span) * 100)));
  const nextAt = (r.max === Infinity ? null : r.max + 1);
  return { rank: r, percent: pct, nextAt };
}



function changeRank(rank) {
    img.src = chrome.runtime.getURL("Assets/" + rank.name + ".png");
    document.body.appendChild(img)
}


//---------------Tests-----------------------------
getRankFor(1550)

setTimeout(() => {
    getRankFor(3500);
}, 1000);

const badgeURL = chrome.runtime.getURL("Assets/Bronze.png");

const img = document.createElement("img");
img.src = badgeURL;
img.style.position = "fixed";
img.style.top = "20px";
img.style.left = "20px";
img.style.width = "120px";
img.style.zIndex = "999999";
img.style.pointerEvents = "none";

document.body.appendChild(img);

/*
setTimeout(() => {
    img.src = chrome.runtime.getURL("Assets/Silver.png");
    document.body.appendChild(img)
}, 7000);
*/
// setTimeout(() => {
//     totalXp = 3780;

//     rank = getRankFor(totalXp);
//     changeRank(rank);
// }, 10000);



