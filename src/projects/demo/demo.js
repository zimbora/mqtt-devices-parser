const moment = require('moment');
const fs = require('fs');
const path = require('path');

var app = [];

MACRO_UID_PREFIX          = "uid:"

module.exports = {

  sync_db : async()=>{

    return new Promise( async (resolve,reject) => {

      console.log("Sync dbs for rtls-linux module");
      await $.models.init();
      await $.models.connect();
      await $.models.load(__dirname+"/models");

      return resolve();
    });
  },

  init : async ()=>{

    console.log("Project rtls-linux started");
    await $.models.load(__dirname+"/models");

    // load apps
    if(fs.existsSync(__dirname+"/apps")){
      fs.readdirSync(__dirname+"/apps")
      .filter((file) => {
        // Exclude any extension file
        return (file.indexOf('.') == -1);
      })
      .forEach((name) => {
        app[name] = {
            module : null
        };

        app[name].module = require(__dirname + '/apps/'+name+'/'+name+".js")
        app[name].module.init();
      });
    }
  },

  parseMessage : async (client, project, device, topic, payload, retain, cb)=>{

    // The next two lines updates dB with received data
    $.db_data.update(project,device.id,topic,payload);
    $.db_data.addLog("logs_"+project,device.id,topic,payload);

    let index = topic.indexOf("/")
    if(index == -1)
      return cb();

    if(topic.substring(0,3) == "app") {
      topic = topic.substring(4);
      index = topic.indexOf("/")
      if(index == -1)
        return cb();

      let app_name = topic.substring(0,index);
      topic = topic.substring(index+1);
      if(app[app_name]){ // call app
        let res = await $.db_model.getByName(app_name);
        let model_id = res?.id;
        if(model_id != null && device.model_id != model_id) $.db_device.updateModel(device.uid,model_id);
        app[app_name].module.parseMessage(client,app_name,device,topic,payload,retain,()=>{})
      }

    }

  }


}
