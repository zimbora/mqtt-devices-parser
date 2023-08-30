
# mqtt-devices-parser

MQTT parser
Parses topics received from devices and updates data on dB

## Setup

### Command
  >> node deploy

  1. build/sync all tables inside models folder
  2. registers users and clients if not registered already

  3. build/sync all tables inside projects folder
  4. registers projects and models/apps if not registered already

## Working mode

### Command
  >> node index

  1. Checks all projects inside src/projects folder and enable it if is activated in config/index.js

  2. Connects to defined MQTT broker

  3. Parse MQTT messages starting with :project/MACRO_UID_PREFIX+uid/

    3.1 register device if not exists
    3.2 Associate to a project if project is registered
    3.3 Associate to a model/app if model is registered

  4. Call project parseMessage function

## Instructions

  Projects folders must be kept

  The following functions must exist inside a file with the same name of the project

  ```
  module.exports = {
    sync_db : async()=>{
    },
    init : async ()=>{
    },
    parseMessage : async (client, project, device, topic, payload, retain, cb)=>{
    },
  }
  ```

  Ex: If project name is freeRTOS2, so must exist a file in projects/freeRTOS2/freeRTOS2.js.

  Calling the following methods will write data in a ${table} with the name of the project, and also
  in other table called "logs_"+${table}. Data will be written if there is a field in the respective table
  with the same name as the name in topic.

  ```
  $.db_data.update(project,device?.id,topic,payload);
  $.db_data.addLog("logs_"+project,device.id,topic,payload);
  ```

## UnitTest


## Dependencies

- mysql8.0
- MQTT

## Front end
- Node service running the following [project](https://github.com/zimbora/mgmt-iot-web)

## Configuration

The default configuration uses ./config/index.js file\
To use another configuration define the respective variables before call the program

Use a docker-compose file to do that:
```
version: '3.3'
services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_DATABASE: 'mqtt-aedes'
      # So you don't have to use root, but you can if you like
      MYSQL_USER: 'user'
      # You can use whatever password you like
      MYSQL_PASSWORD: 'user_pwd'
      # Password for root access
      MYSQL_ROOT_PASSWORD: 'root_pwd'
    ports:
      # <Port exposed> : < MySQL Port running inside container>
      - '3306:3306'
    expose:
      # Opens port 3306 on the container
      - '3306'
      # Where our data will be persisted
    volumes:
      - my-db:/var/lib/mysql
  mqtt-devices-parser:
    #build: ./mqtt-devices-parser
    image: mqtt:1.0.1
    restart: unless-stopped
    command: sh -c "node deploy && node index.js"
    environment:
      # web
      HTTP_PROTOCOL: 'http://'
      DOMAIN: '192.168.1.108'
      # MQTT
      MQTT_PROTOCOL: 'MQTT'
      MQTT_HOST: 'localhost'
      MQTT_PORT: '1883'
      #MQTTS_PORT
      MQTT_USER: 'admin'
      MQTT_PWD: 'admin'
      MQTT_CLIENT: 'mqtt-devices-parser'
      # DataBase
      DB_HOST: 'db'
      DB_PORT: '3306'
      DB_USER: 'user'
      DB_PWD: 'user_pwd'
      DB_NAME: 'mqtt-aedes'
      # sync_db
      sync_main_tables: 'true'
      #projects
      freeRTOS: 'true'
      rtls_linux: 'false'
    volumes:
      - .:/usr/app/mqtt_devices_parser/
      - /usr/app/mqtt_devices_parser/node_modules
    depends_on:
      - db
# Names our volume
volumes:
  my-db:

```
