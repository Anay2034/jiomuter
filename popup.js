// popup.js

// 1. Load saved settings
chrome.storage.local.get(['djMode', 'maxVolume', 'lowVolume'], (result) => {
  const mode = result.djMode || 'SILENT'; // Default to Silent now
  const maxVol = result.maxVolume || 70;
  const lowVol = result.lowVolume || 45;
  updateUI(mode);
  updateVolumeUI(maxVol, lowVol);
});

// 2. Handle clicks
document.getElementById('btn-pause').addEventListener('click', () => save('PAUSE'));
document.getElementById('btn-duck').addEventListener('click', () => save('DUCK'));
document.getElementById('btn-silent').addEventListener('click', () => save('SILENT'));

// 3. Handle volume changes
document.getElementById('maxVolume').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  document.getElementById('maxVolLabel').textContent = value + '%';
  chrome.storage.local.set({ maxVolume: value });
});

document.getElementById('lowVolume').addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  document.getElementById('lowVolLabel').textContent = value + '%';
  chrome.storage.local.set({ lowVolume: value });
});

function save(mode) {
  chrome.storage.local.set({ djMode: mode }, () => {
    updateUI(mode);
  });
}

function updateUI(mode) {
  // Remove 'selected' class from all
  document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
  
  // Add 'selected' to the active one
  if (mode === 'PAUSE') document.getElementById('btn-pause').classList.add('selected');
  else if (mode === 'DUCK') document.getElementById('btn-duck').classList.add('selected');
  else if (mode === 'SILENT') document.getElementById('btn-silent').classList.add('selected');
}

function updateVolumeUI(maxVol, lowVol) {
  document.getElementById('maxVolume').value = maxVol;
  document.getElementById('maxVolLabel').textContent = maxVol + '%';
  document.getElementById('lowVolume').value = lowVol;
  document.getElementById('lowVolLabel').textContent = lowVol + '%';
}