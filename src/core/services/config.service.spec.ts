import { describe, it, expect } from 'vitest';
import { ConfigService } from './config.service';

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

describe('ConfigService session.idPattern', () => {
  const config = new ConfigService();
  const pattern = config.session.idPattern;

  it('should match valid session IDs', () => {
    expect(pattern.test('ABC123')).toBe(true);
    expect(pattern.test('A1B2C3')).toBe(true);
    expect(pattern.test('000000')).toBe(true);
    expect(pattern.test('ZZZZZZ')).toBe(true);
  });

  it('should reject invalid session IDs', () => {
    expect(pattern.test('abc123')).toBe(false); // lowercase
    expect(pattern.test('ABC12')).toBe(false);  // too short
    expect(pattern.test('ABC1234')).toBe(false); // too long
    expect(pattern.test('ABC-12')).toBe(false); // special char
    expect(pattern.test('')).toBe(false);       // empty
  });
});
