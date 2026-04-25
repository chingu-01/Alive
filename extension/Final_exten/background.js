/**
 * Attenova - Background Service Worker
 * Tracks browser tab activity and enforces the parent tab limit in Child Mode.
 */

const DEFAULT_TAB_LIMIT = 4;
const MAX_HISTORY_ITEMS = 500;
const MAX_SWITCH_LOG_ITEMS = 300;
const NOTIFICATION_COOLDOWN = 8000;

let lastNotificationTime = 0;

async function initializeStorage() {
  const defaults = {
    activeMode: 'child',
    tabLimit: DEFAULT_TAB_LIMIT,
    tabSwitches: 0,
    tabSwitchTimestamps: [],
    tabSwitchLog: [],
    siteHistory: {},
    visitedTabs: [],
    tabOpenCount: 0,
    tabOpenHistory: [],
    currentActiveTab: null,
    currentActiveTabStartTime: null,
    openTabs: [],
    extraTabs: [],
    lastViolation: null,
    parentPasswordHash: null,
    parentPasswordSalt: null,
    parentEmail: null,
    passwordResetOtpHash: null,
    passwordResetOtpSalt: null,
    passwordResetOtpExpiresAt: null,
    passwordResetOtpEmail: null
  };

  const existing = await chrome.storage.local.get(Object.keys(defaults));
  const missingDefaults = {};

  Object.keys(defaults).forEach(key => {
    if (!(key in existing)) {
      missingDefaults[key] = defaults[key];
    }
  });

  if (Object.keys(missingDefaults).length > 0) {
    await chrome.storage.local.set(missingDefaults);
  }
}

async function getData() {
  return await chrome.storage.local.get([
    'activeMode',
    'tabLimit',
    'tabSwitches',
    'tabSwitchTimestamps',
    'tabSwitchLog',
    'siteHistory',
    'visitedTabs',
    'tabOpenCount',
    'tabOpenHistory',
    'currentActiveTab',
    'currentActiveTabStartTime',
    'openTabs',
    'extraTabs',
    'lastViolation'
  ]);
}

async function saveData(updates) {
  await chrome.storage.local.set(updates);
}

function normalizeTab(tab) {
  return {
    id: tab.id,
    windowId: tab.windowId,
    index: tab.index ?? 0,
    active: Boolean(tab.active),
    url: tab.url || 'about:blank',
    title: tab.title || tab.url || 'Unknown tab',
    timestamp: Date.now()
  };
}

function limitHistory(history, maxItems = MAX_HISTORY_ITEMS) {
  return history.slice(Math.max(history.length - maxItems, 0));
}

function isWebsiteUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return null;
  }
}

function addVisitToHistory(history, tab, reason) {
  if (!tab || !isWebsiteUrl(tab.url)) {
    return history || [];
  }

  const updatedHistory = [...(history || [])];
  updatedHistory.push({
    tabId: tab.id,
    windowId: tab.windowId,
    url: tab.url,
    title: tab.title || tab.url,
    reason,
    timestamp: Date.now()
  });

  return limitHistory(updatedHistory);
}

function updateSiteHistory(tab, startTime, siteHistory) {
  if (!tab || !isWebsiteUrl(tab.url) || !startTime) {
    return siteHistory || {};
  }

  const hostname = getHostname(tab.url);
  if (!hostname) {
    return siteHistory || {};
  }

  const duration = Date.now() - startTime;
  if (duration <= 0) {
    return siteHistory || {};
  }

  return {
    ...(siteHistory || {}),
    [hostname]: ((siteHistory || {})[hostname] || 0) + duration
  };
}

async function trackCurrentSiteTime() {
  const data = await getData();
  const { currentActiveTab, currentActiveTabStartTime, siteHistory } = data;

  if (!currentActiveTab || !currentActiveTabStartTime) {
    return;
  }

  let tab = currentActiveTab;

  try {
    const liveTab = await chrome.tabs.get(currentActiveTab.id);
    tab = liveTab || currentActiveTab;
  } catch (error) {
    tab = currentActiveTab;
  }

  await saveData({
    siteHistory: updateSiteHistory(tab, currentActiveTabStartTime, siteHistory)
  });
}

