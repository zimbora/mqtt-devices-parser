const mqtt = require("mqtt");
const fs = require('fs');

$ = {};

$.config = require('./config');
$.models = require('./models/models.js');
$.device = require('./src/device/device.js');
$.db = require('./src/db/db');
$.db_data = require('./src/db/data');
$.db_project = require('./src/db/project');
$.db_device = require('./src/db/device');
$.db_model = require('./src/db/model');
$.db_firmware = require('./src/db/firmware');

var projectsPath = './src/projects/';
var projects = [];

function mqtt_connect(){
  const client = mqtt.connect({
    host : $.config.mqtt.host,
    port : $.config.mqtt.port,
    username : $.config.mqtt.user,
    password : $.config.mqtt.pwd,
    clientId : $.config.mqtt.client,
    protocolId : $.config.mqtt.protocol
  });

  client.on("connect", () => {

    projects.map( (project)=>{
      client.subscribe(project+"/#", (err) => {});
    })

  });

  client.on("message", (topic, payload, packet) => {
    // payload is Buffer
    $.device.parseMessage(client,topic.toString(),payload.toString(),packet.retain);
  });

  client.on("reconnect",()=>{
    console.log("reconnect")
  });
  client.on("close",()=>{
    console.log("close")
  });
  client.on("offline",()=>{
    console.log("offline")
  });

  client.on("disconnect",(packet)=>{
    console.log(packet)
  })

  client.on("error",(error)=>{
    console.log(error)
  })
}


async function init(){

  return new Promise(async (resolve,reject) => {

    fs.readdirSync(projectsPath)
    .filter((file) => {
      return (file.indexOf('.') == -1);
    })
    .forEach((project) => {
      if($.config.projects[project])
        projects.push(project);
    });

    await $.models.init();
    await $.models.connect();

    //auth.init();
    await $.device.init(projects);

    console.log("mqtt connect")
    mqtt_connect();

    return resolve();
  })
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // exit with failure code
  if($.config.dev)
    process.exit(1);
});

init();

