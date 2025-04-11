// Mock Chrome API
const storageMock = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// Mock chrome.storage
global.chrome = {
  storage: storageMock,
  runtime: {
    lastError: null
  }
};

// Helper to setup storage mock responses
global.setupChromeStorageMock = (mockData) => {
  // Reset all mocks
  storageMock.local.get.mockReset();
  storageMock.local.set.mockReset();
  storageMock.local.remove.mockReset();
  
  // Setup get to return provided mock data
  storageMock.local.get.mockImplementation((keys, callback) => {
    if (typeof keys === 'string') {
      const result = {};
      if (mockData && mockData[keys] !== undefined) {
        result[keys] = mockData[keys];
      }
      callback(result);
    } else if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (mockData && mockData[key] !== undefined) {
          result[key] = mockData[key];
        }
      });
      callback(result);
    } else if (typeof keys === 'object') {
      const result = {};
      Object.keys(keys).forEach(key => {
        result[key] = (mockData && mockData[key] !== undefined) ? mockData[key] : keys[key];
      });
      callback(result);
    } else {
      callback(mockData || {});
    }
  });
  
  // Setup set to call callback with no errors
  storageMock.local.set.mockImplementation((data, callback) => {
    if (callback) callback();
  });
  
  // Setup remove to call callback with no errors
  storageMock.local.remove.mockImplementation((keys, callback) => {
    if (callback) callback();
  });
};

// Mock fetch for webhook calls
global.fetch = jest.fn();

// Mock DOM elements
document.body.innerHTML = `
<div id="main-view"></div>
<div id="settings-section" style="display: none;"></div>
<div id="report-section" style="display: none;"></div>`;

// Helper to simulate DOM content loaded
global.simulateDOMContentLoaded = () => {
  const event = new Event('DOMContentLoaded');
  document.dispatchEvent(event);
}; 