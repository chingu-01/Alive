// Attenova Content Script
// Tracks user activity on the web

let lastKeyTime = 0;

window.addEventListener('keydown', () => {
  const now = Date.now();
  if (now - lastKeyTime > 1000) { // Throttle
    chrome.runtime.sendMessage({ type: 'ACTIVITY', detail: 'KEYSTROKE' });
    
    // Attempt to notify the web app directly if we are on it
    window.postMessage({ type: 'ATTENOVA_ACTIVITY', activityType: 'KEYSTROKE', value: 1 }, "*");
  }
  lastKeyTime = now;
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'ATTENOVA_ACTIVITY') {
    // Dispatch to the actual webpage (for Attenova app)
    window.postMessage(message, "*");
  }
});
