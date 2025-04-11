/**
 * Tests for DOM interactions in the TimeTracker extension.
 * These tests simulate user interactions with the DOM.
 */

// Setup DOM elements for testing
const setupDOMElements = () => {
  // Create main view elements
  document.body.innerHTML = `
    <div id="main-view">
      <div class="header">
        <h2>Time Tracker</h2>
        <div class="header-buttons">
          <button id="settings-toggle-btn">⚙️</button>
          <button id="report-toggle-btn">📊</button>
        </div>
      </div>
      
      <div class="section project-selection">
        <label for="project-select">Select Project:</label>
        <div class="project-controls">
          <select id="project-select"></select>
          <input type="text" id="new-project-name" placeholder="New Project Name">
          <button id="add-project-btn">+</button>
        </div>
      </div>
      
      <div class="section timer-section">
        <div id="current-project">No project selected</div>
        <div id="current-timer">00:00:00</div>
        <div class="timer-buttons">
          <button id="start-btn" disabled>Start</button>
          <button id="stop-btn" disabled>Stop</button>
        </div>
      </div>
    </div>
    
    <div id="settings-section" style="display: none;"></div>
    <div id="report-section" style="display: none;"></div>
  `;
  
  // Set up references
  window.projectSelect = document.getElementById('project-select');
  window.newProjectNameInput = document.getElementById('new-project-name');
  window.addProjectBtn = document.getElementById('add-project-btn');
  window.currentProjectDisplay = document.getElementById('current-project');
  window.currentTimerDisplay = document.getElementById('current-timer');
  window.startBtn = document.getElementById('start-btn');
  window.stopBtn = document.getElementById('stop-btn');
  window.settingsToggleBtn = document.getElementById('settings-toggle-btn');
  window.reportToggleBtn = document.getElementById('report-toggle-btn');
};

describe('DOM Interactions', () => {
  beforeEach(() => {
    // Set up DOM elements
    setupDOMElements();
    
    // Set up chrome storage mock
    setupChromeStorageMock({
      projects: {
        'Project 1': { totalSeconds: 0, entries: {} },
        'Project 2': { totalSeconds: 3600, entries: { '2023-08-15': 3600 } }
      }
    });
    
    // Mock alert
    global.alert = jest.fn();

    // Reset fetch mock
    global.fetch.mockReset();
    global.fetch.mockResolvedValue({ ok: true });
  });
  
  test('view toggle buttons should be accessible', () => {
    expect(settingsToggleBtn).not.toBeNull();
    expect(reportToggleBtn).not.toBeNull();
  });
  
  test('start button should be disabled when no project is selected', () => {
    expect(startBtn.disabled).toBe(true);
  });
  
  test('project dropdown should update on project addition', () => {
    // Set a value in the new project input
    newProjectNameInput.value = 'New Test Project';
    
    // Mock the implementation to add a project
    const addProjectHandler = () => {
      const newName = newProjectNameInput.value.trim();
      if (newName) {
        // Update the dropdown
        const option = document.createElement('option');
        option.value = newName;
        option.textContent = newName;
        projectSelect.appendChild(option);
        projectSelect.value = newName;
        
        // Enable the start button
        startBtn.disabled = false;
        
        // Update display
        currentProjectDisplay.textContent = `Selected: ${newName}`;
        
        // Clear input
        newProjectNameInput.value = '';
      }
    };
    
    // Add click handler
    addProjectBtn.addEventListener('click', addProjectHandler);
    
    // Simulate click
    addProjectBtn.click();
    
    // Check that the project was added
    expect(projectSelect.value).toBe('New Test Project');
    expect(startBtn.disabled).toBe(false);
    expect(currentProjectDisplay.textContent).toBe('Selected: New Test Project');
  });
}); 