const mqtt = require("mqtt");
const fs = require('fs').promises;

$ = {};
$.md5 = require('md5');

$.config = require('./config');
$.models = require('./models/models.js');
$.device = require('./src/device/device.js');
$.db = require('./src/db/db');
$.db_data = require('./src/db/data');
$.db_project = require('./src/db/project');
$.db_device = require('./src/db/device');
$.db_model = require('./src/db/model');
$.db_firmware = require('./src/db/firmware');
$.db_sensor = require('./src/db/sensor');

const packageJson = require(__dirname+'/package.json');
const packageVersion = packageJson.version;

var projects = [];
var project = {};

var self = module.exports = {

  init : async(_config, _projects)=>{

    return new Promise(async (resolve,reject) => {

      if(_config != null)
        $.config = _config;
      if(_projects != null)
        projects = _projects;

      await $.models.init();
      await $.models.connect();

      //auth.init();
      await $.device.init(projects);

      console.log("mqtt connecting..")
      mqtt_connect();

      return resolve();
    })
  },

  readModelsInsideProjects: async(projectsPath)=>{

    return new Promise( async (resolve,reject) => {

      // load projects dbs
      var files = await fs.readdir(projectsPath)

      files = files.filter((file) => {
        // Exclude any extension file
        return (file.indexOf('.') == -1);
      })

      let counter_help = 0;
      files.forEach( async(name,counter) => {
        if($.config.projects[name]){
          project[name] = {};
          project[name]['module'] = null;
          project[name].module = require(`${projectsPath}${name}/${name}.js`)
          await project[name].module.sync_db();
          counter_help++;
          if(files.length == counter_help) return resolve();
        }else{
          counter_help++;
          if(files.length == counter_help) return resolve();
        }

      });

    });

  },

  deploy: async(_config,projectsPath)=>{

    if(_config != null)
        $.config = _config;

    await $.models.init();
    await $.models.connect();

    //main tables
    if($.config.sync_main_tables){

      await $.models.load(__dirname+"/models");
      await $.models.dropTableIndexes();
      await $.models.sync();

      let user = await $.models.insertUser("admin","admin",5); // ads user
      //console.log(user);
      let user_id = user.dataValues.id;
      await $.models.insertUser("device","device",3);
      await $.models.insertUser("client","client_pwd",3);
      await $.models.insertClient("admin","admin",user_id); // ads client with credentials admin@admin
    }

    // project tables
    await self.readModelsInsideProjects(projectsPath);
    await $.models.dropTableIndexes();
    await $.models.sync();

  }
}

function mqtt_connect(){

  const mqtt_prefix = $.config.mqtt.logs_path+"/"+$.config.mqtt.client;
  const client = mqtt.connect({
    host : $.config.mqtt.host,
    port : $.config.mqtt.port,
    username : $.config.mqtt.user,
    password : $.config.mqtt.pwd,
    clientId : $.config.mqtt.client,
    protocolId : $.config.mqtt.protocol,
    will : {
      topic: mqtt_prefix+"/status",
      payload: "offline",
      qos: 2,
      retain: true
    }
  });

  client.on("connect", () => {

    client.publish(mqtt_prefix+"/status","online",{qos:2,retain:true});
    client.publish(mqtt_prefix+"/version",packageVersion,{qos:2,retain:true});

    projects.map( (project)=>{
      client.subscribe(project+"/#", (err) => {});

      for(let project in $.config.projects){
        if($.config.projects[project])
          client.publish(mqtt_prefix+"/"+project,"active");
        else
          client.publish(mqtt_prefix+"/"+project,"deactive");
      };
    })
    console.log(`MQTT connected to: ${$.config.mqtt.host}:${$.config.mqtt.port}`);
    projects.map( project=>{
      console.log("subscribing project:",project);
      client.subscribe(project+"/#")
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


