const mqtt = require("mqtt");
const fs = require('fs').promises;

$ = {};
$.md5 = require('md5');

$.config = require('./config');
$.models = require('./models/models.js');
$.device = require('./src/device/device.js');
$.kafka_consumer = require('./src/kafka/consumer.js');
$.db = require('./src/db/db');
$.db_data = require('./src/db/data');
$.db_project = require('./src/db/project');
$.db_device = require('./src/db/device');
$.db_model = require('./src/db/model');
$.db_firmware = require('./src/db/firmware');
$.db_sensor = require('./src/db/sensor');
$.db_fota = require('./src/db/fota');
$.mqtt_client = null;

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

      await $.models.init($.config);
      await $.models.connect();

      //auth.init();
      await $.device.init($.config,projects);

      // Initialize Kafka consumer if enabled
      if ($.config.kafka.enabled) {
        await $.kafka_consumer.init($.config, projects);
        await $.kafka_consumer.start();
      }

      mqtt_connect();

      setInterval(async ()=>{
        await $.device.deleteLogs();
      },60*60*1000);

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
      let project = {}
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

  deploy: async(_config,projectsPath, projects)=>{

    if(_config != null)
        $.config = _config;

    await $.models.init($.config);
    await $.models.connect();

    //main tables
    if($.config.sync_main_tables){
      
      await $.models.load(__dirname+"/models");
      await $.models.dropTableIndexes();
      await $.models.sync();

      // adds user for mqtt with admin credentials
      let user = await $.models.insertUser($.config.mqtt.user,$.config.mqtt.pwd,5);
      let user_id = user.dataValues.id;
      await $.models.insertUser("device","device",3);
      await $.models.insertUser("client","client_pwd",3);
      // adds client with credentials admin@admin
      await $.models.insertClient("admin","admin",user_id); // dashboard login
      
      /* Add projects using dashboard !!
      for(name of projects){
        project = $.config[name];
        if (project) {
          // Make a copy if you don't want to modify the original config object
          const projectData = { ...project, name: name };
          await $.models.insertProject(projectData);
        }
      }
      */
    }

    // project tables
    await self.readModelsInsideProjects(projectsPath);
  }
}

function mqtt_connect(){

  console.log(`[MQTT] connecting to ${$.config.mqtt.host}:${$.config.mqtt.port}..`)

  const mqtt_prefix = $.config.mqtt.logs_path+"/"+$.config.mqtt.client;
  let checkFota = null;
  $.mqtt_client = mqtt.connect({
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

  $.mqtt_client.on("connect", () => {

    $.mqtt_client.publish(mqtt_prefix+"/status","online",{qos:2,retain:true});
    $.mqtt_client.publish(mqtt_prefix+"/version",packageVersion,{qos:2,retain:true});

    projects.map( (project)=>{
      $.mqtt_client.subscribe(project+"/#", (err) => {});

      for(let project in $.config.projects){
        if($.config.projects[project])
          $.mqtt_client.publish(mqtt_prefix+"/"+project,"active",{qos:2,retain:true});
        else
          $.mqtt_client.publish(mqtt_prefix+"/"+project,"deactive",{qos:2,retain:true});
      };
    })
    console.log(`[MQTT] connected`);

    if (!$.config.kafka.enabled) {
      projects.map( project=>{
        console.log("[MQTT] subscribing project:",project);
        $.mqtt_client.subscribe(project+"/#", (err) => {
          if(err){
            console.log("[MQTT] error");
            console.err(err);
          }
          else
            console.log("[MQTT] subscribed to project:",project);
        })
      })
    }

    // Update 'dev' devices at each 5 min 
    checkFota = setInterval(async ()=>{
      await $.device.checkFota("dev");
      await $.device.triggerFota("dev");
    },5*60*1000);

    // Update 'prod' devices at each hour
    checkFota = setInterval(async ()=>{
      await $.device.checkFota("prod");
      await $.device.triggerFota("prod");
    },60*60*1000);

    // Devices not set as dev or prod must be triggered manually

  });

  $.mqtt_client.on("message", (topic, payload, packet) => {
    // Only parse MQTT messages if enabled in configuration
    if (!$.config.kafka.enabled) {

      console.log(`[MQTT] rx: ${topic.toString()}`);
      // payload is Buffer
      $.device.parseMessage($.mqtt_client,topic.toString(),payload.toString(),packet.retain);
    }
  });

  $.mqtt_client.on("reconnect",()=>{
    console.log("[MQTT] reconnected")
  });

  $.mqtt_client.on("close",()=>{
    console.log("[MQTT] closed")
    checkFota = null;
  });

  $.mqtt_client.on("offline",()=>{
    console.log("[MQTT] offline")
    checkFota = null;
  });

  $.mqtt_client.on("disconnect",(packet)=>{
    console.log(`[MQTT] disconnected`);
    console.log(packet);
    checkFota = null;
  })

  $.mqtt_client.on("error",(error)=>{
    console.log("[MQTT] error");
    console.err(error)
  })
}
