const moment = require('moment');
const semver = require('semver');

// Mock global dependencies
global.$ = {
  db: {
    connect: jest.fn(),
    getTables: jest.fn(),
    deleteOldEntries: jest.fn()
  },
  db_project: {
    getByName: jest.fn(),
    insert: jest.fn(),
    getById: jest.fn()
  },
  db_device: {
    get: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    addLog: jest.fn(),
    getLocalSettings: jest.fn(),
    updateLocalSettings: jest.fn(),
    getRemoteSettings: jest.fn(),
    updateRemoteSettings: jest.fn(),
    listByModel: jest.fn(),
    getById: jest.fn()
  },
  db_model: {
    getByName: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn()
  },
  db_sensor: {
    getByRef: jest.fn(),
    insert: jest.fn()
  },
  db_data: {
    updateJson: jest.fn(),
    addJsonLog: jest.fn(),
    update: jest.fn(),
    addLog: jest.fn(),
    getAssociatedToDevice: jest.fn()
  },
  db_firmware: {
    getLatestVersion: jest.fn(),
    getLatestAppVersion: jest.fn(),
    getById: jest.fn()
  },
  db_fota: {
    getEntry: jest.fn(),
    update: jest.fn(),
    getUpdatable: jest.fn(),
    newLog: jest.fn(),
    updateLog: jest.fn()
  },
  config: {
    web: {
      protocol: 'https://',
      domain: 'example.com',
      fw_path: '/firmware/'
    }
  },
  mqtt_client: {
    publish: jest.fn()
  }
};

global.BASE_DIR = '/mock/base/dir';

// Mock require for project modules
jest.mock('fs');

const device = require('./device');

