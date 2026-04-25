// Attenova Background Script
// Handles tab switches and blocking

let isFocusModeActive = false;
let blockedSites = ["youtube.com", "chat.openai.com", "facebook.com", "twitter.com", "instagram.com"];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_FOCUS') {
    isFocusModeActive = true;
    updateBlockingRules();
  }
  if (message.type === 'STOP_FOCUS') {
    isFocusModeActive = false;
    clearBlockingRules();
  }
});

// Track Tab Switches
chrome.tabs.onActivated.addListener(activeInfo => {
  if (isFocusModeActive) {
    chrome.tabs.get(activeInfo.tabId, tab => {
      if (tab.url) {
        const domain = new URL(tab.url).hostname;
        notifyWebApp({ type: 'ATTENOVA_TAB_INFO', domain });
      }
    });
    notifyWebApp({ type: 'ATTENOVA_ACTIVITY', activityType: 'TAB_SWITCH' });
  }
});

function updateBlockingRules() {
  const rules = blockedSites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: 'block' },
    condition: { urlFilter: site, resourceTypes: ['main_frame'] }
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
    removeRuleIds: rules.map(r => r.id)
  });
}

function clearBlockingRules() {
  chrome.declarativeNetRequest.getDynamicRules(rules => {
    const ids = rules.map(r => r.id);
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ids });
  });
}

function notifyWebApp(data) {
  chrome.tabs.query({ url: "*://*.run.app/*" }, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, data);
    });
  });
}
