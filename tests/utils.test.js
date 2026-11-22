/**
 * Utility function tests for TimeTracker.
 * These tests focus on standalone functions that don't require extensive DOM interaction.
 */

const { formatTime, getCurrentDateString } = require('../lib.js');

describe('formatTime utility', () => {
  test('formats seconds into HH:MM:SS format', () => {
    expect(formatTime(3661)).toBe('01:01:01');
    expect(formatTime(0)).toBe('00:00:00');
    expect(formatTime(86399)).toBe('23:59:59'); // 1 day - 1 second
  });

  test('handles edge cases and invalid inputs', () => {
    expect(formatTime(null)).toBe('00:00:00');
    expect(formatTime(undefined)).toBe('00:00:00');
    expect(formatTime(NaN)).toBe('00:00:00');
    expect(formatTime('not a number')).toBe('00:00:00');
  });
});

describe('getCurrentDateString utility', () => {
  // Save original Date implementation
  const RealDate = Date;
  
  beforeEach(() => {
    // Mock the date
    global.Date = class extends RealDate {
      constructor() {
        super();
        return new RealDate('2023-08-15T12:00:00Z');
      }
    };
  });
  
  afterEach(() => {
    // Restore original Date
    global.Date = RealDate;
  });
  
  test('returns date in YYYY-MM-DD format', () => {
    expect(getCurrentDateString()).toBe('2023-08-15');
  });
}); 