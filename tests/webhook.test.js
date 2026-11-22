/**
 * Tests for the webhook payload and POST helpers that popup.js uses (lib.js).
 */
const { buildWebhookPayload, postToWebhook } = require('../lib.js');

describe('Webhook Functionality', () => {
  const url = 'https://example.app.n8n.cloud/webhook/test';
  const startTime = 1629100000000; // 2021-08-16 07:46:40 UTC
  const stopTime = 1629103600000;  // one hour later
  const currentDate = '2021-08-16';
  const projectName = 'Test Project';
  const durationSeconds = 3600;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  test('buildWebhookPayload has exactly the five documented fields', () => {
    expect(buildWebhookPayload(startTime, stopTime, currentDate, projectName, durationSeconds)).toEqual({
      sessionStartTime: new Date(startTime).toISOString(),
      sessionStopTime: new Date(stopTime).toISOString(),
      date: currentDate,
      projectName,
      durationSeconds
    });
  });

  test('postToWebhook POSTs the payload as JSON to the configured URL', async () => {
    const payload = buildWebhookPayload(startTime, stopTime, currentDate, projectName, durationSeconds);
    await expect(postToWebhook(url, payload)).resolves.toEqual({ success: true });
    expect(fetch).toHaveBeenCalledWith(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  });

  test('postToWebhook rejects on a network error and on a non-2xx response', async () => {
    const payload = buildWebhookPayload(startTime, stopTime, currentDate, projectName, durationSeconds);
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(postToWebhook(url, payload)).rejects.toThrow('Network error');
    global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    await expect(postToWebhook(url, payload)).rejects.toThrow('N8N request failed: 404');
  });
});
