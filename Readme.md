
# Aedes-MQTT-Broker

MQTT broker working in cluster mode. Number of workers can be set using WORKERS var env.

## TODO
- MQTTS

## Working mode

### Users
This program uses a mysql database to check users access and permissions

On table `users` are the authorized accounts to access MQTT broker.\
If an account is registered with level 4/5, that account has full access.\
Otherwise, the access must be checked through table `permissions`

### Devices and Clients
The registered `clientId` is used to check if a subscription or a publish are authorized for the respective topics.\
A `device` will only be allowed to publish on it's own topic and it must contains `uid:`.
This `uid:` identifies the device referred on the topic and is used to check if a
`clientId` has permission to write on the topic. Those privileges are defined in `permissions` table.\
If the `level` of `clientId` is >= 3 publish and subscribe on the respective topic are granted\
If the `level` of `clientId` is >= 1 and < 3 only subscribe on the respective topic is granted

### Devices configurations
If a client writes on topics :project/:uid/fw/settings or :project/:uid/app/settings that data will be store in database. If this written is made by a device, the data will be only stored if there's no data in db. In the other hand, if the there is data in db and that data is different from the one that device sent, this service will try to update the device, keeping it synced.\
The exception is for WIFI ssid and password, topic :project/:uid/fw/settings/wifi. The device has always control over this topic, yet it can accept changes when it is connected.

## Dependencies

- mysql8.0 running with the following [db](https://github.com/zimbora/mgmt-iot-web/blob/master/mysql/schema.mwb)
- Node service running the following [project](https://github.com/zimbora/mgmt-iot-web)

## Problems
!! messages with retain flag should be published with qos=2

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
