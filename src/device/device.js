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

  parseMessage : async (client,topic,payload,retain)=>{

    let topic_bck = topic;

    //let index = topic.indexOf(MACRO_UID_PREFIX);
    // --- project ---
    let index = topic.indexOf("/");
    if(index == -1)
        return;

    let project_name = topic.substring(0,index);
    let project = await $.db_project.getByName(project_name);

    if(project == null)
      return;
    
    let project_id = project?.id;

    // --- uid ---
    topic = topic.substring(index+1);
    index = topic.indexOf("/");
    if(index == -1)
        return;

    let uid = topic.substring(0,index);
    topic = topic.substring(index+1);

    // check if topic corresponds to a device
    if(uid.startsWith(project.uidPrefix) && uid.length == project?.uidLength){

      let device = await $.db_device.get(uid);

      // Insert device if not exists on db
      if(device == null){
        let obj = {
          uid : uid,
          accept_release : "prod",
        }
        $.db_device.insert(obj)
        .then(async()=>{
          device = await $.db_device.get(uid);
        })
        .catch( (err) => {});
      }

      // update project id if needed
      if(project_id != null && project_id != device?.project_id) 
        $.db_device.update(device.id,"project_id",project_id);

      switch (topic) {
        case "status":
          if (payload === "online" || payload === "offline") {
            await $.db_device.update(device.id, "status", payload);
          }
          break;
        case "model":
          let res = await $.db_model.getByName(payload);
          let model_id = res?.id;
          if (model_id != null) {
            await $.db_device.update(device.id, "model_id", model_id);
          }
          break;
        case "tech":
          await $.db_device.update(device.id, "tech", payload);
          break;
        case "version":
          if (device?.version && payload != device.version) {
            await $.db_device.update(device.id, "version", payload);
            await self.handleFotaSuccess(device.id);
          }
          break;
        case "app_version":
          if (device?.app_version && payload != device.app_version) {
            await $.db_device.update(device.id, "app_version", payload);
            await self.handleFotaSuccess(device.id);
          }
          break;
        case "fw/fota/update/status":
          await self.handleFotaError(device.id, payload);
          break;
        // Optional: default case if needed
        default:
          // handle other topics or do nothing
          break;
      }

      if(topic.startsWith("sensor/")){

        updateSensor(device,topic,paylaod)
        index = topic.indexOf("/");
        if(index == -1)
            return;

        const name = topic.substring(index+1);
        let res = await $.db_sensor.getByRef(topic)
        if(res != null){
          await $.db_sensor.insert(logs_table,device.id,res.id,payload);
        }
      }

      // store remote device settings on project table - twin model
      if(topic.endsWith("/set") && payload != "" ){
        self.updateSettings(project_name,device,topic,payload);
      }

      if(project[project_name]){
        project[project_name].module.parseMessage(client,project_name,device,topic,payload,retain,()=>{});
      }
    }

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

  updateSettings : async (project_name,device,topic,payload)=>{
    let route = topic.split("/");

    if(route == null){
      console.log("topic invalid:",topic);
      return;
    }
    // get settings
    let settings = await $.db_project.getSettings(project_name,device.id);
    let obj = settings;

    if(obj == null){
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
    
    if ((data && typeof payload === 'object' && !Array.isArray(payload) ) ) {
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
  },

  checkFota : async (release = "dev")=>{

    const models = await $.db_model.getAll();

    for (const model of models) {
      
      if(!model?.id)
        continue;

      try{
        const latestVersion = await $.db_firmware.getLatestVersion(model.id,release);
        const latestAppVersion = await $.db_firmware.getLatestAppVersion(model.id,release);

        const devices = await $.db_device.listByModel(model.id);

        if(devices == null)
          continue;

        for (const device of devices) {

          if(device?.accept_release != release){
            continue;
          }

          let obj = null;
          // insert filename on fota table for this device or update.
          if(device?.app_version != latestAppVersion.app_version){
            obj = {
              model_id : device.model_id,
              target_version : latestVersion.version,
              target_app_version : latestAppVersion.app_version,
              target_release : device.accept_release,
              firmware_id : latestAppVersion.id,
              nAttempts : 0,
              fUpdate : true,
            };
          }else if(latestVersion?.version && (device?.version != latestVersion.version)){
            obj = {
              model_id : device.model_id,
              target_version : latestVersion.version,
              target_app_version : latestAppVersion.app_version,
              target_release : device.accept_release,
              firmware_id : latestVersion.id,
              nAttempts : 0,
              fUpdate : true,
            };
          }
          if(obj != null){
            try{
              let res = await $.db_fota.getEntry(device.id,obj);
              if(res == null)
                $.db_fota.update(device.id,obj);
            }catch(error){
              console.log(error)
            }
          }
        }
      }catch(error){
        console.log(error);
        continue;
      }
    }
  },

  
  triggerFota : async (release = "dev")=>{

    const devices = await $.db_fota.getUpdatable(release);

    const batchSize = 10;
    for (let i = 0; i < devices.length; i += batchSize) {
      const batch = devices.slice(i, i + batchSize);
      await Promise.all(batch.map(async (device) => {

        const firmware = await $.db_firmware.getById(device?.firmware_id)
        if(firmware != null){
          const project = await $.db_project.getById(device.project_id);
          const project_name = project?.name;
          const model = await $.db_model.getById(firmware.model_id);
          const model_name = model?.name;
          let topic = "";
          if(model_name == "sniffer"){
            // get sniffer info associated to device
            const sniffer = await $.db_data.getGwAssociatedToDevice("sniffer",device.uid);
            if(sniffer == null) return;
            // get device_uid from devices table
            const gw = await $.db_device.getById(sniffer?.id)
            if(gw == null) return;
            let mqtt_prefix = `${project_name}/${gw.uid}`;
            topic = mqtt_prefix+"/app/sniffer/fota/update/set";
          }
          else{
            let mqtt_prefix = `${project_name}/${device.uid}`;
            topic = mqtt_prefix+"/fw/fota/update/set";
          }
          let link = `${$.config.web.protocol}${$.config.web.domain}${$.config.web.fw_path}${firmware?.filename}/download?token=${firmware?.token}`;
          console.log(`Requesting firmware update of ${device.uid} to ${firmware?.filename}`);
          $.mqtt_client.publish(topic,`{"url":"${link}"}`,{qos:1,retain:false});

          let obj = {
            nAttempts : ++device.nAttempts
          }
          
          await $.db_fota.update(device.id,obj);
          
          obj = {
            device_id : device.id,
            local_version : device.version,
            local_app_version : device.app_version,
            target_version : firmware.version,
            target_app_version : firmware.app_version,
            target_file : firmware.filename,
            nAttempt : device.nAttempts
          }
          await $.db_fota.newLog(device.id,obj);
        }
        
      }));

      // Wait for 1 minute after processing each batch
      if (i + batchSize < devices.length) {
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  },

  handleFotaSuccess : async (deviceId) => {
    let object = {
      "nAttempts" : 0,
      "fUpdate" : 0,
    }
    await $.db_fota.update(deviceId,object);
    object = {
      success : 1,
    }
    await $.db_fota.updateLog(deviceId,obj);
  },

  handleFotaError : async (deviceId, error) => {
    let object = {
      error : error,
    }
    await $.db_fota.updateLog(deviceId,obj);
  }
}



