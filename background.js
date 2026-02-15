// background.js

// --- CONFIGURATION ---
let currentMode = 'SILENT';
let maxVolume = 70;
let lowVolume = 45;
let unmuteTimer = null;

// Load saved settings
chrome.storage.local.get(['djMode', 'maxVolume', 'lowVolume'], (res) => {
  if (res.djMode) currentMode = res.djMode;
  if (res.maxVolume) maxVolume = res.maxVolume;
  if (res.lowVolume) lowVolume = res.lowVolume;
});

// Listen for setting changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.djMode) {
    currentMode = changes.djMode.newValue;
    console.log(`🎛️ Mode switched to: ${currentMode}`);
  }
  if (changes.maxVolume) {
    maxVolume = changes.maxVolume.newValue;
    console.log(`🔊 Max Volume set to: ${maxVolume}%`);
  }
  if (changes.lowVolume) {
    lowVolume = changes.lowVolume.newValue;
    console.log(`🔉 Low Volume set to: ${lowVolume}%`);
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
  if (currentMode === 'SILENT') return;

  // Search for your specific URL pattern
  const spotifyUrlPattern = "*://open.spotify.com/*";

  chrome.tabs.query({ url: spotifyUrlPattern }, (tabs) => {
    if (tabs.length === 0) {
        console.log("⚠️ No Spotify tabs found.");
        return;
    }

    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (act) => {
          
          // --- 1. VOLUME LOGIC (The React Hack) ---
          const setVolume = (pct) => {
              const slider = document.querySelector('[data-testid="volume-bar"] input');
              if (slider) {
                  const val = pct / 100;
                  
                  // FORCE React to accept the value using the native setter
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                  nativeInputValueSetter.call(slider, val);
                  
                  // Dispatch events to trigger the UI update
                  slider.dispatchEvent(new Event('input', { bubbles: true }));
                  slider.dispatchEvent(new Event('change', { bubbles: true }));
                  
                  console.log(`🔉 Volume forced to ${pct}%`);
              } else {
                  console.log("❌ Volume slider not found");
              }
          };

          // --- 2. PLAY/PAUSE LOGIC ---
          const togglePlay = (shouldPlay) => {
              const btn = document.querySelector('[data-testid="control-button-playpause"]');
              const media = document.querySelector('video, audio'); // Truth source
              
              if (!btn) return;
              
              // If we have a media tag, check its state. If not, rely on button label.
              const isPaused = media ? media.paused : (btn.getAttribute('aria-label') === 'Play');
              
              if (shouldPlay && isPaused) {
                  btn.click();
                  console.log("▶️ Clicking Play");
              } else if (!shouldPlay && !isPaused) {
                  btn.click();
                  console.log("⏸️ Clicking Pause");
              }
          };

          // --- 3. EXECUTE COMMANDS ---
          if (act === 'MAX_VOLUME') setVolume(window.maxVolume || 70);
          if (act === 'LOW_VOLUME') setVolume(window.lowVolume || 45);
          if (act === 'PLAY') togglePlay(true);
          if (act === 'PAUSE') togglePlay(false);
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
        if (unmuteTimer) {
            clearTimeout(unmuteTimer);
            console.log("🔄 Ad Chain: Timer extended.");
        }

        // 1. Mute Hotstar (Always)
        chrome.tabs.update(details.tabId, { muted: true });

        // 2. Control Spotify (Action: AD START)
        if (currentMode === 'PAUSE') controlSpotify('PLAY');     // Resume Music
        else if (currentMode === 'DUCK') {
          // Pass volume settings to content script
          chrome.tabs.query({ url: "*://open.spotify.com/*" }, (tabs) => {
            tabs.forEach(tab => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (vol) => { window.maxVolume = vol; },
                args: [maxVolume]
              });
            });
          });
          controlSpotify('MAX_VOLUME');
        }

        // 3. Schedule Return (Action: AD END)
        const muteDuration = (durationSec * 1000) + 500; 

        unmuteTimer = setTimeout(() => {
          chrome.tabs.get(details.tabId, (tab) => {
            if (tab && tab.mutedInfo.muted) {
               
               // A. Unmute Hotstar
               chrome.tabs.update(details.tabId, { muted: false });
               
               // B. Control Spotify
               if (currentMode === 'PAUSE') controlSpotify('PAUSE');    // Stop Music
               else if (currentMode === 'DUCK') {
                 // Pass volume settings to content script
                 chrome.tabs.query({ url: "*://open.spotify.com/*" }, (tabs) => {
                   tabs.forEach(tab => {
                     chrome.scripting.executeScript({
                       target: { tabId: tab.id },
                       func: (vol) => { window.lowVolume = vol; },
                       args: [lowVolume]
                     });
                   });
                 });
                 controlSpotify('LOW_VOLUME');
               }
               
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