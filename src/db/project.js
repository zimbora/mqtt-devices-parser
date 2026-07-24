const moment = require('moment');
var mysql = require('mysql2')


var self = module.exports = {

	getById : async (projectId)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where id = ?";
	    let table = ["projects",projectId];
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

	getByName : async (project)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where name = ?";
	    let table = ["projects",project];
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

	getAll : async ()=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT id,name FROM ??";
	    let table = ["projects"];
	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
		  return resolve(rows);
	    })
	    .catch( err => {
	      return reject(null);
	    });
	  });
	},

	insert : async(project, project_table, logs_table, projectOptions)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				name : project,
				project_table : project_table,
				logs_table : logs_table,
				uidPrefix : projectOptions.uidPrefix,
				uidLength : projectOptions.uidLength,
				createdAt : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

		    $.db.insert("projects",obj)
		    .then (rows => {
		      return resolve(rows[0]);
		    })
		    .catch(error => {
		      return reject(error);
		    });
		});
  	},

  	getSettings : async(project,deviceId)=>{

  		return new Promise((resolve,reject) => {

		    let query = "SELECT settings FROM ?? where device_id = ?";
		    let table = [project, deviceId];
		    query = mysql.format(query,table);

		    $.db.queryRow(query)
		    .then( rows => {
		    	if(rows?.length > 0)
			  		return resolve(rows[0].settings);
			  	else
			  		return resolve(null);
		    })
		    .catch( err => {
		      return reject(err);
		    });
		});
  	},

  	updateSettings : async(project, settings, deviceId)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				settings : settings,
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

			let filter = {
				device_id : deviceId
			};

			resolve(null)
			
		    $.db.update(project,obj,filter)
		    .then (rows => {
		      return resolve(rows[0]);
		    })
		    .catch(error => {
		      return reject(error);
		    });
		    
		});
  	},
}
