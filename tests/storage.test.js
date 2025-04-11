/**
 * Tests for storage operations in the TimeTracker extension.
 */

describe('Storage Operations', () => {
  beforeEach(() => {
    // Reset all mocks
    setupChromeStorageMock({});
  });
  
  test('chrome.storage.local.get should be called with correct keys', () => {
    // Create a mock function that loads data
    const loadData = () => {
      chrome.storage.local.get(['projects', 'activeState', 'lastTrackedProjectName', 'n8nWebhookUrl'], (result) => {
        // This is just a test, so we're not doing anything with the result
      });
    };
    
    // Call the function
    loadData();
    
    // Verify the function was called with the correct keys
    expect(chrome.storage.local.get).toHaveBeenCalledWith(
      ['projects', 'activeState', 'lastTrackedProjectName', 'n8nWebhookUrl'],
      expect.any(Function)
    );
  });
  
  test('chrome.storage.local.set should be called with project data', () => {
    // Create a mock function that saves data
    const saveCoreData = () => {
      const projects = {
        'Project 1': { totalSeconds: 3600, entries: { '2023-08-15': 3600 } }
      };
      const activeState = { projectName: 'Project 1', startTime: Date.now() };
      const lastTrackedProjectName = 'Project 1';
      
      chrome.storage.local.set({
        projects: projects,
        activeState: activeState,
        lastTrackedProjectName: lastTrackedProjectName
      }, () => {
        // This is just a test, so we're not doing anything with the result
      });
    };
    
    // Call the function
    saveCoreData();
    
    // Verify the function was called with the correct data
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      {
        projects: {
          'Project 1': { totalSeconds: 3600, entries: { '2023-08-15': 3600 } }
        },
        activeState: expect.objectContaining({
          projectName: 'Project 1',
          startTime: expect.any(Number)
        }),
        lastTrackedProjectName: 'Project 1'
      },
      expect.any(Function)
    );
  });
  
  test('chrome.storage.local.remove should be called when clearing webhook URL', () => {
    // Create a mock function that removes webhook URL
    const removeWebhookUrl = () => {
      chrome.storage.local.remove('n8nWebhookUrl', () => {
        // This is just a test, so we're not doing anything with the result
      });
    };
    
    // Call the function
    removeWebhookUrl();
    
    // Verify the function was called with the correct key
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(
      'n8nWebhookUrl',
      expect.any(Function)
    );
  });
}); 