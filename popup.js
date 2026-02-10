// popup.js

// 1. Load saved settings
chrome.storage.local.get(['djMode'], (result) => {
  const mode = result.djMode || 'SILENT'; // Default to Silent now
  updateUI(mode);
});

// 2. Handle clicks
document.getElementById('btn-pause').addEventListener('click', () => save('PAUSE'));
document.getElementById('btn-duck').addEventListener('click', () => save('DUCK'));
document.getElementById('btn-silent').addEventListener('click', () => save('SILENT'));

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