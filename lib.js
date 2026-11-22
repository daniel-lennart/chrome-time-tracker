// Pure helpers shared by popup.js and the Jest tests. No DOM or chrome.* access here, so the
// tests exercise the same code the extension runs. Loaded as a classic script before popup.js
// (exposed as window.TimeTrackerLib) and via require() under Node.
(function (root) {
    'use strict';

    const MAX_PROJECT_NAME_LENGTH = 50;
    const INVALID_NAME_CHARS = /[<>'"&]/;

    function getCurrentDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatTime(totalSeconds) {
        if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds)) {
            return '00:00:00';
        }
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // Returns { valid: true, trimmedName } or { valid: false, message }.
    function validateProjectName(name) {
        const trimmedName = String(name ?? '').trim();
        if (!trimmedName) {
            return { valid: false, message: 'Please enter a project name.' };
        }
        if (trimmedName.length > MAX_PROJECT_NAME_LENGTH) {
            return { valid: false, message: `Project name too long. Please use ${MAX_PROJECT_NAME_LENGTH} characters or less.` };
        }
        if (INVALID_NAME_CHARS.test(trimmedName)) {
            return { valid: false, message: 'Project name contains invalid characters. Please avoid < > \' " &' };
        }
        return { valid: true, trimmedName };
    }

    function buildWebhookPayload(startTime, stopTime, currentDate, projectName, durationSeconds) {
        return {
            sessionStartTime: new Date(startTime).toISOString(),
            sessionStopTime: new Date(stopTime).toISOString(),
            date: currentDate,
            projectName: projectName,
            durationSeconds: durationSeconds
        };
    }

    // POSTs the payload as JSON. Resolves { success: true } on a 2xx, rejects otherwise.
    function postToWebhook(url, payload, fetchImpl) {
        const doFetch = fetchImpl || fetch;
        return doFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`N8N request failed: ${response.status}`);
                }
                return { success: true };
            });
    }

    const api = { getCurrentDateString, formatTime, validateProjectName, buildWebhookPayload, postToWebhook };
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.TimeTrackerLib = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
