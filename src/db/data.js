const moment = require('moment');
var mysql = require('mysql2')

// Use this call only for dbs outside this module, they need to be registered on sequelize

var self = module.exports = {

	checkEntry : async (table,deviceId)=>{

		return new Promise((resolve,reject) => {

		let query = "SELECT * FROM ?? where device_id = ?";
		let args = [table,deviceId];
		query = mysql.format(query,args);

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

	update : async (table, deviceId, topic, payload)=>{

		return new Promise( async (resolve,reject) => {

			if(!payload) return resolve();

			let data = null;
			// check if data is in JSON format
			try{
				data = JSON.parse(payload);
			}catch(e){
				data = payload;
			}

			let obj = {
				updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
			}

			let db_columns = $.models.get(table);

			if(db_columns == null) return resolve();

			let index = topic.indexOf("/");

			if(index > -1){ // check if topic has subtopics
				let key = topic.substring(0,index);
				topic = topic.substring(index+1);

				if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
					// create JSON struct with the remaining topic
					// table is the table
					// key is the column

					// build object with the remaining topic and respective data
					if(typeof data === "object")
						obj[key] = JSON.stringify(parser.pathIntoObject(topic,JSON.stringify(data)))
					else
						obj[key] = JSON.stringify(parser.pathIntoObject(topic,data));

					let exists = await self.checkEntry(table,deviceId);
					if(!exists){
						obj['device_id'] = deviceId;
						obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
						$.db.insert(table,obj)
						.then((rows)=>{
							return resolve(rows);
						})
						.catch((err)=>{
							return reject(err);
						})
					}else{
						let filter = {
							device_id : deviceId
						}
						$.db.update(table,obj,filter)
						.then((rows)=>{
							return resolve(rows);
						})
						.catch((err)=>{
							return reject(err);
						})
					}

				}else{
					return resolve();
					//return reject(`columns not found for table ${table}`);	
				} 
			}else{

				let key = topic;
				if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
					// build object with respective data
					if(typeof data === "object")
						obj[key] = JSON.stringify(data);
					else
						obj[key] = data;

					let exists = await self.checkEntry(table,deviceId);
					if(!exists){
						obj['device_id'] = deviceId;
						obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
						$.db.insert(table,obj)
						.then((rows)=>{
							return resolve(rows);
						})
						.catch((err)=>{
							return reject(err);
						})
					}else{
						let filter = {
							device_id : deviceId
						}

						$.db.update(table,obj,filter)
						.then((rows)=>{
							return resolve(rows);
						})
						.catch((err)=>{
							return reject(err);
						})
					}
				}else{
					return resolve();
					//return reject(`columns not found for table ${table}`);	
				}
			}
		})
	},

	updateJson : async (table, deviceId, payload)=>{

		return new Promise( async (resolve, reject) => {
		
			if (!payload || typeof payload !== 'object') 
				return reject("Not object");

			let obj = {
				updatedAt: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				device_id: deviceId,
			};

			// Get columns info
			const db_columns = $.models.get(table);
			if (db_columns == null){
				resolve();
				//return reject(`columns not found for table ${table}`);
			} 

			// Prepare data for insertion
			for (let key in payload) {
				if (db_columns.hasOwnProperty(key)) {
					let value = payload[key];

					// Convert object to JSON string if needed
					if (typeof value === 'object') {
						value = JSON.stringify(value);
					}

					obj[key] = value;
				}
			}

			let exists = await self.checkEntry(table,deviceId);
			if(!exists){
				obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
				$.db.insert(table,obj)
				.then((rows)=>{
					return resolve(rows);
				})
				.catch((err)=>{
					return reject(err);
				})
			}else{
				let filter = {
					device_id : deviceId
				}
				$.db.update(table,obj,filter)
				.then((rows)=>{
					return resolve(rows);
				})
				.catch((err)=>{
					return reject(err);
				})
			}
		});
	},

	addLog : async (table, deviceId, topic, payload)=>{

	  return new Promise((resolve,reject) => {

	    if(!payload) return resolve();

		let data = null;
		// check if data is in JSON format
		try{
			data = JSON.parse(payload);
		}catch(e){
			data = payload;
		}

		let obj = {
			updatedAt : moment().utc().format('YYYY-MM-DD HH:mm:ss')
		}

		let db_columns = $.models.get(table);
		if(db_columns == null){
			resolve();
			//return reject(`columns not found for table ${table}`);
		}

		let index = topic.indexOf("/");

		if(index > -1){ // check if topic has subtopics
			let key = topic.substring(0,index);
			topic = topic.substring(index+1);

			if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
				// create JSON struct with the remaining topic
				// key is the column

				// build object with the remaining topic and respective data
				if(typeof data === "object")
					obj[key] = JSON.stringify(parser.pathIntoObject(topic,JSON.stringify(data)))
				else
					obj[key] = JSON.stringify(parser.pathIntoObject(topic,data));

				obj['device_id'] = deviceId;
				obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
				$.db.insert(table,obj)
				.then((rows)=>{
					return resolve(rows);
				})
				.catch((err)=>{
					return reject(err);
				})

			}else{
				resolve();
				//return reject(`column ${key} not found for table ${table}`);
			}
		}else{

			let key = topic;
			if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
				// build object with respective data
				if(typeof data === "object")
					obj[key] = JSON.stringify(data);
				else
					obj[key] = data;

				obj['device_id'] = deviceId;
				obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
				$.db.insert(table,obj)
				.then((rows)=>{
					return resolve(rows);
				})
				.catch((err)=>{
					return reject(err);
				})
			}else{
				resolve();
				//return reject(`column ${key} not found for table ${table}`);
			}
		}

	  });
	},

	addJsonLog: async (table, deviceId, dataObject) => {
		return new Promise((resolve, reject) => {
			if (!dataObject || typeof dataObject !== 'object') 
				return reject("Not an object");

			let obj = {
				updatedAt: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
				device_id: deviceId,
				createdAt: moment().utc().format('YYYY-MM-DD HH:mm:ss')
			};

			// Get columns info
			const db_columns = $.models.get(table);
			if (db_columns == null) 
				return reject(`No columns for table: ${table}`);

			// Prepare data for insertion
			for (let key in dataObject) {
				if (db_columns.hasOwnProperty(key)) {
					let value = dataObject[key];

					// Convert object to JSON string if needed
					if (typeof value === 'object') {
						value = JSON.stringify(value);
					}

					obj[key] = value;
				}
			}

			$.db.insert(table, obj)
			.then((rows)=>{
				return resolve(rows);
			})
			.catch((err)=>{
				return reject(err);
			})
		});
	},

	deleteLogs : async (table, deviceId, topic, payload)=>{

	  return new Promise((resolve,reject) => {

		let db_columns = $.models.get(table);
		if(db_columns == null){
			resolve();
			//return reject(`columns not found for table ${table}`);
		}

		$.db.delete(table,{id:0})
		let index = topic.indexOf("/");

		if(index > -1){ // check if topic has subtopics
			let key = topic.substring(0,index);
			topic = topic.substring(index+1);

			if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
			  // create JSON struct with the remaining topic
			  // key is the column

			  // build object with the remaining topic and respective data
			  if(typeof data === "object")
			    obj[key] = JSON.stringify(parser.pathIntoObject(topic,JSON.stringify(data)))
			  else
			    obj[key] = JSON.stringify(parser.pathIntoObject(topic,data));

			  obj['device_id'] = deviceId;
			  obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
			  $.db.insert(table,obj)
			  .then((rows)=>{
				return resolve(rows);
			  })
			.catch((err)=>{
				return reject(err);
			})
			}
		}else{

			let key = topic;
			if(db_columns.hasOwnProperty(key)){ // check if db has a column for this key
			  // build object with respective data
			  if(typeof data === "object")
			    obj[key] = JSON.stringify(data);
			  else
			    obj[key] = data;

			  obj['device_id'] = deviceId;
			  obj['createdAt'] = moment().utc().format('YYYY-MM-DD HH:mm:ss');
			  $.db.insert(table,obj)
			}
		}

	    return resolve();
	  });
	}
};

