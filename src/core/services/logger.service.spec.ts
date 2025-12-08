import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log warnings', () => {
    logger.warn('test warning');
    expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN] test warning');
  });

  it('should log errors', () => {
    const error = new Error('test error');
    logger.error('something failed', error);
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] something failed', error);
  });

  it('should log errors without error object', () => {
    logger.error('something failed');
    expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR] something failed', undefined);
  });
});