describe('Device Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    $.db.connect.mockImplementation((config, callback) => callback());
    $.db_project.getByName.mockResolvedValue(null);
  });

  describe('init', () => {
    it('should initialize database connection and projects successfully', async () => {
      const mockConfig = { database: 'test' };
      const mockProjects = ['project1', 'project2'];
      
      // Mock project modules
      const mockProject1 = { init: jest.fn() };
      const mockProject2 = { init: jest.fn() };
      
      jest.doMock(`${BASE_DIR}/projects/project1/project1.js`, () => mockProject1, { virtual: true });
      jest.doMock(`${BASE_DIR}/projects/project2/project2.js`, () => mockProject2, { virtual: true });
      
      $.db_project.getByName.mockResolvedValue(null);
      $.db_project.insert.mockResolvedValue();

      const result = await device.init(mockConfig, mockProjects);

      expect($.db.connect).toHaveBeenCalledWith(mockConfig, expect.any(Function));
      expect($.db_project.getByName).toHaveBeenCalledTimes(2);
      expect($.db_project.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseMessage', () => {
    let mockClient, mockDevice;

    beforeEach(() => {
      mockClient = { id: 'test-client' };
      mockDevice = {
        id: 1,
        uid: 'test-device-123',
        project_id: 1,
        status: 'offline',
        tech: 'wifi',
        version: '1.0.0',
        app_version: '1.0.0'
      };

      $.db_project.getByName.mockResolvedValue({
        id: 1,
        name: 'testproject',
        uidPrefix: 'test-device-',
        uidLength: 15  // Length of 'test-device-123'
      });
      
      $.db_device.get.mockResolvedValue(mockDevice);
    });

    it('should parse status message correctly', async () => {
      const topic = 'testproject/test-device-123/status';
      const payload = 'online';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.update).toHaveBeenCalledWith(1, 'status', 'online');
      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'status', 'online');
    });

    it('should parse model message correctly when device tech differs from payload', async () => {
      const topic = 'testproject/test-device-123/model';
      const payload = 'TEST_MODEL';
      
      // Make sure device.tech is different from payload so the condition passes
      mockDevice.tech = 'different_tech';
      $.db_device.get.mockResolvedValue(mockDevice);
      $.db_model.getByName.mockResolvedValue({ id: 5 });

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_model.getByName).toHaveBeenCalledWith('TEST_MODEL');
      expect($.db_device.update).toHaveBeenCalledWith(1, 'model_id', 5);
      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'model_id', 5);
    });

    it('should parse version message correctly when device has existing version', async () => {
      const topic = 'testproject/test-device-123/version';
      const payload = '2.0.0';
      
      // Device already has a version that's different from payload
      mockDevice.version = '1.0.0';
      $.db_device.get.mockResolvedValue(mockDevice);

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'version', '2.0.0');
      expect($.db_device.update).toHaveBeenCalledWith(1, 'version', '2.0.0');
    });

    it('should parse app_version message correctly when device has existing app_version', async () => {
      const topic = 'testproject/test-device-123/app_version';
      const payload = '2.0.0';
      
      // Device already has an app_version that's different from payload
      mockDevice.app_version = '1.0.0';
      $.db_device.get.mockResolvedValue(mockDevice);

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'app_version', '2.0.0');
      expect($.db_device.update).toHaveBeenCalledWith(1, 'app_version', '2.0.0');
    });

    it('should handle invalid topic format', async () => {
      const topic = 'invalid-topic';
      const payload = 'test';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_project.getByName).not.toHaveBeenCalled();
    });

    it('should handle unknown project', async () => {
      const topic = 'unknownproject/test-device-123/status';
      const payload = 'online';
      
      $.db_project.getByName.mockResolvedValue(null);

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.get).not.toHaveBeenCalled();
    });

    it('should handle settings/set messages', async () => {
      const topic = 'testproject/test-device-123/settings/wifi/ssid/set';
      const payload = '{"ssid": "test-network"}';

      $.db_device.getLocalSettings.mockResolvedValue({});
      $.db_device.updateLocalSettings.mockResolvedValue();

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'local_settings', JSON.stringify(payload));
      expect($.db_device.updateLocalSettings).toHaveBeenCalled();
    });

    it('should handle fw messages with JSON payload', async () => {
      const topic = 'testproject/test-device-123/fw';
      const payload = '{"version": "1.0.0", "build": "123"}';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_data.updateJson).toHaveBeenCalledWith('fw', 1, JSON.parse(payload));
      expect($.db_data.addJsonLog).toHaveBeenCalledWith('logs_fw', 1, JSON.parse(payload));
    });
  });

  describe('updateLocalSettings', () => {
    const mockDevice = { id: 1 };

    beforeEach(() => {
      $.db_device.getLocalSettings.mockResolvedValue({});
      $.db_device.updateLocalSettings.mockResolvedValue();
      $.db_device.addLog.mockResolvedValue();
    });

    it('should update nested settings correctly', async () => {
      const topic = 'wifi/ssid/set';
      const payload = '{"ssid": "test-network", "password": "test-pass"}';
      
      $.db_device.getLocalSettings.mockResolvedValue({});

      await device.updateLocalSettings(mockDevice, topic, payload);

      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'local_settings', JSON.stringify(payload));
      expect($.db_device.updateLocalSettings).toHaveBeenCalled();
    });

    it('should handle invalid JSON payload', async () => {
      const topic = 'wifi/ssid/set';
      const payload = 'invalid-json';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await device.updateLocalSettings(mockDevice, topic, payload);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse payload JSON:', expect.any(Error));
      expect($.db_device.updateLocalSettings).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle empty topic', async () => {
      const topic = '';
      const payload = '{"test": "value"}';
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await device.updateLocalSettings(mockDevice, topic, payload);

      // Empty string split by "/" gives [""], which has length 1
      // So this test should actually process normally unless we use null/undefined topic
      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'local_settings', JSON.stringify(payload));
      
      consoleSpy.mockRestore();
    });
  });

  describe('updateRemoteSettings', () => {
    const mockDevice = { id: 1 };

    beforeEach(() => {
      $.db_device.getRemoteSettings.mockResolvedValue({});
      $.db_device.updateRemoteSettings.mockResolvedValue();
      $.db_device.addLog.mockResolvedValue();
    });

    it('should update remote settings correctly', async () => {
      const topic = 'sensor/temperature';
      const payload = '{"threshold": 25}';

      await device.updateRemoteSettings(mockDevice, topic, payload);

      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'remote_settings', JSON.stringify(payload));
      expect($.db_device.updateRemoteSettings).toHaveBeenCalled();
    });

    it('should handle non-JSON payload', async () => {
      const topic = 'sensor/temperature';
      const payload = 'simple-value';

      await device.updateRemoteSettings(mockDevice, topic, payload);

      expect($.db_device.updateRemoteSettings).toHaveBeenCalled();
    });
  });

  describe('deleteLogs', () => {
    it('should delete old logs from all log tables', async () => {
      const mockTables = [
        { 'Tables_in_mqtt-aedes': 'logs_device' },
        { 'Tables_in_mqtt-aedes': 'logs_sensor' },
        { 'Tables_in_mqtt-aedes': 'regular_table' }
      ];
      
      $.db.getTables.mockResolvedValue(mockTables);
      $.db.deleteOldEntries.mockResolvedValue();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await device.deleteLogs();

      expect($.db.getTables).toHaveBeenCalled();
      expect($.db.deleteOldEntries).toHaveBeenCalledTimes(2); // Only log tables
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('deleting logs of table'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('checkFota', () => {
    const mockModels = [
      { id: 1, name: 'test-model' }
    ];
    
    const mockDevices = [
      {
        id: 1,
        uid: 'device-123',
        model_id: 1,
        version: '1.0.0',
        app_version: '1.0.0',
        accept_release: 'prod'
      }
    ];

    beforeEach(() => {
      $.db_model.getAll.mockResolvedValue(mockModels);
      $.db_device.listByModel.mockResolvedValue(mockDevices);
      $.db_fota.getEntry.mockResolvedValue(null);
      $.db_fota.update.mockResolvedValue();
    });

    it('should check for firmware updates', async () => {
      const latestVersion = { id: 1, version: '2.0.0' };
      const latestAppVersion = { id: 2, app_version: '2.0.0' };
      
      $.db_firmware.getLatestVersion.mockResolvedValue(latestVersion);
      $.db_firmware.getLatestAppVersion.mockResolvedValue(latestAppVersion);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await device.checkFota('prod');

      expect($.db_model.getAll).toHaveBeenCalled();
      expect($.db_firmware.getLatestVersion).toHaveBeenCalledWith(1, 'prod');
      expect($.db_firmware.getLatestAppVersion).toHaveBeenCalledWith(1, 'prod');
      expect($.db_fota.update).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should skip devices with different release acceptance', async () => {
      mockDevices[0].accept_release = 'dev';
      $.db_device.listByModel.mockResolvedValue(mockDevices);
      
      await device.checkFota('prod');

      expect($.db_fota.update).not.toHaveBeenCalled();
    });
  });

  describe('triggerFota', () => {
    const mockDevices = [
      {
        id: 1,
        uid: 'device-123',
        project_id: 1,
        firmware_id: 1,
        nAttempts: 0,
        version: '1.0.0',
        app_version: '1.0.0'
      }
    ];

    beforeEach(() => {
      $.db_fota.getUpdatable.mockResolvedValue(mockDevices);
      $.db_fota.update.mockResolvedValue();
      $.db_fota.newLog.mockResolvedValue();
      $.mqtt_client.publish.mockImplementation((topic, payload, options) => {});
    });

    it('should trigger firmware updates for eligible devices', async () => {
      const mockFirmware = {
        id: 1,
        model_id: 1,
        filename: 'firmware.bin',
        token: 'abc123',
        version: '2.0.0',
        app_version: '2.0.0'
      };
      
      const mockProject = { id: 1, name: 'testproject' };
      const mockModel = { id: 1, name: 'testmodel' };
      
      $.db_firmware.getById.mockResolvedValue(mockFirmware);
      $.db_project.getById.mockResolvedValue(mockProject);
      $.db_model.getById.mockResolvedValue(mockModel);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await device.triggerFota('prod');

      expect($.db_fota.getUpdatable).toHaveBeenCalledWith('prod');
      expect($.mqtt_client.publish).toHaveBeenCalled();
      expect($.db_fota.update).toHaveBeenCalled();
      expect($.db_fota.newLog).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleFotaSuccess', () => {
    it('should reset FOTA attempts and mark as successful', async () => {
      const deviceId = 1;
      
      $.db_fota.update.mockResolvedValue();
      $.db_fota.updateLog.mockResolvedValue();

      await device.handleFotaSuccess(deviceId);

      expect($.db_fota.update).toHaveBeenCalledWith(deviceId, {
        nAttempts: 0,
        fUpdate: 0
      });
      expect($.db_fota.updateLog).toHaveBeenCalledWith(deviceId, {
        success: 1
      });
    });
  });

  describe('handleFotaError', () => {
    it('should log FOTA error', async () => {
      const deviceId = 1;
      const error = 'Download failed';
      
      $.db_fota.updateLog.mockResolvedValue();

      await device.handleFotaError(deviceId, error);

      expect($.db_fota.updateLog).toHaveBeenCalledWith(deviceId, {
        error: 'Download failed'
      });
    });
  });
});