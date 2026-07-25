chrome.action.onClicked.addListener((tab) => {
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'LOOPIT_FOCUS_PANEL' }, () => {
    if (chrome.runtime.lastError) {
      // No content script on this tab (wrong site) — nothing to do.
    }
  });
});
