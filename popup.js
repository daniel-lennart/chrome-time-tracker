document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // IMPORTANT: Replace with your n8n TEST webhook URL first, then PRODUCTION URL after testing/activation.
    // const N8N_WEBHOOK_URL = 'REPLACE_WITH_YOUR_N8N_WEBHOOK_TEST_OR_PRODUCTION_URL'; // REMOVED - Will load from storage

    // --- Constants for DOM Elements ---
    // Views
    const mainView = document.getElementById('main-view');
    const settingsSection = document.getElementById('settings-section');
    const reportSection = document.getElementById('report-section');

    // Header Buttons
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const reportToggleBtn = document.getElementById('report-toggle-btn');

    // Main View Elements
    const projectSelect = document.getElementById('project-select');
    const newProjectNameInput = document.getElementById('new-project-name');
    const addProjectBtn = document.getElementById('add-project-btn');
    const currentProjectDisplay = document.getElementById('current-project');
    const currentTimerDisplay = document.getElementById('current-timer');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');

    // Settings Elements
    const webhookUrlInput = document.getElementById('webhook-url-input');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsSavedMsg = document.getElementById('settings-saved-msg');
    const projectListSettingsDiv = document.getElementById('project-list-settings');
    const projectListPrevBtn = document.getElementById('project-list-prev');
    const projectListPageInfo = document.getElementById('project-list-page-info');
    const projectListNextBtn = document.getElementById('project-list-next');
    // Edit/Delete buttons are now generated dynamically in the list

    // Report Elements
    const reportSummaryDiv = document.getElementById('report-summary');
    const reportVisualDiv = document.getElementById('report-visual');

    // --- State Variables ---
    let projects = {}; // { projectName: { totalSeconds: number, entries: { 'YYYY-MM-DD': seconds, ... } }, ... }
    let activeProject = null;
    let timerInterval = null;
    let sessionStartTime = null;
    let lastTrackedProjectName = null;
    let n8nWebhookUrl = null;
    let currentView = 'main-view'; // Tracks the currently visible view
    let projectsCurrentPage = 1;
    const PROJECTS_PER_PAGE = 5;

    // --- Helper Functions ---
    function getCurrentDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Helper function to format time
    function formatTime(totalSeconds) {
        if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds)) {
            return '00:00:00';
        }
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // --- View Management ---
    function showView(viewId) {
        mainView.style.display = 'none';
        settingsSection.style.display = 'none';
        reportSection.style.display = 'none';

        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
            currentView = viewId;
            // Highlight active button (simple style)
            settingsToggleBtn.style.opacity = '0.7';
            reportToggleBtn.style.opacity = '0.7';
            if (viewId === 'settings-section') {
                 settingsToggleBtn.style.opacity = '1';
                 renderProjectListSettings(); // Re-render project list when settings shown
            } else if (viewId === 'report-section') {
                 reportToggleBtn.style.opacity = '1';
                 renderReport(); // Generate report when shown
            }
        } else {
            mainView.style.display = 'block'; // Default to main view
             currentView = 'main-view';
             settingsToggleBtn.style.opacity = '0.7';
             reportToggleBtn.style.opacity = '0.7';
        }
    }

    function toggleSettings() {
        if (currentView === 'settings-section') {
            showView('main-view');
        } else {
            showView('settings-section');
        }
    }

    function toggleReport() {
         if (currentView === 'report-section') {
             showView('main-view');
         } else {
             showView('report-section');
         }
    }

    // --- Storage Functions ---
    function loadData() {
        chrome.storage.local.get(['projects', 'activeState', 'lastTrackedProjectName', 'n8nWebhookUrl'], (result) => {
            // Load n8n webhook URL
            n8nWebhookUrl = result.n8nWebhookUrl || null;
            webhookUrlInput.value = n8nWebhookUrl || '';

            // Load projects (with basic validation)
             projects = {}; // Reset before loading
            if (result.projects) {
                for (const key in result.projects) {
                     if (typeof result.projects[key] === 'object' && result.projects[key] !== null && result.projects[key].totalSeconds !== undefined) {
                         projects[key] = result.projects[key];
                         if (!projects[key].entries) projects[key].entries = {};
                     } else {
                         console.warn(`Invalid project data structure found for ${key}. Skipping.`);
                     }
                }
            }

            lastTrackedProjectName = result.lastTrackedProjectName || null;
            updateProjectSelect(); // Update main dropdown immediately

            // Restore active state if applicable
            if (result.activeState && result.activeState.projectName && projects[result.activeState.projectName] !== undefined) {
                activeProject = result.activeState.projectName;
                sessionStartTime = result.activeState.startTime;
                 if (activeProject && sessionStartTime) {
                    currentProjectDisplay.textContent = `Tracking: ${activeProject}`;
                    projectSelect.value = activeProject;
                    startTimerDisplay();
                    setTrackingStateUI(true);
                } else {
                    // Clear invalid stored state, don't save here as loadData might be called early
                    activeProject = null;
                    sessionStartTime = null;
                    console.warn("Cleared inconsistent active state found during load.");
                }
            } else {
                 // Pre-select last tracked or first project in main dropdown
                const sortedProjects = Object.keys(projects).sort();
                if (lastTrackedProjectName && projects[lastTrackedProjectName] !== undefined) {
                    projectSelect.value = lastTrackedProjectName;
                } else if (sortedProjects.length > 0) {
                    projectSelect.value = sortedProjects[0];
                } else {
                     projectSelect.value = "";
                }
                projectSelected(); // Update main view button states based on selection
                setTrackingStateUI(false);
            }
        });
    }

    function saveSettings() {
        const newUrl = webhookUrlInput.value.trim();
        if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
            n8nWebhookUrl = newUrl;
            chrome.storage.local.set({ n8nWebhookUrl: newUrl }, () => {
                console.log('n8n Webhook URL saved:', newUrl);
                settingsSavedMsg.style.display = 'inline';
                setTimeout(() => { settingsSavedMsg.style.display = 'none'; }, 2000);
            });
        } else if (!newUrl) {
            n8nWebhookUrl = null;
            chrome.storage.local.remove('n8nWebhookUrl', () => {
                console.log('n8n Webhook URL removed.');
                 settingsSavedMsg.textContent = 'Webhook URL cleared.';
                 settingsSavedMsg.style.display = 'inline';
                 setTimeout(() => { settingsSavedMsg.textContent = 'Settings saved!'; settingsSavedMsg.style.display = 'none'; }, 2000);
            });
        } else {
            alert('Please enter a valid URL (starting with http:// or https://).');
        }
    }

    // Saves project data, active state, and last tracked project
    function saveCoreData(callback) {
        const activeState = activeProject ? { projectName: activeProject, startTime: sessionStartTime } : null;
        const projectsToSave = JSON.parse(JSON.stringify(projects));
        chrome.storage.local.set({
            projects: projectsToSave,
            activeState: activeState,
            lastTrackedProjectName: lastTrackedProjectName
        }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving core data:", chrome.runtime.lastError);
                alert("Error saving data. Please check console.");
            } else {
                 // Update UI elements *first*
                 if (currentView === 'settings-section') renderProjectListSettings();
                 if (currentView === 'report-section') renderReport();
                 updateProjectSelect(); // This rebuilds the dropdown

                 // Execute callback *after* UI updates
                 if (typeof callback === 'function') {
                     callback();
                 }
            }
        });
    }

     // Clears timer state, updates UI, and triggers save
     function clearActiveState(updateLastTracked = false, projectName = null) {
         console.log(`Clearing active state. Update last tracked: ${updateLastTracked}, Project: ${projectName}`);
         const wasActive = activeProject;
         activeProject = null;
         sessionStartTime = null;

         if (updateLastTracked && projectName) {
              lastTrackedProjectName = projectName;
         }

         currentProjectDisplay.textContent = wasActive ? `Stopped: ${wasActive}` : 'No project selected';
         stopTimerDisplay();
         setTrackingStateUI(false);
         projectSelected();

         saveCoreData();
         console.log("Active state cleared and saved trigger initiated.");
     }

    // --- UI Update Functions ---
    function updateProjectSelect() {
        const currentSelection = projectSelect.value;
        // Clear existing options
        while (projectSelect.firstChild) {
            projectSelect.removeChild(projectSelect.firstChild);
        }
        const placeholderOption = document.createElement('option');
        placeholderOption.value = "";
        placeholderOption.textContent = "-- Select Project --";
        projectSelect.appendChild(placeholderOption);

        const sortedProjects = Object.keys(projects).sort();

        for (const projectName of sortedProjects) {
            const option = document.createElement('option');
            option.value = projectName;
            option.textContent = projectName;
            projectSelect.appendChild(option);
        }

        if (activeProject && projects[activeProject] !== undefined) {
             projectSelect.value = activeProject;
        } else if (projects[currentSelection] !== undefined) {
             projectSelect.value = currentSelection;
        } else if (lastTrackedProjectName && projects[lastTrackedProjectName] !== undefined) {
             projectSelect.value = lastTrackedProjectName;
        } else if (sortedProjects.length > 0) {
             projectSelect.value = sortedProjects[0];
        } else {
             projectSelect.value = "";
        }
        // projectSelected(); // REMOVED: Don't call this automatically here
    }

    // --- Settings: Project List & Pagination ---
    function renderProjectListSettings() {
        // Clear existing list items
        while (projectListSettingsDiv.firstChild) {
            projectListSettingsDiv.removeChild(projectListSettingsDiv.firstChild);
        }
        
        const sortedProjects = Object.keys(projects).sort();
        const totalProjects = sortedProjects.length;
        const totalPages = Math.ceil(totalProjects / PROJECTS_PER_PAGE) || 1;

        if (projectsCurrentPage > totalPages) projectsCurrentPage = totalPages;
        if (projectsCurrentPage < 1) projectsCurrentPage = 1;

        const startIndex = (projectsCurrentPage - 1) * PROJECTS_PER_PAGE;
        const endIndex = startIndex + PROJECTS_PER_PAGE;
        const projectsToShow = sortedProjects.slice(startIndex, endIndex);

        if (totalProjects === 0) {
            const noProjectsMessage = document.createElement('p');
            noProjectsMessage.style.color = '#555';
            noProjectsMessage.style.textAlign = 'center';
            noProjectsMessage.textContent = 'No projects created yet.';
            projectListSettingsDiv.appendChild(noProjectsMessage);
        } else {
            projectsToShow.forEach(projectName => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'project-list-item';

                const nameSpan = document.createElement('span');
                nameSpan.textContent = projectName;

                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'project-item-controls';

                const editBtn = document.createElement('button');
                // Use textContent with emoji instead of innerHTML
                editBtn.textContent = '✏️';
                editBtn.title = `Rename ${projectName}`;
                editBtn.className = 'edit-proj-btn';
                editBtn.disabled = activeProject === projectName;
                editBtn.addEventListener('click', (e) => { e.stopPropagation(); renameProject(projectName); });

                const deleteBtn = document.createElement('button');
                // Use textContent with emoji instead of innerHTML
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = `Delete ${projectName}`;
                deleteBtn.className = 'delete-proj-btn';
                deleteBtn.disabled = activeProject === projectName;
                deleteBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteProject(projectName); });

                controlsDiv.appendChild(editBtn);
                controlsDiv.appendChild(deleteBtn);
                itemDiv.appendChild(nameSpan);
                itemDiv.appendChild(controlsDiv);
                projectListSettingsDiv.appendChild(itemDiv);
            });
        }

        projectListPageInfo.textContent = `Page ${projectsCurrentPage} of ${totalPages}`;
        projectListPrevBtn.disabled = projectsCurrentPage <= 1;
        projectListNextBtn.disabled = projectsCurrentPage >= totalPages;
    }

     function changeProjectListPage(direction) {
        const sortedProjects = Object.keys(projects).sort();
        const totalPages = Math.ceil(sortedProjects.length / PROJECTS_PER_PAGE) || 1;
        if (direction === 'next' && projectsCurrentPage < totalPages) {
             projectsCurrentPage++;
        } else if (direction === 'prev' && projectsCurrentPage > 1) {
             projectsCurrentPage--;
        }
         renderProjectListSettings();
     }

    // --- Project Management Functions ---
    function addProject() {
        let newName = newProjectNameInput.value;
        // Always trim before any validation
        const trimmedNewName = newName.trim();
        
        // Add input validation/sanitization for project names
        if (!trimmedNewName) {
            alert('Please enter a project name.');
            return;
        }
        
        // Prevent potentially malicious project names
        if (trimmedNewName.length > 50) {
            alert('Project name too long. Please use 50 characters or less.');
            return;
        }
        
        // Basic XSS protection - restrict special characters
        const invalidChars = /[<>'"&]/;
        if (invalidChars.test(trimmedNewName)) {
            alert('Project name contains invalid characters. Please avoid < > \' " &');
            return;
        }
        
        if (projects[trimmedNewName] === undefined) {
            projects[trimmedNewName] = { totalSeconds: 0, entries: {} };
            newProjectNameInput.value = '';
            // --- Modification Start: Pass callback to saveCoreData ---
            saveCoreData(() => {
                 // This runs after save and updateProjectSelect
                 projectSelect.value = trimmedNewName;
                 projectSelected(); // Update UI state based on new selection
                 console.log(`New project added and selected: ${trimmedNewName}`);
            });
            // --- Modification End ---
        } else if (projects[trimmedNewName] !== undefined) {
            alert('Project already exists!');
        }
    }

    function deleteProject(projectName) {
         if (activeProject === projectName) {
              alert('Cannot delete a project that is currently being tracked.');
              return;
         }
         if (confirm(`Are you sure you want to delete project \"${projectName}\" and all its time entries? This cannot be undone.`)) {
            const projectWasSelected = (projectSelect.value === projectName);
            delete projects[projectName];

            if (lastTrackedProjectName === projectName) {
                lastTrackedProjectName = null;
            }
            const totalPages = Math.ceil(Object.keys(projects).length / PROJECTS_PER_PAGE) || 1;
            if(projectsCurrentPage > totalPages) projectsCurrentPage = totalPages;

            saveCoreData();

            // --- Modification Start: Always call projectSelected after delete save ---
            requestAnimationFrame(() => {
                 if(projectWasSelected) {
                     projectSelect.value = "";
                 }
                 // Always update button states etc. after potential selection change
                 projectSelected();
            });
            // --- Modification End ---
         }
     }

     function renameProject(oldName) {
          if (activeProject === oldName) {
               alert('Cannot rename a project that is currently being tracked.');
               return;
          }
          const newName = prompt(`Enter new name for project \"${oldName}\":`, oldName);

          if (newName === null) return;
          const trimmedNewName = newName.trim();

          if (trimmedNewName === '') {
               alert("Project name cannot be empty.");
               return;
          }
          if (trimmedNewName === oldName) {
              return;
          }
          
          // Prevent potentially malicious project names
          if (trimmedNewName.length > 50) {
              alert('Project name too long. Please use 50 characters or less.');
              return;
          }
          
          // Basic XSS protection - restrict special characters
          const invalidChars = /[<>'"&]/;
          if (invalidChars.test(trimmedNewName)) {
              alert('Project name contains invalid characters. Please avoid < > \' " &');
              return;
          }
          
          if (projects[trimmedNewName] !== undefined) {
              alert(`Project \"${trimmedNewName}\" already exists. Please choose a different name.`);
              return;
          }

          const projectWasSelectedInDropdown = (projectSelect.value === oldName);
          projects[trimmedNewName] = projects[oldName];
          delete projects[oldName];

          if (lastTrackedProjectName === oldName) {
              lastTrackedProjectName = trimmedNewName;
          }

          saveCoreData();

          // --- Modification Start: Always call projectSelected after rename save ---
          requestAnimationFrame(() => { // Allow dropdown rebuild first
             if(projectWasSelectedInDropdown) {
                 projectSelect.value = trimmedNewName;
             }
             // Always update button states etc. after potential selection change
             if (currentView === 'main-view') {
                  projectSelected();
             }
              console.log(`Project renamed from ${oldName} to ${trimmedNewName}`);
          });
           // --- Modification End ---
     }

    // --- Timer Functions ---
    function startTimerDisplay() {
        console.log("startTimerDisplay called");
        if (timerInterval) clearInterval(timerInterval);
        const updateDisplay = () => {
             if (!sessionStartTime) {
                  console.warn("updateDisplay called but sessionStartTime is missing. Stopping timer.");
                  stopTimerDisplay();
                  return;
             }
             const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
             currentTimerDisplay.textContent = formatTime(elapsedSeconds);
        };
        timerInterval = setInterval(updateDisplay, 1000);
        updateDisplay(); // Initial update immediately
    }

    function stopTimerDisplay() {
        console.log("stopTimerDisplay called");
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            console.log("Timer interval cleared.");
        }
        currentTimerDisplay.textContent = formatTime(0);
    }

    // Updates *main view* tracking UI elements state ONLY
    function setTrackingStateUI(isTracking) {
        const projectIsSelected = !!projectSelect.value;
        console.log(`Setting tracking UI state: isTracking=${isTracking}, projectIsSelected=${projectIsSelected}`);

        startBtn.disabled = isTracking || !projectIsSelected;
        stopBtn.disabled = !isTracking;

        projectSelect.disabled = isTracking;
        newProjectNameInput.disabled = isTracking;
        addProjectBtn.disabled = isTracking;
    }

    function startTracking() {
        const selectedProject = projectSelect.value;
        if (!selectedProject) {
            console.warn("Start ignored: No project selected.");
            return;
        }
        if (activeProject) {
            console.warn("Start ignored: A project is already active.", activeProject);
            return;
        }

        activeProject = selectedProject;
        sessionStartTime = Date.now();
        console.log(`Starting timer for ${activeProject} at ${sessionStartTime}`);

        currentProjectDisplay.textContent = `Tracking: ${activeProject}`;
        setTrackingStateUI(true);
        startTimerDisplay();

        saveCoreData();

        if (currentView === 'settings-section') {
            renderProjectListSettings();
        }
        console.log("Tracking started successfully.");
    }

    function stopTracking() {
        console.log("Stop tracking called.");
        if (!activeProject || !sessionStartTime) {
            console.warn("Stop tracking ignored: No project active.");
            return;
        }

        const stopTime = Date.now();
        const startTime = sessionStartTime;
        const elapsedSeconds = Math.max(0, Math.floor((stopTime - startTime) / 1000));
        const projectThatWasStopped = activeProject;
        const currentDate = getCurrentDateString();
        console.log(`Processing stop for ${projectThatWasStopped}. Elapsed: ${elapsedSeconds}s`);

        activeProject = null;
        sessionStartTime = null;
        stopTimerDisplay();

        try {
            if (!projects[projectThatWasStopped]) {
                console.error("Project data missing for key on stop:", projectThatWasStopped);
                projects[projectThatWasStopped] = { totalSeconds: 0, entries: {} };
            }
            projects[projectThatWasStopped].totalSeconds = (projects[projectThatWasStopped].totalSeconds || 0) + elapsedSeconds;
            if (!projects[projectThatWasStopped].entries) projects[projectThatWasStopped].entries = {};
            projects[projectThatWasStopped].entries[currentDate] = (projects[projectThatWasStopped].entries[currentDate] || 0) + elapsedSeconds;
            console.log("Project data updated in memory.");
        } catch (error) {
            console.error("CRITICAL: Error updating project data in memory:", error);
            alert("Error processing time data. Please check the console log.");
            setTrackingStateUI(false);
            projectSelected();
            return;
        }

        const webhookPromise = (n8nWebhookUrl && elapsedSeconds > 0)
            ? sendToWebhook(startTime, stopTime, currentDate, projectThatWasStopped, elapsedSeconds)
            : Promise.resolve({ skipped: true, reason: !n8nWebhookUrl ? 'No URL' : 'Zero duration' });

        webhookPromise
            .catch(error => {
                console.warn("Webhook operation failed or was skipped:", error);
            })
            .finally(() => {
                console.log("Webhook promise finished. Saving final state and updating UI.");

                lastTrackedProjectName = projectThatWasStopped;

                saveCoreData();

                currentProjectDisplay.textContent = `Stopped: ${projectThatWasStopped}`;
                setTrackingStateUI(false);
                projectSelected();

                console.log("Stop processing complete.");
            });
    }

    // Helper function for webhook fetch call
    function sendToWebhook(startTime, stopTime, currentDate, projectName, durationSeconds) {
        const payload = {
            sessionStartTime: new Date(startTime).toISOString(),
            sessionStopTime: new Date(stopTime).toISOString(),
            date: currentDate,
            projectName: projectName,
            durationSeconds: durationSeconds
        };
        console.log('Sending payload to n8n:', JSON.stringify(payload));
        return fetch(n8nWebhookUrl, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) })
            .then(response => {
                if (!response.ok) {
                    console.error('n8n webhook call failed:', response.status, response.statusText);
                    throw new Error(`N8N request failed: ${response.status}`);
                }
                console.log('Successfully sent data to n8n.');
                return { success: true };
            })
            .catch(error => {
                console.error('Fetch error sending data to n8n:', error);
                 throw new Error(`N8N request error: ${error.message || error}`);
            });
    }

    // Handles enabling/disabling START button and updating display text based on MAIN project selection when NOT tracking
    function projectSelected() {
        const selectedProject = projectSelect.value;
        if (activeProject) {
            console.warn("projectSelected called while project is active.");
            return;
        }
        console.log(`Project selected in dropdown: ${selectedProject || 'None'}`);

        startBtn.disabled = !selectedProject;

        if (selectedProject) {
             currentProjectDisplay.textContent = `Selected: ${selectedProject}`;
        } else {
             currentProjectDisplay.textContent = 'No project selected';
        }
    }

    // --- Report Generation ---
    function renderReport() {
        // Clear existing content
        while (reportSummaryDiv.firstChild) {
            reportSummaryDiv.removeChild(reportSummaryDiv.firstChild);
        }
        while (reportVisualDiv.firstChild) {
            reportVisualDiv.removeChild(reportVisualDiv.firstChild);
        }

        const projectNames = Object.keys(projects);
        if (projectNames.length === 0) {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No time tracked yet.';
            reportSummaryDiv.appendChild(noDataMessage);
            return;
        }

        let grandTotalSeconds = 0;
        const projectTotals = projectNames.map(name => {
             const totalSeconds = projects[name]?.totalSeconds || 0;
             grandTotalSeconds += totalSeconds;
             return { name, totalSeconds };
        }).filter(p => p.totalSeconds > 0)
          .sort((a, b) => b.totalSeconds - a.totalSeconds);

        const summaryP = document.createElement('p');
        if (projectTotals.length > 0) {
           summaryP.textContent = `Total time tracked: ${formatTime(grandTotalSeconds)} across ${projectTotals.length} project(s).`;
        } else {
            summaryP.textContent = 'No time tracked for any projects yet.';
        }
        reportSummaryDiv.appendChild(summaryP);

        projectTotals.forEach(proj => {
            const percentage = grandTotalSeconds > 0 ? (proj.totalSeconds / grandTotalSeconds) * 100 : 0;
            const formattedTime = formatTime(proj.totalSeconds);

            const itemDiv = document.createElement('div');
            itemDiv.className = 'vis-item';

            const label = document.createElement('span');
            label.className = 'vis-label';
            label.textContent = proj.name;

            const barContainer = document.createElement('div');
            barContainer.className = 'vis-bar-container';

            const bar = document.createElement('div');
            bar.className = 'vis-bar';
            bar.style.width = '0%';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => { bar.style.width = `${percentage}%`; });
            });

            const barText = document.createElement('span');
            barText.className = 'vis-bar-text';
            if (percentage > 10) {
                 barText.textContent = formattedTime;
            }
            barText.title = formattedTime;

            bar.appendChild(barText);
            barContainer.appendChild(bar);
            itemDiv.appendChild(label);
            itemDiv.appendChild(barContainer);
            reportVisualDiv.appendChild(itemDiv);
        });
    }

    // --- Initialization ---
    settingsToggleBtn.addEventListener('click', toggleSettings);
    reportToggleBtn.addEventListener('click', toggleReport);
    saveSettingsBtn.addEventListener('click', saveSettings);

    addProjectBtn.addEventListener('click', addProject);
    startBtn.addEventListener('click', startTracking);
    stopBtn.addEventListener('click', stopTracking);
    projectSelect.addEventListener('change', projectSelected);

    // Pagination Listeners
    projectListPrevBtn.addEventListener('click', () => changeProjectListPage('prev'));
    projectListNextBtn.addEventListener('click', () => changeProjectListPage('next'));

    // Edit/Delete listeners added dynamically in renderProjectListSettings

    // --- Modification Start: Add Enter key listener for adding project ---
    newProjectNameInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent potential form submission
            addProject();
        }
    });
    // --- Modification End ---

    loadData(); // Load data on startup
    showView('main-view'); // Show main view initially
}); 