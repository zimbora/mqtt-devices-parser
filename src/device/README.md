# Device Module Jest Test Plan

This test suite provides comprehensive coverage for the `src/device/device.js` module using Jest.

## Test Coverage

The test suite covers all major functions in the device module:

### 1. `init()` Function
- ✅ Database connection and project initialization
- ✅ Project module loading and initialization
- ✅ Database project insertion for new projects

### 2. `parseMessage()` Function  
- ✅ Status message parsing (online/offline)
- ✅ Model message parsing with validation
- ✅ Version message parsing (when device has existing version)
- ✅ App version message parsing (when device has existing app version)
- ✅ Invalid topic format handling
- ✅ Unknown project handling  
- ✅ Settings/set message handling (local settings updates)
- ✅ Firmware (fw) message handling with JSON payload

### 3. Settings Management Functions
- ✅ `updateLocalSettings()` - nested settings updates
- ✅ `updateLocalSettings()` - invalid JSON payload handling
- ✅ `updateLocalSettings()` - empty topic handling
- ✅ `updateRemoteSettings()` - remote settings updates
- ✅ `updateRemoteSettings()` - non-JSON payload handling

### 4. Log Management Functions
- ✅ `deleteLogs()` - old log entries cleanup from log tables

### 5. FOTA (Firmware Over The Air) Functions
- ✅ `checkFota()` - firmware update checking
- ✅ `checkFota()` - device release acceptance filtering
- ✅ `triggerFota()` - firmware update triggering for eligible devices
- ✅ `handleFotaSuccess()` - successful FOTA completion handling
- ✅ `handleFotaError()` - FOTA error handling

## Test Features

### Mocking Strategy
The test suite extensively mocks all database dependencies:
- `$.db` - Database connection and table operations
- `$.db_device` - Device database operations
- `$.db_project` - Project database operations  
- `$.db_model` - Model database operations
- `$.db_sensor` - Sensor database operations
- `$.db_data` - Data storage operations
- `$.db_firmware` - Firmware database operations
- `$.db_fota` - FOTA database operations

### Coverage Statistics
- **Statements**: 73.3%
- **Branches**: 55.24% 
- **Functions**: 78.94%
- **Lines**: 74.13%

### Test Configuration
- Uses Jest test framework
- Node.js test environment
- Coverage reports in text, lcov, and HTML formats
- Excludes existing integration tests in `src/unitTest/`

## Running Tests

```bash
# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Architecture Notes

The tests follow Jest best practices:
- Comprehensive mocking of external dependencies
- Clear test descriptions and organization
- Edge case coverage
- Error handling validation
- Async/await pattern usage

## Known Limitations

Some complex scenarios are not tested due to the existing code architecture:
- Database connection failure handling (complex Promise wrapping)
- Device creation race conditions (async .then() chains)
- Project module require() failures (virtual module mocking limitations)

These limitations represent opportunities for code improvement in the actual device.js module.