const moment = require('moment');
var mysql = require('mysql2')

var self = module.exports = {

	getById : async (firmwareId)=>{
		return new Promise((resolve,reject) => {

		  let query = "";
			let table = [];

			query = `SELECT * FROM firmwares where id = ?`;
			table = [firmwareId];

	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0){
	        return resolve(rows[0]);
	      }else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	getLatestVersion : async (modelId,release)=>{

	  return new Promise((resolve,reject) => {

	    let query = "";
		let table = [];

		query = `SELECT version,filename,token,id FROM firmwares where model_id = ? and build_release = ? ORDER BY CAST(SUBSTRING_INDEX(version, '.', 1) AS UNSIGNED) DESC,
		 CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(version, '.', 2), '.', -1) AS UNSIGNED) DESC,
		 CAST(SUBSTRING_INDEX(version, '.', -1) AS UNSIGNED) DESC
		 LIMIT 1`;
		table = [modelId,release];

	    query = mysql.format(query,table);

	    $.db.queryRow(query)
	    .then( rows => {
	      if(rows.length > 0){
	        return resolve(rows[0]);
	      }else
	        return resolve(null);
	    })
	    .catch( err => {
	      console.log(err);
	      return resolve(null);
	    });
	  });
	},

	getLatestAppVersion : async (modelId,release)=>{

	  return new Promise((resolve,reject) => {

	    let query = "";
		let table = [];

		query = `SELECT app_version,filename,token,id FROM firmwares where model_id = ? and build_release = ? ORDER BY CAST(SUBSTRING_INDEX(app_version, '.', 1) AS UNSIGNED) DESC,
		 CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(app_version, '.', 2), '.', -1) AS UNSIGNED) DESC,
		 CAST(SUBSTRING_INDEX(app_version, '.', -1) AS UNSIGNED) DESC
		 LIMIT 1`;
		table = [modelId,release];

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
}
