# Chrome Time Tracker

A small Manifest V3 Chrome extension for tracking time against projects, with optional export of each session to a webhook (for example n8n or Make).

[![Test](https://github.com/daniel-lennart/chrome-time-tracker/actions/workflows/test.yml/badge.svg)](https://github.com/daniel-lennart/chrome-time-tracker/actions/workflows/test.yml)

Start and stop a timer for a named project from the toolbar popup. Time is stored locally per project and per day, shown as a simple bar chart, and, if you configure a webhook, each finished session is posted as JSON so you can log it to a spreadsheet or automation workflow.

<!-- TODO: screenshot -->

## Quick start

1. Clone the repository:
   ```bash
   git clone https://github.com/daniel-lennart/chrome-time-tracker.git
   ```
2. In Chrome, open `chrome://extensions/`, enable **Developer mode** and click **Load unpacked**, then select the cloned folder.
3. Open the extension popup, add a project with **+** and press **Start** / **Stop**.
4. Optional: open Settings (⚙️), paste a webhook URL and click **Save Settings**. See [Permissions and privacy](#permissions-and-privacy) before using a webhook that is not on n8n Cloud.

To run the tests:

```bash
npm ci
npm test
```

## How it works

- Everything lives in the popup (`popup.html`, `popup.js`, `popup.css`); there is no background service worker.
- The start time of the active session is saved to `chrome.storage.local`, so closing the popup does not stop the timer.
- On **Stop**, the elapsed seconds are added to the project's total and to the entry for the current date.
- Settings lets you rename or delete projects (five per page). The Report view (📊) shows all-time totals per project as a bar chart.
- If a webhook URL is saved and the session lasted at least one second, the popup sends one `POST` with this body:

  ```json
  {
    "sessionStartTime": "2023-05-15T14:30:45.123Z",
    "sessionStopTime": "2023-05-15T15:45:12.456Z",
    "date": "2023-05-15",
    "projectName": "Project Name",
    "durationSeconds": 4467
  }
  ```

Stored data shape (`chrome.storage.local`):

```javascript
{
  "projects": {
    "Project 1": { "totalSeconds": 3600, "entries": { "2023-05-15": 1800, "2023-05-16": 1800 } }
  },
  "activeState": { "projectName": "Project 1", "startTime": 1684157445123 },
  "lastTrackedProjectName": "Project 1",
  "n8nWebhookUrl": "https://example.com/webhook"
}
```

## Permissions and privacy

- **`storage`**: projects, time entries, the active session and the webhook URL are kept in `chrome.storage.local` on your machine. The extension does not read tabs, history or page content.
- **`host_permissions`**: `manifest.json` allows `https://*.app.n8n.cloud/*`, so any n8n Cloud webhook works. Chrome only grants the popup permission to make cross-origin requests to hosts listed there; requests to any other webhook (Make, a self-hosted n8n) are subject to CORS and may be blocked unless that server allows them. To use another endpoint, add its origin to `host_permissions` and reload the extension. Keep the list as narrow as you can: it is the extension's only network permission.
- **What leaves the browser**: nothing, unless you save a webhook URL. If you do, each stopped session sends the five fields shown above (start and stop time, date, project name, duration) to that URL and nowhere else. There is no analytics or telemetry.
- The popup logs the webhook URL and payload to its developer-tools console.

## Limitations

- Manual tracking only, one project at a time; it does not detect activity or websites.
- A session is credited to the date on which it is stopped, including sessions that run past midnight.
- Webhook delivery is a single attempt with no retry or queue; failures are only written to the console (local data is saved regardless).
- The report shows all-time totals only; per-day entries are stored but not displayed.
- Unit tests cover the pure helpers in `lib.js` (time formatting, name validation, webhook payload and POST), which `popup.js` uses; the popup's DOM wiring has no automated tests.

## Licence

MIT. See [LICENSE](LICENSE).
