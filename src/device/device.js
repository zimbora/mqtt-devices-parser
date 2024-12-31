
var project = [];
const logs_table = "sensor_logs";

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

        if(model_id != null) $.db_device.updateModel(uid,model_id);
      }else if(topic.endsWith("tech")){
        await $.db_device.updateTech(uid,payload);
      }

      if(device.project_id != null && device.model_id != null){
        let res = await $.db_sensor.getByRef(topic)
        if(res != null){
          $.db_sensor.insert(logs_table,device.id,res.id,payload);
        }
      }

      if(project[project_name]){
        project[project_name].module.parseMessage(client,project_name,device,topic,payload,retain,()=>{});
      }
    }

  },

}
