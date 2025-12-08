import { describe, it, expect } from 'vitest';
import { ConfigService, SESSION_ID_PATTERN } from './config.service';

describe('ConfigService', () => {
  it('should export SESSION_ID_PATTERN constant', () => {
    expect(SESSION_ID_PATTERN).toBeDefined();
    expect(SESSION_ID_PATTERN).toBeInstanceOf(RegExp);
  });

  it('SESSION_ID_PATTERN should match valid session IDs', () => {
    expect(SESSION_ID_PATTERN.test('ABC123')).toBe(true);
    expect(SESSION_ID_PATTERN.test('A1B2C3')).toBe(true);
    expect(SESSION_ID_PATTERN.test('000000')).toBe(true);
    expect(SESSION_ID_PATTERN.test('ZZZZZZ')).toBe(true);
  });

  it('SESSION_ID_PATTERN should reject invalid session IDs', () => {
    expect(SESSION_ID_PATTERN.test('abc123')).toBe(false); // lowercase
    expect(SESSION_ID_PATTERN.test('ABC12')).toBe(false);  // too short
    expect(SESSION_ID_PATTERN.test('ABC1234')).toBe(false); // too long
    expect(SESSION_ID_PATTERN.test('ABC-12')).toBe(false); // special char
    expect(SESSION_ID_PATTERN.test('')).toBe(false);       // empty
  });
});

describe('ConfigService instance', () => {
  const config = new ConfigService();

  it('should have correct app name', () => {
    expect(config.appName).toBe("Erin's Escapades");
  });

  it('should have features configuration', () => {
    expect(config.features.revealVoteThreshold).toBe(2);
  });

  it('should have QR code configuration', () => {
    expect(config.qrCode.width).toBe(256);
    expect(config.qrCode.margin).toBe(2);
    expect(config.qrCode.colorDark).toBeDefined();
    expect(config.qrCode.colorLight).toBeDefined();
  });

  it('should have session configuration', () => {
    expect(config.session.idLength).toBe(6);
    expect(config.session.idPattern).toBeInstanceOf(RegExp);
  });

  it('should have UI configuration', () => {
    expect(config.ui.copyFeedbackDuration).toBe(2000);
  });
});
