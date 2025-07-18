const moment = require('moment');
var mysql = require('mysql2')

var self = module.exports = {

	getById : async (deviceId)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT * FROM ?? where id = ?";
			let table = ["devices",deviceId];
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

	get : async (uid)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT * FROM ?? where uid = ?";
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

	listByModel : async (model_id)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT * FROM ?? where model_id = ?";
			let table = ["devices",model_id];
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

	listOnlineByModel : async (model_id)=>{
		return new Promise((resolve,reject) => {

			let query = "SELECT * FROM ?? where model_id = ? and status = ?";
			let table = ["devices",model_id,"online"];
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

	insert : async(obj)=>{

		return new Promise((resolve,reject) => {
			let timestamp = moment().utc().format('YYYY-MM-DD HH:mm:ss');
			obj['createdAt'] = timestamp;
			obj['updatedAt'] = timestamp;

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

	updateObject : async (deviceId, obj)=>{

		return new Promise( async (resolve, reject) => {
			
			const table = "devices";

			if (!obj || typeof obj !== 'object') 
				return reject("Not object");

			obj['updatedAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');

			let filter = {
				id : deviceId
			}
			$.db.update(table,obj,filter)
			.then((rows)=>{
				return resolve(rows);
			})
			.catch((err)=>{
				return reject(err);
			})

		});
	},

}
