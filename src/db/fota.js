const moment = require('moment');
var mysql = require('mysql2')

var self = module.exports = {

	getEntry : async (deviceId,filter)=>{

	  return new Promise((resolve,reject) => {

	    let query = `SELECT * FROM ?? where 
	    	device_id = ? and
	    	target_version = ? and
	    	target_app_version = ? and
	    	target_release = ? and
	    	firmware_id = ?`;

	    let table = [
	    	"fota",
	    	deviceId,
	    	filter.target_version,
	    	filter.target_app_version,
	    	filter.target_release,
	    	filter.firmware_id
    	];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0]);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      return reject(err);
	    });
	  });
	},

	getFirmwareId : async (deviceId)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT firmware_id FROM ?? where device_id = ?";
	    let table = ["fota",deviceId];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0].firmware_id);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      return reject(err);
	    });
	  });
	},

	getUpdatable : async (release)=>{

	  return new Promise((resolve,reject) => {

	    let query = `SELECT d.*,f.firmware_id, f.nAttempts 
	    	FROM fota as f
	    	inner join devices as d on d.id = f.device_id 
	    	where d.status = ? and f.fUpdate = ? and f.nAttempts < ? and f.target_release = ?`;
	    let table = ['online',1,3,release];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
		  return resolve(rows);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	update : async(deviceId, obj)=>{

		return new Promise(async (resolve,reject) => {

			obj['updatedAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');

			let firmwareId = await self.getFirmwareId(deviceId);
			if(firmwareId == null){
				obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
				obj['device_id'] = deviceId;

			    $.db.insert("fota",obj)
			    .then (rows => {
			      return resolve(rows[0]);
			    })
			    .catch(error => {
			      return reject(error);
			    });

			}else{

				let filter = {
					device_id : deviceId
				};

				$.db.update("fota",obj,filter)
			    .then (rows => {
			      return resolve(rows[0]);
			    })
			    .catch(error => {
			      return reject(error);
			    });
			}

		});
	},

	getFotaLastLog : async(deviceId)=>{

		return new Promise((resolve,reject) => {

	    let query = `SELECT * FROM ?? 
	    	where device_id = ? 
	    	ORDER BY updatedAt DESC
	    	LIMIT 1`;

	    let table = [
	    	"logs_fota",
	    	deviceId,
    	];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0]);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      return reject(err);
	    });
	  });
	},

	getDeviceLogs : async()=>{

		return new Promise((resolve,reject) => {

	    let query = `SELECT * FROM ?? 
	    	ORDER BY updatedAt DESC
	    	LIMIT 20`;

	    let table = [
	    	"fota",
    	];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      return reject(err);
	    });
	  });
	},

	newLog : async(deviceId, obj)=>{

		return new Promise(async (resolve,reject) => {

			const timestamp = moment().utc().format('YYYY-MM-DD HH:mm:ss');
			obj['updatedAt'] = timestamp;
			obj['createdAt'] = timestamp;
			obj['device_id'] = deviceId;

			$.db.insert("logs_fota",obj)
			.then (rows => {
			  return resolve(rows[0]);
			})
			.catch(error => {
			  return reject(error);
			});

		});
	},

	updateLog : async(deviceId, obj)=>{

		return new Promise(async (resolve,reject) => {

			const log = await self.getFotaLastLog(deviceId);

			if(log?.createdAt != log?.updatedAt)

			obj['updatedAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');

			const filter = {
				id : log.id
			}

			$.db.update("logs_fota",obj,filter)
			.then (rows => {
			  return resolve(rows[0]);
			})
			.catch(error => {
			  return reject(error);
			});

		});
	},

}
