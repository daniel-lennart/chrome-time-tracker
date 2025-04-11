/**
 * Tests for webhook functionality in the TimeTracker extension.
 */

// Mock implementation of sendToWebhook function
const sendToWebhook = (startTime, stopTime, currentDate, projectName, durationSeconds) => {
  const payload = {
    sessionStartTime: new Date(startTime).toISOString(),
    sessionStopTime: new Date(stopTime).toISOString(),
    date: currentDate,
    projectName: projectName,
    durationSeconds: durationSeconds
  };
  
  return fetch('https://example.com/webhook', { 
    method: 'POST', 
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(payload) 
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return { success: true };
  });
};

describe('Webhook Functionality', () => {
  beforeEach(() => {
    // Reset all mocks
    global.fetch.mockReset();
    global.fetch.mockResolvedValue({ ok: true });
  });
  
  test('sendToWebhook should send the correct payload', async () => {
    const startTime = 1629100000000; // Monday, August 16, 2021 10:00:00 AM
    const stopTime = 1629103600000;  // Monday, August 16, 2021 11:00:00 AM
    const currentDate = '2021-08-16';
    const projectName = 'Test Project';
    const durationSeconds = 3600; // 1 hour
    
    // Call the function
    await sendToWebhook(startTime, stopTime, currentDate, projectName, durationSeconds);
    
    // Verify fetch was called with the correct arguments
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          sessionStartTime: new Date(startTime).toISOString(),
          sessionStopTime: new Date(stopTime).toISOString(),
          date: currentDate,
          projectName: projectName,
          durationSeconds: durationSeconds
        })
      }
    );
  });
  
  test('sendToWebhook should handle errors', async () => {
    // Mock fetch to throw an error
    global.fetch.mockRejectedValue(new Error('Network error'));
    
    // Call the function and expect it to reject
    await expect(sendToWebhook(
      Date.now(),
      Date.now() + 3600000,
      '2023-08-15',
      'Test Project',
      3600
    )).rejects.toThrow();
    
    // Mock fetch to return a non-OK response
    global.fetch.mockResolvedValue({ ok: false, status: 404 });
    
    // Call the function and expect it to reject
    await expect(sendToWebhook(
      Date.now(),
      Date.now() + 3600000,
      '2023-08-15',
      'Test Project',
      3600
    )).rejects.toThrow();
  });
}); 