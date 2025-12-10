// Ranks.js - rank definitions + helpers
// Ranks array keeps the borders for each rank for easy adjustment/expansion
const RANKS = [
  { name: "Bronze",   minLevel: 1,  maxLevel: 4 },
  { name: "Silver",   minLevel: 5,  maxLevel: 9 },
  { name: "Gold",     minLevel: 10, maxLevel: 14 },
  { name: "Platinum", minLevel: 15, maxLevel: 19 },
  { name: "Diamond",  minLevel: 20, maxLevel: Infinity },
];

// Return the rank that corresponds to a given level
function getRankForLevel(level) {
  const lvl = (typeof level === "number" && level > 0) ? level : 1;
  return (
    RANKS.find(r => lvl >= r.minLevel && lvl <= r.maxLevel) ||
    RANKS[RANKS.length - 1]
  );
}

// Build a full Chrome-extension-safe URL for a rank icon
function getRankIconPath(rank) {
  return chrome.runtime.getURL(`Assets/${rank.name}.png`);
}
