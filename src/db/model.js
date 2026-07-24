const moment = require('moment');
var mysql = require('mysql2')

var self = module.exports = {

	getById : async (projectId)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where id = ?";
	    let table = ["models",projectId];
	    query = mysql.format(query,table);

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

	getByName : async (model)=>{

	  return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where name = ?";
	    let table = ["models",model];
	    query = mysql.format(query,table);

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
	    let table = ["models"];
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

	insert : async(model, model_table, logs_table)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				name : model,
				model_table : model_table,
				logs_table : logs_table,
				createdAt : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

		    $.db.insert("models",obj)
		    .then (rows => {
		      return resolve(rows[0]);
		    })
		    .catch(error => {
		      return reject(error);
		    });
		});
  	},

  	update : async(model, model_table, logs_table)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				name : model,
				model_table : model_table,
				logs_table : logs_table,
				createdAt : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			};

			let filter = {
				name : model
			};

		    $.db.update("models",obj,filter)
		    .then (rows => {
		      return resolve(rows[0]);
		    })
		    .catch(error => {
		      return reject(error);
		    });
		});
  	},

  	getSensorsByRef : async(modelId, ref)=>{
		return new Promise((resolve,reject) => {

	    let query = "SELECT * FROM ?? where model_id = ? and ref = ?";
	    let args = ["sensors",modelId,ref];
	    query = mysql.format(query,args);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0)
	        return resolve(rows);
	      else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	}

}
