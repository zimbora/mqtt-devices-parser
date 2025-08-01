# Changelog

## 1.0.12
	Adds module fota
	adds 2 new tables to db:
	Adds 5 new columns to devices
	Registers device logs, records device settings..
	fixes: ws affected by a DoS when handling a request with many HTTP headers !breaking change
	Updates npm
	
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
