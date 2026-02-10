// background.js

// --- CONFIGURATION ---
let currentMode = 'SILENT'; // Default
let unmuteTimer = null;

// Load saved mode
chrome.storage.local.get(['djMode'], (res) => {
  if (res.djMode) currentMode = res.djMode;
});

// Listen for mode changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.djMode) {
    currentMode = changes.djMode.newValue;
    console.log(`🎛️ Mode switched to: ${currentMode}`);
  }
});

const durationRegexes = [
  /_(\d{1,3})$/,           
  /_(\d{1,3})[sS]?_/,      
  /(\d{1,3})[sS](?:Eng|Hin)/i, 
  /(?:Eng|Hin).*?(\d{1,3})/i   
];

// --- SPOTIFY CONTROLS ---
function controlSpotify(action) {
  // 1. If in Silent Mode, DO NOTHING.
  if (currentMode === 'SILENT') return;

  // 2. Otherwise, control the music
  chrome.tabs.query({ url: "*://open.spotify.com/*" }, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (act) => {
          const media = document.querySelector('video'); 
          const btn = document.querySelector('[data-testid="control-button-playpause"]');
          
          if (media) {
            if (act === 'MAX_VOLUME') media.volume = 1.0;
            else if (act === 'LOW_VOLUME') media.volume = 0.3;
          }
          
          if (act === 'PLAY') {
             if (btn && btn.getAttribute('aria-label') === 'Play') btn.click();
             if (media) media.volume = 1.0;
          }
          else if (act === 'PAUSE') {
             if (btn && btn.getAttribute('aria-label') === 'Pause') btn.click();
          }
        },
        args: [action]
      });
    });
  });
}

// --- MAIN LISTENER ---
chrome.webRequest.onBeforeRequest.addListener(
  async (details) => {
    const url = new URL(details.url);
    const adName = url.searchParams.get("adName");

    if (adName) {
      console.log(`🎯 Ad Detected: ${adName}`);

      let durationSec = 20; 
      for (const regex of durationRegexes) {
        const match = adName.match(regex);
        if (match && match[1]) {
          durationSec = parseInt(match[1], 10);
          break;
        }
      }

      if (details.tabId !== -1) {
        if (unmuteTimer) clearTimeout(unmuteTimer);

        // --- STEP 1: AD STARTS ---
        // A. Mute Hotstar (Always happens)
        chrome.tabs.update(details.tabId, { muted: true });

        // B. Handle Spotify (Only if NOT Silent Mode)
        if (currentMode === 'PAUSE') {
           controlSpotify('PLAY');
        } else if (currentMode === 'DUCK') {
           controlSpotify('MAX_VOLUME');
        }

        // --- STEP 2: AD ENDS ---
        const muteDuration = (durationSec * 1000) + 1000; 

        unmuteTimer = setTimeout(() => {
          chrome.tabs.get(details.tabId, (tab) => {
            if (tab && tab.mutedInfo.muted) {
               
               // A. Unmute Hotstar
               chrome.tabs.update(details.tabId, { muted: false });
               
               // B. Handle Spotify
               if (currentMode === 'PAUSE') {
                  controlSpotify('PAUSE');
               } else if (currentMode === 'DUCK') {
                  controlSpotify('LOW_VOLUME');
               }
               // If SILENT, we do nothing here.
               
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