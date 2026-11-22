/**
 * Tests for project name validation logic in TimeTracker.
 */

const { validateProjectName } = require('../lib.js');

describe('Project name validation', () => {
  test('accepts valid project names', () => {
    expect(validateProjectName('Project1').valid).toBe(true);
    expect(validateProjectName('My Project').valid).toBe(true);
    expect(validateProjectName('Project_With_Underscores').valid).toBe(true);
    expect(validateProjectName('Project-With-Hyphens').valid).toBe(true);
    expect(validateProjectName('Project.With.Dots').valid).toBe(true);
    expect(validateProjectName('123NumericProject').valid).toBe(true);
    expect(validateProjectName('A').valid).toBe(true); // Single character
    expect(validateProjectName('🚀 Rocket Project').valid).toBe(true); // With emoji
  });
  
  test('trims whitespace from project names', () => {
    const result = validateProjectName('   Trimmed Project   ');
    expect(result.valid).toBe(true);
    expect(result.trimmedName).toBe('Trimmed Project');
  });
  
  test('rejects empty project names', () => {
    expect(validateProjectName('').valid).toBe(false);
    expect(validateProjectName('   ').valid).toBe(false);
  });
  
  test('rejects project names that are too long', () => {
    const longName = 'A'.repeat(51);
    expect(validateProjectName(longName).valid).toBe(false);
  });
  
  test('accepts project names at the maximum length', () => {
    const maxLengthName = 'A'.repeat(50);
    expect(validateProjectName(maxLengthName).valid).toBe(true);
  });
  
  test('rejects project names with HTML/XSS characters', () => {
    expect(validateProjectName('<script>alert("XSS")</script>').valid).toBe(false);
    expect(validateProjectName('Project</div><script>').valid).toBe(false);
    expect(validateProjectName('Project & Testing').valid).toBe(false);
    expect(validateProjectName('Project "quotes"').valid).toBe(false);
    expect(validateProjectName("Single 'quote' test").valid).toBe(false);
    expect(validateProjectName('Project > Test < Project').valid).toBe(false);
  });
}); 
describe('Project name validation (rename inputs)', () => {
  test('trims surrounding whitespace and returns the trimmed name', () => {
    expect(validateProjectName('  Renamed  ')).toEqual({ valid: true, trimmedName: 'Renamed' });
  });

  test('treats null/undefined (e.g. a cancelled prompt passed through) as empty', () => {
    expect(validateProjectName(null).valid).toBe(false);
    expect(validateProjectName(undefined).valid).toBe(false);
  });
});
