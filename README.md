# TimeTracker Chrome Extension

A simple yet powerful Chrome extension for tracking time spent on different projects. Track your work with a single click, visualize your time distribution, and export data to external services via webhooks.

## Features

- **Project-based Time Tracking**: Create and manage multiple projects
- **One-Click Tracking**: Quickly start/stop tracking for recently used projects
- **Date-Based Records**: Automatically organizes tracked time by date
- **Visual Reports**: View time distribution across projects with a simple bar chart
- **Webhook Integration**: Connect with automation platforms like n8n, Make.com, or any webhook-compatible service
- **Project Management**: Rename or delete projects as needed
- **Pagination**: Efficiently manage large numbers of projects

## Installation

1. **Download/Clone the Repository**
   ```
   git clone https://github.com/your-username/TimeTracker.git
   ```
   Or download as a ZIP file and extract it.

2. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked" and select the extension directory

3. **Configure Webhook (Optional)**
   - Click the settings icon (⚙️) in the extension popup
   - Enter your webhook URL from n8n, Make.com, or any other webhook service
   - Click "Save" to store your webhook configuration

## Usage

### Basic Time Tracking
1. Select a project from the dropdown or create a new one
2. Click "Start" to begin tracking time
3. Click "Stop" when finished

### Project Management
1. Access the Settings view by clicking the gear icon (⚙️)
2. Use the pagination controls to navigate through your projects
3. Click the edit icon (✏️) to rename a project
4. Click the delete icon (🗑️) to remove a project

### Reports
1. Access the Reports view by clicking the chart icon (📊)
2. View a summary of total time tracked
3. See a visual representation of time distribution across projects

## Webhook Integration

When you stop tracking time, the extension can automatically send session data to an external service via webhook. This allows for:

- Logging time entries to spreadsheets (Google Sheets, Excel, etc.)
- Creating invoices or time reports
- Triggering automation workflows

### Compatible Services
- **n8n**: Create workflows to process and route your time data
- **Make.com** (formerly Integromat): Connect your time tracking to hundreds of apps
- **Zapier**: Automate your time tracking integrations
- **Custom APIs**: Send data to your own backend services

### Data Format
The extension sends the following JSON payload to your webhook endpoint:
```json
{
  "sessionStartTime": "2023-05-15T14:30:45.123Z",
  "sessionStopTime": "2023-05-15T15:45:12.456Z",
  "date": "2023-05-15",
  "projectName": "Project Name",
  "durationSeconds": 4467
}
```

## Data Structure

Time tracking data is stored locally using Chrome's storage API with the following structure:

```javascript
{
  "projects": {
    "Project 1": {
      "totalSeconds": 3600,
      "entries": {
        "2023-05-15": 1800,
        "2023-05-16": 1800
      }
    },
    "Project 2": {
      "totalSeconds": 7200,
      "entries": {
        "2023-05-15": 3600,
        "2023-05-17": 3600
      }
    }
  },
  "activeState": {
    "projectName": "Currently Active Project",
    "startTime": 1684157445123
  },
  "lastTrackedProjectName": "Most Recently Tracked Project",
  "n8nWebhookUrl": "https://your-webhook-url.com/hook"
}
```

## Customization

The extension can be customized by modifying:
- `popup.html` for changing layout structure
- `popup.css` for updating styles and appearance
- `popup.js` for altering functionality and behavior
- `manifest.json` for extension configuration

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 