async function updateOpenTabsList() {
  try {
    const tabs = await chrome.tabs.query({});
    const data = await getData();
    const tabLimit = Number(data.tabLimit) || DEFAULT_TAB_LIMIT;
    const openTabs = tabs
      .sort((a, b) => (a.windowId - b.windowId) || ((a.index ?? 0) - (b.index ?? 0)))
      .map(tab => normalizeTab(tab));
    const extraTabs = openTabs.slice(tabLimit);
    const extraCount = Math.max(openTabs.length - tabLimit, 0);
    const lastViolation = extraCount > 0
      ? {
          tabLimit,
          tabCount: openTabs.length,
          extraCount,
          timestamp: Date.now()
        }
      : null;

    await saveData({
      openTabs,
      extraTabs,
      lastViolation
    });

    if (extraCount > 0 && data.activeMode === 'child') {
      await showLimitWarning({
        tabLimit,
        tabCount: openTabs.length,
        extraCount
      });
    }
  } catch (error) {
    console.error('Error updating open tabs list:', error);
  }
}

async function showLimitWarning({ tabLimit, tabCount, extraCount }) {
  const now = Date.now();
  if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
    return;
  }

  lastNotificationTime = now;

  try {
    await chrome.notifications.create('attenova-tab-limit-warning', {
      type: 'basic',
      title: 'Attenova: Tab Limit Exceeded',
      message: `${tabCount} tabs are open. Parent limit is ${tabLimit}. Close ${extraCount} extra tab${extraCount === 1 ? '' : 's'}.`,
      priority: 2,
      silent: false,
      requireInteraction: true,
      iconUrl: chrome.runtime.getURL('icons/icon.svg')
    });
  } catch (error) {
    console.error('Error creating tab limit notification:', error);
  }

  await showInPageWarning({ tabLimit, tabCount, extraCount });
}

async function showInPageWarning(details) {
  try {
    if (!chrome.scripting || !chrome.scripting.executeScript) {
      return;
    }

    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const activeTab = tabs[0];

    if (!activeTab || !isWebsiteUrl(activeTab.url)) {
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      args: [details],
      func: ({ tabLimit, tabCount, extraCount }) => {
        const existing = document.getElementById('attenova-limit-warning');
        if (existing) {
          existing.remove();
        }

        const container = document.createElement('div');
        container.id = 'attenova-limit-warning';
        container.style.position = 'fixed';
        container.style.top = '18px';
        container.style.right = '18px';
        container.style.zIndex = '2147483647';
        container.style.maxWidth = '360px';
        container.style.padding = '16px 18px';
        container.style.borderRadius = '10px';
        container.style.background = '#bf4f2f';
        container.style.color = '#ffffff';
        container.style.boxShadow = '0 14px 34px rgba(0, 0, 0, 0.28)';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.lineHeight = '1.4';

        const title = document.createElement('div');
        title.textContent = 'Attenova: Tab Limit Exceeded';
        title.style.fontWeight = '800';
        title.style.fontSize = '16px';
        title.style.marginBottom = '6px';

        const message = document.createElement('div');
        message.textContent = `${tabCount} tabs are open. Your parent limit is ${tabLimit}. Close ${extraCount} extra tab${extraCount === 1 ? '' : 's'}.`;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.textContent = 'Close';
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '6px 10px';
        closeButton.style.border = '1px solid rgba(255, 255, 255, 0.7)';
        closeButton.style.borderRadius = '6px';
        closeButton.style.background = 'rgba(255, 255, 255, 0.14)';
        closeButton.style.color = '#ffffff';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = '700';
        closeButton.addEventListener('click', () => container.remove());

        container.append(title, message, closeButton);
        document.documentElement.appendChild(container);

        window.setTimeout(() => {
          container.remove();
        }, 12000);
      }
    });
  } catch (error) {
    console.error('Error showing in-page tab limit warning:', error);
  }
}

function filterRecentTimestamps(timestamps) {
  const now = Date.now();
  const twoMinutesAgo = now - (2 * 60 * 1000);
  return (timestamps || []).filter(timestamp => timestamp > twoMinutesAgo);
}

function buildSwitchLog(existingLog, previousTab, nextTab) {
  const updatedLog = [...(existingLog || [])];
  updatedLog.push({
    fromUrl: previousTab?.url || 'Unknown',
    fromTitle: previousTab?.title || 'Unknown tab',
    toUrl: nextTab?.url || 'Unknown',
    toTitle: nextTab?.title || 'Unknown tab',
    timestamp: Date.now()
  });

  return limitHistory(updatedLog, MAX_SWITCH_LOG_ITEMS);
}

