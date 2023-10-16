
# mqtt-devices-parser

## NPM Module
  - MQTT parser
  - Parses topics coming from devices and updates data on dB

## Deploy
  ```
  parser.deploy(config,projectsPath);
  ```

## Run
  ```
  parser.init(config,projects);
  ```

## Examples
  check example path to see how to use this module

## UnitTest


## Dependencies

- mysql8.0
- MQTT

## Front end
- Node service running the following [project](https://github.com/zimbora/mgmt-iot-web)

## Configuration

The default configuration uses ./config/index.js file\
In your program set the same struct and pass it as argument on the module init call.
