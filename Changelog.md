# Changelog

## 1.0.25

	Sensors template (#9)

		* new table sensorsTemplate

		* store topics which match a sensor
		for each mqtt msg received, check if there is a sensor associated to that topic.
		If there is, update current value and insert new log

		* db: models/sensors
		changes localUnixTs field to remoteUnixTs
		adds value, error
		changes property: allow null
		adds foreign keys to model_id and device_id

		* handle change db column localUnixTs to remoteUnixTs

		* fix getSensorsByRef
		ref is not unique so it can have more than 1 row

		* src/db/data: Implements missing function pathIntoObject

		* src/aux/parser: adds functions to handle mqtt topics parsing
		index: uses global $.parser as a pointer to class src/aux/parser
		src/device/device: fixes null iterations, sets updateSensor and handleMqttTopic as public functions. Removes local mqtt parser functions. Adapts calls to those functions

	mqtt: always check if topic is registered
		store values in db
		
## 1.0.24
	src/device/device: fix log
	src/kafka/consumer: increase initialRetryTime from 100 to 300ms
	src/device/device: parseMqttMessage: get remote configs if not known
	synch configs if they mismatch
	models/devices.models: new column synch
	synchs mqtt topics
		Explanation
		**
		When a message is received, it checks if mqtt topic is associated to the device without "set" if present.
		If topic exists and ends with set, updates localData column. If topic exists and doesn't end with set, updates remoteData column.
		If localData was updated sets topic as unsynched
		If remoteData was received and differs from localData and synch is enabled, tries to synch topic
		**
		adds synch and synched columns to mqtt table
		Adds methods getMqttTopic, updateRemoteTopic, setSynchedTopic
	kafka: adds random number to kafka when program is in dev mode.
		Avoids to read all queue messages since last session
	mqtt templates: preparing mqtt topics synch
		new column synch and localData for mqttTemplates table
		new column mqttTemplate_id for mqtt table
	add property "property" to table sensors
	src/device/device: decode json payload and get property associated
	models/devices: add synched column (for future implementations)

## 1.0.23
	src/device/device: fix tech, version and app_version db update
	npm warn audit Updating websocket-stream to 5.3.0, which is a SemVer major change.

## 1.0.22
	Adds SSL and SASL support for kafka
		mqtt.parseMessages removed
	src/kafka/consumer: adds random number to kafka client Id
	Parse mqtt lwm2m (#6)
		* in progress: splits parsing messages base on protocol
		* supports local unix timestamp, fix sensor data parse
		models/logs_sensor.models: add localUnixTs
		src/devices/device: fix object parse
		* fix: mqtt parser
		Re-structs parser

## 1.0.21
	src/kafka/consumer: fixes parseMessage call
	improves: logs
	
## 1.0.20
	Adds Kafka consumer support with optional MQTT message parsing (#5)
	supports tables for mqtt templates

## 1.0.19
	Removes adding project on launching process
	models/models:
	 - seedCommonLwM2MObjects: avoids error on description property not defined on object
	 - changes lwm2m seed functions name
	 
## 1.0.18
	Fix and improve Sensors, checks uid length
	Adds seedCommonLwM2MObjects and seedCommonLwM2MResources functions
	fixes sync project tables. Makes load .models more robust
	Adds templates table
	add template_id to devices table

## 1.0.17
	Fix and improve Sensors, checks uid length
	config/index: When defining a project from here uidPrefix and uidLength must be defined
	models/logs_sensor.models: removes client_id association
	models/sensors.models: removes unique and references properties from model_id, adds device_id
	src/db/db: adds method updateOrInsert
	src/db/device: adds method getSensorByRef
	src/db/model: adds method getSensorByRef
	src/db/project: adds uidPrefix and uidLength properties
	src/db/sensor: insert: adds fields error and obj
	src/device/device:
	 - fixes logs_table
	 - adds projectOptions
	 - checks if device.uidLength <= project.uidLength
	 - looks for sensor ref by device_id first and then by model_id if not found. Insert object, value and error fields
	 - removes some fota logs

## 1.0.16
	changes db tables:
	 - models/devices.models: removes endpoint, adds protocol and psk.
	 - adds mqtt_password

## 1.0.15
	src/device/device: fixes fota for sniffer model
	changes DB tables:
	 - adds level to modelPermissions
	 - adds project_id to model
	 - adds projectPermissions table
	 - deletes file modelPermissions.js

## 1.0.14
	Fixes check FOTA mechanism and response
	
## 1.0.13
	adds 2 new tables to db:
	Adds 5 new columns to devices
	Registers device logs, records device settings..
	fixes: ws affected by a DoS when handling a request with many HTTP headers !breaking change
	Updates npm

## 1.0.12
	Adds module fota

## 1.0.11
	index: MQTT
		- makes mqtt client global,
		- adds periodically call for FOTA update
	models/devices.models: adds version fields to devices table
	models/firmwares.models: adds new fields for firmware management
	src/db/device: optimizes calls to manage devices table
	src/device/device: Fota changes, db calls updated to match previous changes
	Adds method to check FOTA updates. Doing 10 at time at each minute for now. Non configurable

## 1.0.10
	src/db/data: handles json data
	- Adds updateJson call
	- Adds addJsonLog
	src/db/project: deals with settings
	src/device/device: fixes fota fw link, stores settings on project table (twin model)
	
## 1.0.9
	- Adds method to delete logs older than 1 week

## 1.0.8
	- removes port from link to update fw devices
	- fixes fw_version comparison

## 1.0.7
	- config/index: changes local IP
	- src/db/firmware: changes query to get latest fw release
	- src/device/device: adds semver. Checks fw version on "uptime" topic sent. Updates fota_tries field on db

## 1.0.6
	- device: updates project if mismatch
	
## 1.0.5
	- db: adds mqtt user passed on mqtt struct and grants admin privileges

## 1.0.4
	- mqtt: adds retain to project state

## 1.0.3
	-	fixes config arg

## 1.0.2
	-	passes config struct por methods

## 1.0.1
	- adds deploy method

## 1.0.0
	- Module to parse mqtt messages from devices
