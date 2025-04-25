# Changelog

## 1.0.8
	- removes port from link to update fw devices

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
