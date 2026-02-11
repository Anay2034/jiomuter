# JioHotstar DJ

A powerful Chrome Extension that automatically controls audio during ads on Hotstar and optionally manages your Spotify playback.

## Project Usecase

**Problem:** Watching Hotstar streams can be frustrating with sudden loud ads interrupting your viewing experience, especially if you're listening to Spotify in the background.

**Solution:** JioHotstar DJ automatically detects ads on Hotstar and intelligently manages audio:
- Mutes the Hotstar video during ads
- Optionally pauses, resumes, or adjusts volume on Spotify based on your preference
- Automatically returns to normal settings when the ad ends

**Perfect for:**
- Uninterrupted entertainment experience
- Background music lovers who want continuous Spotify playback
- Users who want to avoid sudden audio spikes from ads

## How to Use

Once installed, the extension adds a **DJ Control** popup with three operating modes:

### 1. **Silent Mode** (Default)
- **Hotstar:** Mutes ads only
- **Spotify:** No changes (plays normally)
- **Best for:** Users who only want Hotstar ads muted

### 2. **Stop & Start Mode**
- **Hotstar:** Mutes ads
- **Spotify:** Pauses during Hotstar shows, resumes during ads
- **Best for:** Users who want to focus on Hotstar and use ad breaks for music

### 3. **Background Music Mode**
- **Hotstar:** Mutes ads
- **Spotify:** Plays at 30% volume during Hotstar shows, 100% during ads
- **Best for:** Users who enjoy background music while watching

**To Change Modes:**
1. Click the extension icon in your Chrome toolbar
2. Select your preferred mode from the popup
3. Your choice is saved automatically

##  How to Install

1.  **Download the Files:**
    * Create a folder named `jiohotstar-muter`.
    * Inside it, save your `manifest.json` and `background.js` files.

2.  **Open Chrome Extensions:**
    * Open Google Chrome.
    * Type `chrome://extensions` in the address bar and press **Enter**.

3.  **Enable Developer Mode:**
    * Look at the top-right corner of the Extensions page.
    * Toggle the switch for **"Developer mode"** to **ON**.

4.  **Load the Extension:**
    * Click the **"Load unpacked"** button (top-left).
    * Select your `jiohotstar-muter` folder.

5.  **Done!**
    * The extension is now active. Open a Hotstar stream to test it.

---

**Note:** If you make changes to the code, go back to `chrome://extensions` and click the **Refresh** icon on the extension card.
