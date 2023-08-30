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
	      console.log(err);
	      return resolve(null);
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
	      console.log(err);
	      return resolve(null);
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
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	insert : async(project, project_table, logs_table)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				name : project,
				project_table : project_table,
				logs_table : logs_table,
				createdAt : moment().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().format('YYYY-MM-DD HH:mm:ss')
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

}
