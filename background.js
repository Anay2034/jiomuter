// background.js

// Store the timer ID so we can cancel it if a new ad starts immediately
let unmuteTimer = null;

// Regex strategies to find duration from ad names like:
// "EMIRATES_..._ENG_15" -> 15 seconds
// "Vimal_20s" -> 20 seconds
const durationRegexes = [
  /_(\d{1,3})$/,           // Matches number at the very end (e.g., "_15")
  /_(\d{1,3})[sS]?_/,      // Matches number surrounded by underscores (e.g., "_15_")
  /(\d{1,3})[sS](?:Eng|Hin)/i, // Matches "15sEng"
  /(?:Eng|Hin).*?(\d{1,3})/i   // Matches "Eng_15"
];

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = new URL(details.url);
    const adName = url.searchParams.get("adName");

    // If there is an adName, it's an ad!
    if (adName) {
      console.log(`🎯 Ad Detected: ${adName}`);

      // 1. EXTRACT DURATION
      let durationSec = 20; // Default fallback
      
      for (const regex of durationRegexes) {
        const match = adName.match(regex);
        if (match && match[1]) {
          durationSec = parseInt(match[1], 10);
          console.log(`⏱️ Parsed Duration: ${durationSec} seconds`);
          break;
        }
      }

      // 2. MUTE THE TAB
      if (details.tabId !== -1) {
        // Clear any existing unmute timer (in case this is the 2nd ad in a row)
        if (unmuteTimer) {
            clearTimeout(unmuteTimer);
            console.log("🔄 Ad chain detected: Extending mute time.");
        }

        // Mute immediately
        chrome.tabs.update(details.tabId, { muted: true });

        // 3. SCHEDULE UNMUTE
        // We add 1 extra second (1000ms) buffer just to be safe
        const muteDuration = (durationSec * 1000) + 100;

        unmuteTimer = setTimeout(() => {
          chrome.tabs.get(details.tabId, (tab) => {
            if (tab && tab.mutedInfo.muted) {
               chrome.tabs.update(details.tabId, { muted: false });
               console.log(`🔊 Ad over. Unmuting tab ${details.tabId}`);
               unmuteTimer = null;
            }
          });
        }, muteDuration);
      }
    }
  },
  {
    // Filter specifically for the impression tracker you found
    urls: [
        "*://bifrost-api.hotstar.com/v1/events/track/ct_impression*",
        "*://*.hotstar.com/*adName*" 
    ]
  }
);