/**
 * Build a nested object from a path string and a leaf value.
 *
 * Example:
 *   pathIntoObject('foo/bar/baz', 123) -> { foo: { bar: { baz: 123 } } }
 *
 * Notes:
 * - By default, splits on '/'.
 * - Leading/trailing/duplicate delimiters are ignored (e.g., '/a//b/' -> ['a','b']).
 * - Value is used as-is. If you pass JSON.stringify(data), the leaf will be that string.
 *
 * @param {string} path - The path to turn into nested object keys (e.g., 'a/b/c').
 * @param {*} value - The value to place at the final key.
 * @param {Object} [options]
 * @param {string} [options.delimiter='/'] - Path delimiter.
 * @returns {*}
 */
const parser = {
  pathIntoObject(path, value, options = {}) {
    const delimiter = options.delimiter || '/';

    if (typeof path !== 'string') {
      throw new TypeError('path must be a string');
    }

    // Normalize path: remove empty segments caused by leading/trailing or duplicate delimiters
    const segments = path
      .split(delimiter)
      .map(s => s.trim())
      .filter(Boolean);

    // If no segments, just return the value directly
    if (segments.length === 0) return value;

    // Build nested object
    let root = {};
    let cursor = root;

    for (let i = 0; i < segments.length; i++) {
      const key = segments[i];
      const isLast = i === segments.length - 1;

      if (isLast) {
        cursor[key] = value;
      } else {
        // Create the next level if not present
        cursor[key] = {};
        cursor = cursor[key];
      }
    }

    return root;
  },
};

