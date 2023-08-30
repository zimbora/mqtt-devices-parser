const fs = require('fs');

$ = {}
var path = "/../.."
$.config = require(__dirname+ path+'/config');
$.models = require(__dirname+ path+'/models/models.js');
$.device = require(__dirname+ path+'/src/device/device.js');
$.db = require(__dirname+ path+'/src/db/db');
$.db_data = require(__dirname+ path+'/src/db/data');
$.db_project = require(__dirname+ path+'/src/db/project');
$.db_device = require(__dirname+ path+'/src/db/device');
$.db_model = require(__dirname+ path+'/src/db/model');
$.db_firmware = require(__dirname+ path+'/src/db/firmware');

var projectsPath = __dirname+'/../projects';
var projects = [];

let topics_rtls_linux = [
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/status",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/version",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/ssid",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/rssi",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/channel",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/uptime",
  "rtls-linux/uid:ea188c9c-d695-4644-b360-b59acc785076/ip",
]
let payloads_rtls_linux = [
  "online",
  "1.0.0",
  "fake_ssid",
  "-79",
  "4",
  "122",
  "0.0.0.0",
]

let topics_freeRTOS2 = [
  "freeRTOS2/uid:ac67b2403178/status",
  "freeRTOS2/uid:ac67b2403178/model",
  "freeRTOS2/uid:ac67b2403178/app/HH/temperature"
]
let payloads_freeRTOS2 = [
  "offline",
  "HH_GW_WIFI",
  "30"
];

let topics = topics_freeRTOS2;
let payloads = payloads_freeRTOS2

let client = {
  publish : (packet,cb)=>{
    return cb();
  }
};

async function setup(){
  await $.models.init();
  await $.models.connect();
}

async function test1(){

  console.log(__dirname)
  fs.readdirSync(projectsPath)
    .filter((file) => {
      return (file.indexOf('.') == -1);
    })
    .forEach((project) => {
      projects.push(project);
    });

  await $.device.init(projects);

  topics.forEach((topic,counter)=>{

    console.log("\ntest:",counter);

    let payload = payloads[counter];
    console.log("topic:",topic);
    console.log("payload:",payload);
    if(topic.includes("uid:")){
      $.device.parseMessage(client,topic,payload,false);
    }
  })
}

setup();
test1();

