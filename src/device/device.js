const moment = require('moment');

var project = [];
const logs_table = "sensor_logs";
const semver = require('semver');

var self = module.exports = {

  init : async (config,projects)=>{

    return new Promise(async (resolve,reject) => {
      $.db.connect(config,()=>{
        console.log("MYSQL is connected");

        projects.map( async (name,counter)=>{
          console.log("project:",name)
          project[name] = {
            module : null
          };
          project[name].module = require(`${BASE_DIR}/projects/${name}/${name}.js`)
          project[name].module?.init();
          let row = await $.db_project.getByName(name);
          if(row == null)
            $.db_project.insert(name,name,"logs_"+name);

          if(counter == projects.length-1)
            return resolve();
        })
      })
    });


  },

  deleteLogs : async()=>{

    let tables = await $.db.getTables();
    // Define one week in milliseconds
    // Loop through each table
    for (const tableObj of tables) {
      const tableName = tableObj['Tables_in_mqtt-aedes']
      const oneWeekAgo = moment().utc().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');
      if(tableName.startsWith("logs_")){
        const uptimeSeconds = Math.floor(process.uptime());
        console.log(`deleting logs of table ${tableName} older than ${oneWeekAgo}"`);
        await $.db.deleteOldEntries(tableName, { createdAt: oneWeekAgo });
        time = Math.floor(process.uptime()) - uptimeSeconds;
        console.log(`Logs of table ${tableName} deleted in ${time}s`);
      }
    }

  },

  parseMessage : async (client,topic,payload,retain)=>{

    let topic_bck = topic;

    //let index = topic.indexOf(MACRO_UID_PREFIX);
    // --- project ---
    let index = topic.indexOf("/");
    if(index == -1)
        return;
    let project_name = topic.substring(0,index);

    // --- uid ---
    topic = topic.substring(index+1);
    index = topic.indexOf("/");
    if(index == -1)
        return;
    let uid = topic.substring(0,index);

    topic = topic.substring(index+1);

    // check if topic corresponds to a device
    if(uid.startsWith(MACRO_UID_PREFIX)){
      let device = await $.db_device.get(uid);

      if(device == null){
        $.db_device.insert(uid)
        .then(async()=>{
          device = await $.db_device.get(uid);
        })
        .catch( (err) => {});
      }

      // update project id if needed
      let res = await $.db_project.getByName(project_name);
      let project_id = res?.id;
      if(project_id != null && project_id != device?.project_id) 
        $.db_device.updateProject(uid,project_id);

      if(topic.endsWith("status")){
        if(payload == "online" || payload == "offline")
          await $.db_device.updateStatus(uid,payload);
        console.log(project_name,uid,payload)
      }else if(topic.endsWith("model")){
        let res = await $.db_model.getByName(payload);
        let model_id = res?.id;

        if(model_id != null){
          let res = await $.db_device.updateModel(uid,model_id);
        } 
      }else if(topic.endsWith("tech")){
        await $.db_device.updateTech(uid,payload);
      }else if(topic.endsWith("fw_version")){
        let fw_version = await $.db.getFieldFromDeviceId(project_name,device.id,"fw_version");
        if(fw_version != payload)
          await $.db_data.update(project_name,device.id,"fota_tries",1); // ! 0 is not working..
      }else if(topic.endsWith("app_version")){
        let app_version = await $.db.getFieldFromDeviceId(project_name,device.id,"app_version");
        if(app_version != payload)
          await $.db_data.update(project_name,device.id,"fota_tries",1); // ! 0 is not working..
      }else if(topic.endsWith("uptime")){ // !! maybe this topic should be change for something ending in fota
        // check fw version
        // get current fw and app version
        let release = await $.db.getFieldFromDeviceId(project_name,device.id,"fw_release");
        if(release == null || release == "critical"){
          // don't update
          return;
        }
        let fota_tries = await $.db.getFieldFromDeviceId(project_name,device.id,"fota_tries");
        if(fota_tries > 3)
          return;

        let fw_version = await $.db.getFieldFromDeviceId(project_name,device.id,"fw_version");
        let app_version = await $.db.getFieldFromDeviceId(project_name,device.id,"app_version");
        let new_firmware = await $.db_firmware.getLatestFWVersion(device.model_id,release);
        let new_app = await $.db_firmware.getLatestAppVersion(device.model_id,release);
        if(new_firmware == null || new_app == null)
          return;

        let mqtt_prefix = `${project_name}/${uid}`;

        if(new_app != null && semver.lt(app_version, new_app.app_version)) {
          console.log(new_app)
          console.log(`updating firmware of ${uid} to minor version ${new_app.app_version}`);
          let link = `${$.config.web.protocol}${$.config.web.domain}${$.config.web.fw_path}${new_app.filename}/download?token=${new_app.token}`;
          client.publish(mqtt_prefix+"/fw/fota/update/set",`{"url":"${link}"}`,{qos:2,retain:false});
          await $.db_data.update(project_name,device.id,"fota_tries",++fota_tries);
        }else{
          if(new_firmware != null && semver.lt(fw_version, new_firmware.fw_version)) {
            console.log(`updating firmware of ${uid} to major version ${new_firmware.fw_version}`);
            let link = `${$.config.web.protocol}${$.config.web.domain}${$.config.web.fw_path}${new_firmware.filename}/download?token=${new_firmware.token}`;
            client.publish(mqtt_prefix+"/fw/fota/update/set",`{"url":"${link}"}`,{qos:2,retain:false});
            await $.db_data.update(project_name,device.id,"fota_tries",++fota_tries);
          }
        }
        
      }

      if(device.project_id != null && device.model_id != null){
        let res = await $.db_sensor.getByRef(topic)
        if(res != null){
          await $.db_sensor.insert(logs_table,device.id,res.id,payload);
        }
      }

      // store remote device settings on project table - twin model
      if(topic.endsWith("/set") && payload != "" ){

        let route = topic.split("/");

        if(route == null){
          console.log("topic invalid:",topic);
          return;
        }
        // get settings
        let settings = await $.db_project.getSettings(project_name,device.id);
        let obj = settings;

        if(obj == null){
          console.log("no settings available for deviceId:",device.id)
          obj = {};
        }
        // Traverse through all route parts except the last one
        route.slice(0, -1).forEach(property => {
          if (!obj.hasOwnProperty(property) || 
            ( obj.hasOwnProperty(property) && typeof obj[property] !== 'object')) 
          {
            obj[property] = {}; // create nested object if missing or not an object
          }
          obj = obj[property]; // go deeper
        })
        
        let data = {};
        try{
          data = JSON.parse(payload)
        }catch(error){}
        
        if (true || (data && typeof payload === 'object' && !Array.isArray(payload) ) ) {
          // Assuming payload is an object with properties to process
          for (const [key, value] of Object.entries(data)) {
            obj[key] = value; // go deeper
          };
        }else{
          obj = payload
        }

        // update on device fw settings
        try{
          await $.db_project.updateSettings(project_name,JSON.stringify(settings),device.id);
        }catch(error){
          console.log(error);
        }
      }

      if(project[project_name]){
        project[project_name].module.parseMessage(client,project_name,device,topic,payload,retain,()=>{});
      }
    }

  },

}



