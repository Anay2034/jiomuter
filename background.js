// background.js

let unmuteTimer = null;

// Regex to extract duration from ad names
const durationRegexes = [
  /_(\d{1,3})$/,           
  /_(\d{1,3})[sS]?_/,      
  /(\d{1,3})[sS](?:Eng|Hin)/i, 
  /(?:Eng|Hin).*?(\d{1,3})/i   
];

chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = new URL(details.url);
    const adName = url.searchParams.get("adName");

    if (adName) {
      console.log(`🎯 Ad Detected: ${adName}`);

      // 1. EXTRACT DURATION
      let durationSec = 20; 
      for (const regex of durationRegexes) {
        const match = adName.match(regex);
        if (match && match[1]) {
          durationSec = parseInt(match[1], 10);
          break;
        }
      }

      // 2. LOGIC: MUTE HOTSTAR -> PLAY SPOTIFY
      if (details.tabId !== -1) {
        
        // Reset timer if we are in an ad chain
        if (unmuteTimer) {
            clearTimeout(unmuteTimer);
            console.log("🔄 Ad chain: Extending mute.");
        }

        // A. Mute Hotstar
        chrome.tabs.update(details.tabId, { muted: true });
        console.log(`🔇 Muted Hotstar (Tab ${details.tabId})`);

        // B. Unmute Spotify (Play Music)
        // We query specifically for Spotify tabs
        const spotifyTabs = await chrome.tabs.query({ url: "*://open.spotify.com/*" });
        for (const tab of spotifyTabs) {
            chrome.tabs.update(tab.id, { muted: false });
            console.log(`🎵 Unmuted Spotify (Tab ${tab.id})`);
            
            // Optional: If you want to force 'Play', you'd need scripting permissions. 
            // For now, this just un-mutes the tab.
        }

        // 3. SCHEDULE THE RETURN TO COMMENTARY
        const muteDuration = (durationSec * 1000) + 100; // 1s buffer

        unmuteTimer = setTimeout(() => {
          chrome.tabs.get(details.tabId, (tab) => {
            if (tab && tab.mutedInfo.muted) {
               
               // A. Unmute Hotstar (Commentary Back)
               chrome.tabs.update(details.tabId, { muted: false });
               console.log(`🔊 Ad over. Commentary back on Tab ${details.tabId}`);
               
               // B. Mute Spotify (Music Off)
               // Query again in case the user closed/opened Spotify during the ad
               chrome.tabs.query({ url: "*://open.spotify.com/*" }, (tabs) => {
                   tabs.forEach(sTab => {
                       chrome.tabs.update(sTab.id, { muted: true });
                       console.log(`🔇 Muted Spotify (Tab ${sTab.id})`);
                   });
               });

               unmuteTimer = null;
            }
          });
        }, muteDuration);
      }
    }
  },
  {
    urls: [
        "*://bifrost-api.hotstar.com/v1/events/track/ct_impression*",
        "*://*.hotstar.com/*adName*" 
    ]
  }
);