const logger = require('./logger');

describe('logger', () => {
  it('supports labeled device loggers', () => {
    const deviceLogger = logger.child({ label: 'Device', deviceId: 'uid:123' });

    expect(deviceLogger.bindings()).toEqual({
      label: 'Device',
      deviceId: 'uid:123'
    });
  });
});
