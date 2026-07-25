const parser = require('../aux/parser');

// Mock global dependencies
global.$ = {
  db: {
    connect: jest.fn(),
    getTables: jest.fn(),
    deleteOldEntries: jest.fn()
  },
  parser: parser,
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
    getById: jest.fn(),
    getMqttTopic: jest.fn(),
    getSensorsByRef: jest.fn(),
    updateLocalTopic: jest.fn(),
    setSynchedTopic: jest.fn(),
    updateRemoteTopic: jest.fn(),
    getAssociatedDevice: jest.fn()
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
    $.db_device.getMqttTopic.mockResolvedValue(null);
    $.db_device.getSensorsByRef.mockResolvedValue([]);
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

      await device.init(mockConfig, mockProjects);

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
        app_version: '1.0.0',
        protocol: 'mqtt'
      };

      $.db_project.getByName.mockResolvedValue({
        id: 1,
        name: 'testproject',
        uidPrefix: 'test-device-',
        uidLength: 15
      });

      $.db_device.get.mockResolvedValue(mockDevice);
      $.db_fota.update.mockResolvedValue();
      $.db_fota.updateLog.mockResolvedValue();
    });

    it('should parse status message correctly', async () => {
      const topic = 'testproject/test-device-123/status';
      const payload = 'online';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.update).toHaveBeenCalledWith(1, 'status', 'online');
      expect($.db_device.addLog).toHaveBeenCalledWith(1, 'status', 'online');
    });

    it('should publish get topics when device comes online', async () => {
      const topic = 'testproject/test-device-123/status';
      const payload = 'online';
      mockDevice.remote_settings = {};

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.mqtt_client.publish).toHaveBeenCalled();
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

    it('should return early for unknown project', async () => {
      const topic = 'unknownproject/test-device-123/status';
      const payload = 'online';

      $.db_project.getByName.mockResolvedValue(null);

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.get).not.toHaveBeenCalled();
    });

    it('should return early when uid does not match project prefix', async () => {
      const topic = 'testproject/other-device-999/status';
      const payload = 'online';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.get).not.toHaveBeenCalled();
    });

    it('should return early when device is not found', async () => {
      const topic = 'testproject/test-device-123/status';
      const payload = 'online';

      $.db_device.get.mockResolvedValue(null);

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.update).not.toHaveBeenCalled();
    });

    it('should handle settings/set messages (local settings)', async () => {
      const settingsPayload = { ssid: 'test-network' };
      const topic = 'testproject/test-device-123/settings/wifi/ssid/set';
      const payload = JSON.stringify(settingsPayload);

      $.db_device.getLocalSettings.mockResolvedValue({});
      $.db_device.updateLocalSettings.mockResolvedValue();

      await device.parseMessage(mockClient, topic, payload, false);

      // updateLocalSettings calls addLog with the JSON-parsed (object) payload
      expect($.db_device.addLog).toHaveBeenCalledWith(
        1,
        'local_settings',
        JSON.stringify(settingsPayload)
      );
      expect($.db_device.updateLocalSettings).toHaveBeenCalled();
    });

    it('should handle settings messages without /set (remote settings)', async () => {
      const settingsPayload = { threshold: 25 };
      const topic = 'testproject/test-device-123/settings/sensor/temperature';
      const payload = JSON.stringify(settingsPayload);

      $.db_device.getRemoteSettings.mockResolvedValue({});
      $.db_device.updateRemoteSettings.mockResolvedValue();

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.addLog).toHaveBeenCalledWith(
        1,
        'remote_settings',
        JSON.stringify(settingsPayload)
      );
      expect($.db_device.updateRemoteSettings).toHaveBeenCalled();
    });

    it('should handle fw messages with JSON payload', async () => {
      const fwPayload = { version: '1.0.0', build: '123' };
      const topic = 'testproject/test-device-123/fw';
      const payload = JSON.stringify(fwPayload);

      $.db_data.updateJson.mockResolvedValue();
      $.db_data.addJsonLog.mockResolvedValue();

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_data.updateJson).toHaveBeenCalledWith('fw', 1, fwPayload);
      expect($.db_data.addJsonLog).toHaveBeenCalledWith('logs_fw', 1, fwPayload, '');
    });

    it('should handle fw/fota/update/status (FOTA error) message', async () => {
      const topic = 'testproject/test-device-123/fw/fota/update/status';
      const payload = 'Download failed';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_fota.updateLog).toHaveBeenCalledWith(1, { error: 'Download failed' });
    });

    it('should skip topics ending with /get', async () => {
      const topic = 'testproject/test-device-123/settings/wifi/get';
      const payload = '';

      await device.parseMessage(mockClient, topic, payload, false);

      expect($.db_device.update).not.toHaveBeenCalled();
      expect($.db_device.addLog).not.toHaveBeenCalled();
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
        variant_id: 2,
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
      expect($.db_firmware.getLatestVersion).toHaveBeenCalledWith(1, 'prod', 2);
      expect($.db_firmware.getLatestAppVersion).toHaveBeenCalledWith(1, 'prod', 2);
      expect($.db_fota.update).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should skip devices with different release acceptance', async () => {
      const devDevices = [{ ...mockDevices[0], accept_release: 'dev' }];
      $.db_device.listByModel.mockResolvedValue(devDevices);

      $.db_firmware.getLatestVersion.mockResolvedValue({ id: 1, version: '2.0.0' });
      $.db_firmware.getLatestAppVersion.mockResolvedValue({ id: 2, app_version: '2.0.0' });

      await device.checkFota('prod');

      expect($.db_fota.update).not.toHaveBeenCalled();
    });

    it('should skip devices without variant_id', async () => {
      const devicesWithoutVariant = [{ ...mockDevices[0], variant_id: null }];
      $.db_device.listByModel.mockResolvedValue(devicesWithoutVariant);

      $.db_firmware.getLatestVersion.mockResolvedValue({ id: 1, version: '2.0.0' });
      $.db_firmware.getLatestAppVersion.mockResolvedValue({ id: 2, app_version: '2.0.0' });

      await device.checkFota('prod');

      expect($.db_firmware.getLatestVersion).not.toHaveBeenCalled();
      expect($.db_fota.update).not.toHaveBeenCalled();
    });

    it('should skip devices with undefined variant_id', async () => {
      const devicesWithoutVariant = [{ ...mockDevices[0], variant_id: undefined }];
      $.db_device.listByModel.mockResolvedValue(devicesWithoutVariant);

      $.db_firmware.getLatestVersion.mockResolvedValue({ id: 1, version: '2.0.0' });
      $.db_firmware.getLatestAppVersion.mockResolvedValue({ id: 2, app_version: '2.0.0' });

      await device.checkFota('prod');

      expect($.db_firmware.getLatestVersion).not.toHaveBeenCalled();
      expect($.db_fota.update).not.toHaveBeenCalled();
    });

    it('should return early when no models are found', async () => {
      $.db_model.getAll.mockResolvedValue([]);

      await device.checkFota('prod');

      expect($.db_firmware.getLatestVersion).not.toHaveBeenCalled();
    });

    it('should not create FOTA entry when versions already match', async () => {
      $.db_firmware.getLatestVersion.mockResolvedValue({ id: 1, version: '1.0.0' });
      $.db_firmware.getLatestAppVersion.mockResolvedValue({ id: 2, app_version: '1.0.0' });

      await device.checkFota('prod');

      expect($.db_fota.update).not.toHaveBeenCalled();
    });

    it('should only compare firmware with the same variant_id as the device', async () => {
      const latestVersion = { id: 1, version: '2.0.0' };
      const latestAppVersion = { id: 2, app_version: '2.0.0' };

      $.db_firmware.getLatestVersion.mockResolvedValue(latestVersion);
      $.db_firmware.getLatestAppVersion.mockResolvedValue(latestAppVersion);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await device.checkFota('prod');

      expect($.db_firmware.getLatestVersion).toHaveBeenCalledWith(1, 'prod', mockDevices[0].variant_id);
      expect($.db_firmware.getLatestAppVersion).toHaveBeenCalledWith(1, 'prod', mockDevices[0].variant_id);

      consoleSpy.mockRestore();
    });
  });

  describe('triggerFota', () => {
    beforeEach(() => {
      $.db_fota.getUpdatable.mockResolvedValue([]);
      $.db_fota.update.mockResolvedValue();
      $.db_fota.newLog.mockResolvedValue();
      $.mqtt_client.publish.mockImplementation(() => {});
    });

    it('should call getUpdatable with provided release', async () => {
      await device.triggerFota('prod');

      expect($.db_fota.getUpdatable).toHaveBeenCalledWith('prod');
    });

    it('should use dev release by default', async () => {
      await device.triggerFota();

      expect($.db_fota.getUpdatable).toHaveBeenCalledWith('dev');
    });
  });
});