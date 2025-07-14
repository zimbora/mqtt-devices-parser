const moment = require('moment');
var mysql = require('mysql2')

var self = module.exports = {

	get : async (uid)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT id,uid,project_id,model_id,status FROM ?? where uid = ?";
			let table = ["devices",uid];
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

	listOnline : async ()=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT * FROM ?? where status = ?";
			let table = ["devices","online"];
			query = mysql.format(query,table);

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
	},

	getField : async (id,column)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT ?? FROM devices where id = ?";
			let table = [column,id];
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

	insert : async(uid)=>{

		return new Promise((resolve,reject) => {
			let obj = {
				uid : uid,
				createdAt : moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

			$.db.insert("devices",obj)
			.then (rows => {
				return resolve(rows[0]);
			})
			.catch(error => {
				return reject(error);
			});
		});
	},

	update : async(id,column,value)=>{
		return new Promise((resolve,reject) => {

			let obj = {
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			};

			obj[column] = value;

			let filter = {
				id : id,
			};

			$.db.update("devices",obj,filter)
			.then (rows => {
				return resolve(rows);
			})
			.catch(error => {
				return reject(error);
			});
		});
	},

}
