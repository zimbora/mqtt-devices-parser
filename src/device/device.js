const moment = require('moment');

var _project = [];
const logs_table = "logs_sensor";
const semver = require('semver');

var self = module.exports = {

  init : async (config,projects)=>{
    return new Promise(async (resolve,reject) => {
      $.db.connect(config,()=>{
        console.log("MYSQL is connected");

        projects.map( async (name,counter)=>{
          console.log("project:",name)
          _project[name] = {
            module : null
          };
          _project[name].module = require(`${BASE_DIR}/projects/${name}/${name}.js`)
          _project[name].module?.init();
          let projectOptions = config[name];
          let row = await $.db_project.getByName(name);
          
          if(row == null)
            $.db_project.insert(name,name,"logs_"+name,projectOptions);
          
          if(counter == projects.length-1)
            return resolve();
        })
      })
    });


  },

  parseMessage : async (client,topic,payload,retain)=>{

    let topic_bck = topic;
    let project_name = null;
    let project = null;
    let project_id = null;
    let action = null;
    let uid = null;
    let device = null;

    try{
      payload = JSON.parse(payload)
    }catch(err){};
    
    // --- project ---
    project_name = getFirstWord(topic);
    project = await $.db_project.getByName(project_name);
    if(project == null)
      return;

    project_id = project?.id;
    topic = getWordAfterSlash(topic)

    // check if is from lwm2m gw
    if(topic.startsWith("responses") || topic.startsWith("requests")){
      action = getFirstWord(topic);
      topic = getWordAfterSlash(topic);
    }

    // --- uid ---
    uid = getFirstWord(topic);
    // check if topic corresponds to a device
    if(!uid.startsWith(project.uidPrefix) || uid.length > project?.uidLength)
      return;

    device = await $.db_device.get(uid);
    if(!device)
      return;

    topic = getWordAfterSlash(topic);

    if(device.protocol.toLowerCase() === "lwm2m"){
      parseLwm2mMessage(client, project_name, device, topic, payload, action);
    }else if(device.protocol.toLowerCase() === "mqtt"){
      parseMqttMessage(client, project_name, device, topic, payload, retain);
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

  checkFota : async (release = "dev")=>{

    const models = await $.db_model.getAll();

    for (const model of models) {
      
      //console.log("model:",model?.name);
      if(!model?.id)
        continue;

      try{
        const latestVersion = await $.db_firmware.getLatestVersion(model.id,release);
        const latestAppVersion = await $.db_firmware.getLatestAppVersion(model.id,release);
        //console.log("latestVersion:",latestVersion?.version);
        //console.log("latestAppVersion:",latestAppVersion?.app_version);

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
            try {

              let res = await $.db_fota.getEntry(device.id, obj);

              if (res == null) {
                try {
                  console.log("add fota entry for device:", device.uid);
                  await $.db_fota.update(device.id, obj);
                } catch (err) {
                  console.error("Error updating FOTA entry:", err);
                }
              }
              
            } catch (error) {
              console.error("Error getting or processing FOTA entry:", error);
            }
          }
        }
      }catch(error){
        console.error(error);
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
            const associatedDevice = await $.db_device.getAssociatedDevice(device.id);
            if(associatedDevice == null) return;

            // get device_uid from devices table
            const gw = await $.db_device.getById(associatedDevice)
            if(gw == null) return;

            const gwProject = await $.db_project.getById(gw?.project_id);
            const gwProjectName = project?.name;

            let mqtt_prefix = `${gwProjectName}/${gw?.uid}`;
            if (semver.gt(gw.app_version, "1.0.5"))
              topic = mqtt_prefix+`/app/sniffer/${sniffer.uid}/fota/update/set`;
            else // deprecate it as soon as all gws are updated
              topic = mqtt_prefix+`/app/sniffer/fota/update/set`;
          }
          else{
            let mqtt_prefix = `${project_name}/${device.uid}`;
            topic = mqtt_prefix+"/fw/fota/update/set";
          }
          let link = `${$.config.web.protocol}${$.config.web.domain}${$.config.web.fw_path}${firmware?.filename}/download?token=${firmware?.token}`;
          console.log(`Requesting firmware update for ${device.uid} to ${firmware?.filename}`);
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

}

async function parseLwm2mMessage(client, project_name, device, topic, payload, action){

  console.log("parse lwm2m message: ",topic);

  try{
    payload = JSON.parse(payload);
  }catch(error){}

  let word = getFirstWord(topic);
  topic = getWordAfterSlash(topic);

  switch (word) {
    case "status":
      if (payload === "online" || payload === "offline") {
        $.db_device.update(device.id, "status", payload);
        $.db_device.addLog(device.id,"status",payload);
      }
      return;
      break;
    case "sensor":
      updateSensor(device,topic,payload)
  }

  if(_project[project_name]){
    _project[project_name]?.module?.parseMessage(client,project_name,device,`${word}/${topic}`,payload,action,()=>{});
  }
}

async function parseMqttMessage(client, project_name, device, topic, payload, retain){

  if(topic.endsWith("/get"))
    return;

  //console.log("[MQTT] parse topic: ",topic);

  try{
    payload = JSON.parse(payload);
  }catch(error){}

  let word = getFirstWord(topic);
  topic = getWordAfterSlash(topic);

  switch (word) {
    case "status":
      if (payload === "online" || payload === "offline") {
        $.db_device.update(device.id, "status", payload);
        $.db_device.addLog(device.id,"status",payload);
      }
      return;
      break;
    case "model":
      let res = await $.db_model.getByName(payload);
      let model_id = res?.id;
      if (model_id != null && device?.tech != payload) {
        $.db_device.update(device.id, "model_id", model_id);
        $.db_device.addLog(device.id,"model_id",model_id);
      }
      return;
      break;
    case "tech":
      if (device?.tech && payload != device.tech) {
        $.db_device.update(device.id, "tech", payload);
        $.db_device.addLog(device.id,"tech",payload);
      }
      return;
      break;
    case "version":
      if (device?.version && payload != device.version) {
        $.db_device.addLog(device.id,"version",payload);
        $.db_device.update(device.id, "version", payload);
        handleFotaSuccess(device.id);
      }
      return;
      break;
    case "app_version":
      if (device?.app_version && payload != device.app_version) {
        $.db_device.addLog(device.id,"app_version",payload);
        $.db_device.update(device.id, "app_version", payload);
        handleFotaSuccess(device.id);
      }
      return;
      break;
    case "fw":
      if(topic === "fota/update/status"){
        handleFotaError(device.id, payload);
      }else{
        if(typeof payload === 'object' && payload !== null){
          try{
            let rows = await $.db_data.updateJson("fw",device.id,payload);
            rows = await $.db_data.addJsonLog("logs_fw",device.id,payload);
          }catch(error){
            console.error(error)
          } 
        }else if(typeof payload !== 'object' && payload !== null){
          // change it to topic.startsWith("fw")
          try{
            const column = getWordAfterLastSlash(topic);
            let rows = await $.db_data.update("fw",device.id,column,payload);
            rows = await $.db_data.addLog("logs_fw",device.id,column,payload);
          }catch(error){
            console.error(error)
          } 
        }
      }
      return;
      break;
    case "settings":
      if(topic.endsWith("/set")){
        updateLocalSettings(device,topic,payload);
      }else{
        updateRemoteSettings(device,topic,payload);
      }
      return;
      break;
    case "sensor":
      let ref = getFirstWord(topic)
      updateSensor(device,ref,payload)
      return;
      break;
    // Optional: default case if needed
    default:
      // handle other topics or do nothing
      break;
  }

  if(_project[project_name]){
    _project[project_name]?.module?.parseMessage(client,project_name,device,`${word}/${topic}`,payload,retain,()=>{});
  }
}

async function updateLocalSettings(device, topic, payload){

  $.db_device.addLog(device.id,"local_settings",JSON.stringify(payload));

  let route = topic.split("/");

  if (route == null || route.length == 0) {
    console.warn("updateLocalSettings: topic invalid:", topic);
    return;
  }

  // Retrieve existing settings
  let settings = await $.db_device.getLocalSettings(device.id);

  if (!settings || typeof settings !== 'object') {
    settings = {};
  }

  let obj = settings;

  // Traverse route parts to reach the target object
  route.slice(0, -1).forEach(property => {
    if (
      !Object.prototype.hasOwnProperty.call(obj, property) ||
      (obj.hasOwnProperty(property) && typeof obj[property] !== 'object') ||
      obj[property] === null
    ) {
      obj[property] = {}; // Create nested object if missing or not an object
    }
    obj = obj[property];
  });

  // Check if the data is a plain object, then merge
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    Object.assign(obj, payload);
  } else {
    console.warn("Payload is not a valid object:", payload);
    return;
  }

  try {
    // Update the settings in the database
    await $.db_device.updateLocalSettings(JSON.stringify(settings), device.id);
  } catch (err) {
    console.error("Failed to update local settings:", err);
  }
}

async function updateRemoteSettings(device,topic,payload){

  $.db_device.addLog(device.id,"remote_settings",JSON.stringify(payload));

  let route = topic.split("/");

  if(route == null){
    console.warn("updateRemoteSettings: topic invalid:",topic);
    return;
  }
  // Parse existing settings
  let settings = await $.db_device.getRemoteSettings(device.id);

  if (!settings || typeof settings !== 'object') {
    settings = {};
  }

  let obj = settings;

  // Traverse route parts
  route.slice(0, route.length).forEach(property => {
    if (
      !Object.prototype.hasOwnProperty.call(obj, property) ||
      (obj.hasOwnProperty(property) && typeof obj[property] !== 'object') ||
      obj[property] === null
    ) {
      obj[property] = {}; // create nested object if missing or not an object
    }
    obj = obj[property];
  });

  if (typeof payload === 'object' && !Array.isArray(payload)) {
    // Merge payload properties
    for (const [key, value] of Object.entries(payload)) {
      obj[key] = value;
    }
  } else {
    // payload isn't an object, replace the nested object
    obj = payload;
  }

  try {
    await $.db_device.updateRemoteSettings(JSON.stringify(settings), device.id);
  } catch (err) {
    console.error("Failed to update local settings:", err);
  }
}

async function updateSensor(device,ref,payload){
  let res = await $.db_device.getSensorByRef(device.id,ref)
  if(res == null)
    res = await $.db_model.getSensorByRef(device.model_id,ref)
  if(res == null)
    return;

  object = payload;
  value = null;
  error = null;
  timestamp = null;

  if (typeof object === 'object' && object !== null) {
    value = object?.value || object?.v;
    error = object?.error || object?.e;
    timestamp = object?.timestamp || objects?.ts;
  }else{
    value = payload;
  }

  if(value || error)
    object = null;

  const data = {
    object,
    value,
    error,
    timestamp
  }

  $.db_sensor.insert(logs_table,device.id,res.id,data);
  return;
}

function handleFotaSuccess (deviceId){
  let object = {
    "nAttempts" : 0,
    "fUpdate" : 0,
  }
  $.db_fota.update(deviceId,object);
  object = {
    success : 1,
  }
  $.db_fota.updateLog(deviceId,object);
}

function handleFotaError (deviceId, error){
  let object = {
    error : error,
  }
  $.db_fota.updateLog(deviceId,object);
}

function getFirstWord(str){
  const slashIndex = str.indexOf('/');
  if (slashIndex === -1) {
    // No slash found, return the original string
    return str;
  }
  return str.substring(0,slashIndex);
}

function getWordAfterSlash(str){
  const slashIndex = str.indexOf('/');
  if (slashIndex === -1) {
    // No slash found, return empty string
    return "";
  }
  return str.substring(slashIndex + 1);
}

function getWordAfterLastSlash(str){
  const lastSlashIndex = str.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    // No slash found, return the original string
    return str;
  }
  return str.substring(lastSlashIndex + 1);
}