function updateTabOpenHistory(history, tab) {
  const updatedHistory = [...(history || [])];
  const existingIndex = findRecentTabOpenIndex(updatedHistory, tab.id);

  if (existingIndex >= 0) {
    updatedHistory[existingIndex] = {
      ...updatedHistory[existingIndex],
      url: tab.url || updatedHistory[existingIndex].url,
      title: tab.title || updatedHistory[existingIndex].title
    };
  }

  return limitHistory(updatedHistory);
}

function findRecentTabOpenIndex(history, tabId) {
  if (typeof tabId === 'undefined') {
    return -1;
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index].tabId === tabId) {
      return index;
    }
  }

  return -1;
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    await trackCurrentSiteTime();

    const data = await getData();
    const newTab = await chrome.tabs.get(activeInfo.tabId);
    const updatedTimestamps = filterRecentTimestamps([
      ...(data.tabSwitchTimestamps || []),
      Date.now()
    ]);
    const visitedTabs = addVisitToHistory(data.visitedTabs, newTab, 'tab-switch');
    const tabSwitchLog = buildSwitchLog(data.tabSwitchLog, data.currentActiveTab, newTab);

    await saveData({
      currentActiveTab: normalizeTab(newTab),
      currentActiveTabStartTime: Date.now(),
      tabSwitches: (Number(data.tabSwitches) || 0) + 1,
      tabSwitchTimestamps: updatedTimestamps,
      tabSwitchLog,
      visitedTabs
    });

    await updateOpenTabsList();
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});

chrome.tabs.onCreated.addListener(async (tab) => {
  try {
    const data = await getData();
    const tabRecord = normalizeTab(tab);
    const tabOpenHistory = limitHistory([
      ...(data.tabOpenHistory || []),
      {
        tabId: tabRecord.id,
        windowId: tabRecord.windowId,
        url: tabRecord.url,
        title: tabRecord.title,
        timestamp: Date.now()
      }
    ]);

    await saveData({
      tabOpenCount: (Number(data.tabOpenCount) || 0) + 1,
      tabOpenHistory
    });

    await updateOpenTabsList();
  } catch (error) {
    console.error('Error handling tab creation:', error);
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  try {
    if (!changeInfo.url && changeInfo.status !== 'complete' && !changeInfo.title) {
      return;
    }

    const data = await getData();
    const updates = {
      tabOpenHistory: updateTabOpenHistory(data.tabOpenHistory, tab)
    };

    if (tab.active && isWebsiteUrl(tab.url)) {
      updates.visitedTabs = addVisitToHistory(data.visitedTabs, tab, changeInfo.url ? 'navigation' : 'page-load');
      updates.currentActiveTab = normalizeTab(tab);
      updates.currentActiveTabStartTime = data.currentActiveTabStartTime || Date.now();
    }

    await saveData(updates);
    await updateOpenTabsList();
  } catch (error) {
    console.error('Error handling tab update:', error);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const data = await getData();

    if (data.currentActiveTab && data.currentActiveTab.id === tabId) {
      await trackCurrentSiteTime();
      await saveData({
        currentActiveTab: null,
        currentActiveTabStartTime: null
      });
    }

    await updateOpenTabsList();
  } catch (error) {
    console.error('Error handling tab removal:', error);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return;
    }

    await trackCurrentSiteTime();

    const tabs = await chrome.tabs.query({ windowId, active: true });
    if (tabs.length === 0) {
      return;
    }

    const data = await getData();
    const activeTab = tabs[0];

    await saveData({
      currentActiveTab: normalizeTab(activeTab),
      currentActiveTabStartTime: Date.now(),
      visitedTabs: addVisitToHistory(data.visitedTabs, activeTab, 'window-focus')
    });

    await updateOpenTabsList();
  } catch (error) {
    console.error('Error handling window focus change:', error);
  }
});

try {
  chrome.alarms.create('checkTabLimit', { periodInMinutes: 10 / 60 });
} catch (error) {
  console.log('Alarm creation note:', error.message);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkTabLimit') {
    await updateOpenTabsList();
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await initializeStorage();
  await updateOpenTabsList();
  console.log('Attenova installed and initialized');
});

initializeStorage()
  .then(updateOpenTabsList)
  .catch(error => {
    console.error('Failed to initialize Attenova:', error);
  });