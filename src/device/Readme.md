
# Devices

## State Machine
This modules parses mqtt messages with the following format

:project/:device/

Only messages with MACRO_UID_PREFIX in topic will be parsed.
MACRO_UID_PREFIX allows the module to discover the device uid.
If uid doesn't exist in db it will add it.
After that, it will associate the project if the project exists in db.
If the device already exists it will verify the project and update it in case of needed

## Fota
Add a new firmware to model

Every 5min for release = "dev" and every hour for release = "prod"
devices will be updated if needed

### Available topics

:project/:device/status - send it on boot with retain
Updates the device status (online/offline)

:project/:device/model - send it on boot with retain
Updates the model if the model already exists in db

:project/:device/version - send it on boot with retain
// If version mismatch, updates fota table with success

:project/:device/app_version - send it on boot with retain
// If version mismatch, updates fota table with success

:project/:device/tech - send it on boot with retain
// Radio technology

:project/:device/fw/fota/update/status - send if fota fails
// Receives fota error and updates fota table

// can be changed - Likely will be deprecated
:project/:device/fw - send it periodically
// JSON struct, stores value of keys:
	- heapFree
	- uptime
	- rssi

// Under development
// If sensor is created stores info
:project/:device/sensor/:sensor 
// JSON struct, stores value of keys:
	- value

### Set instruction
Any instruction ended with /set will be added to a json file on settings table

## New Project

In order to support a new type of device, you need to create a js file with the same name of topic before MACRO_UID_PREFIX

Example:

topic: demo/uid:001122aabbcc
MACRO_UID_PREFIX = "uid:"

demo is the project
uid:001122aabbcc is the UID

Then, inside projects folder, you can create a demo folder with apps and models as subfolders
Ex:

../projects/demo/demo.js
../projects/demo/apps/myapp/myapp.js
../projects/demo/models/myapp.models.js

All messages published on the topic demo will be processed by demo.js file
You can also create models inside models folder and use it to store data

Furthermore, all published topics started with:
:project/:uid/app/:app
will call the respective modules inside apps folder.

Ex:
demo/uid:001122aabbcc/app/myapp/hello
will result in a call to myapp.parseMessage

To activate the project you just need to add the project in config/index.js file and set to true
projects: {
	demo : process.env.demo || true
}




