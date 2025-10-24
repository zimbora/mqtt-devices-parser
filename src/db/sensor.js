const moment = require('moment');
var mysql = require('mysql2')
const table = "sensors"

var self = module.exports = {

	getById : async (id)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where id = ?";
	    let args = [table,id];
	    query = mysql.format(query,args);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0]);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	getByRef : async (ref)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where ref = ?";
	    let args = [table,ref];
	    query = mysql.format(query,args);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0]);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	getByName : async (name)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where name = ?";
	    let args = [table,name];
	    query = mysql.format(query,args);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows[0]);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	getAll : async ()=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT id,name FROM ??";
	    let args = [table];
	    query = mysql.format(query,args);

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

	insert : async(table,deviceId,sensorId,payload)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				device_id : deviceId,
				sensor_id : sensorId,
				value : payload?.value,
				error : payload?.error,
				obj : payload?.object,
				localUnixTs : payload?.timestamp, // local timestamp
				createdAt : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

		    $.db.insert(table,obj)
		    .then (rows => {
		      return resolve(rows[0]);
		    })
		    .catch(error => {
		      return reject(error);
		    });
		});
  	},

}
