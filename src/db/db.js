var mysql = require('mysql2');

var pool;

var self = module.exports = {
  connect : (config,cb)=>{
    pool      =    mysql.createPool({
      connectionLimit : config.mysqldb.conn_limit,
      host     : config.mysqldb.host,
      port     : config.mysqldb.port,
      user     : config.mysqldb.user,
      password : config.mysqldb.pwd,
      database : config.mysqldb.name,
      debug    : false
    });
    pool.getConnection(function(err,connection){
        if(err) {
          console.log("ISSUE WITH MYSQL \n" + err);
          process.exit(1);
        } else {
          setInterval(function(){self.pingMySQL(connection);}, 3600000); // 1 hour
          connection.on('error', function(err) {
            console.log("Mysql error: "+err.code); // 'ER_BAD_DB_ERROR'
            process.exit(1);
          });
          cb();
        }
    });
  },

  getConnection : (cb)=>{
    pool.getConnection(function(err, connection) {
      cb(err,connection);
    });
  },

  pingMySQL : (connection)=>{
    connection.ping(function (err) {
      if (err) throw err;
      //console.log(String(Date.now())+'Server responded to ping');
    });
  },

  get_non_persistent_db_connection : (db_name,cb)=>{
    let pool2      =    mysql.createPool({
        connectionLimit : 100,
        host     : config.mysqldb.host,
        user     : config.mysqldb.user,
        password : config.mysqldb.pwd,
        database : db_name,
        debug    :  false,
        multipleStatements: true
    });
    pool2.getConnection(function(err,connection){
      cb(err,connection);
    });
  },

  close_db_connection : (connection)=>{
    if(connection != null){
      connection.release();
    }
  },

  queryRow : async (query)=>{
    return new Promise((resolve,reject) => {

        self.getConnection((err,conn)=>{
          if(err) return reject(err);

          conn.query(query,function(err,rows){
            self.close_db_connection(conn);
            if(err) return reject(err)
            else return resolve(rows);
          });
        });
      });
  },

  insert : async(table,data)=>{

    return new Promise((resolve,reject) => {
      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "";
        let values = [];

        if(typeof data === "object"){
          const keys = Object.keys(data);
          values = Object.values(data);
          const placeholders = values.map(() => '?').join(', ');
          query = `INSERT INTO ?? (${keys.join(', ')}) VALUES (${placeholders})`;
        }else{
          return reject("data passed is not an object");
        }
        values.unshift(table);
        query = mysql.format(query,values);

        conn.query(query,function(err,rows){
          self.close_db_connection(conn);
          if(err) return reject(err)
          else return resolve(rows);
        });
      });
    });
  },

  update : async (table, data, filter) => {

    return new Promise((resolve, reject) => {
      self.getConnection((err, conn) => {
        if (err) return reject(err);

        let query = "";
        let values = [];

        if (typeof data === "object") {
          const keys = Object.keys(data);
          values = Object.values(data);
          query = `UPDATE ?? SET ${keys.map(key => `${key} = ?`).join(', ')}`;
        } else {
          return reject("data passed is not an object");
        }

        if (typeof filter === "object") {
          const filterKeys = Object.keys(filter);
          const filterValues = Object.values(filter);
          query += ` WHERE ${filterKeys.map(key => `${key} = ?`).join(' AND ')}`;
          values.push(...filterValues);
        } else {
          return reject("filter passed is not an object");
        }

        values.unshift(table);
        query = mysql.format(query, values);

        conn.query(query, function (err, rows) {
          self.close_db_connection(conn);
          if (err) return reject(err);
          else return resolve(rows);
        });
      });
    });
  },

  updateOrInsert: async (table, data, filter) => {
    return new Promise((resolve, reject) => {
      self.getConnection((err, conn) => {
        if (err) return reject(err);

        let updateQuery = "";
        let updateValues = [];

        if (typeof data === "object") {
          const keys = Object.keys(data);
          updateValues = Object.values(data);
          updateQuery = `UPDATE ?? SET ${keys.map(key => `${key} = ?`).join(', ')}`;
        } else {
          self.close_db_connection(conn);
          return reject("data passed is not an object");
        }

        if (typeof filter === "object") {
          const filterKeys = Object.keys(filter);
          const filterValues = Object.values(filter);
          updateQuery += ` WHERE ${filterKeys.map(key => `${key} = ?`).join(' AND ')}`;
          updateValues.push(...filterValues);
        } else {
          self.close_db_connection(conn);
          return reject("filter passed is not an object");
        }

        updateValues.unshift(table);
        updateQuery = mysql.format(updateQuery, updateValues);

        conn.query(updateQuery, function (err, rows) {
          if (err) {
            self.close_db_connection(conn);
            return reject(err);
          }
          // If affectedRows = 0, do an insert
          if (rows.affectedRows === 0) {
            // Combine data and filter for insert
            const insertObj = { ...filter, ...data }; // filter first, data overrides on conflict
            const insertKeys = Object.keys(insertObj);
            const insertValues = Object.values(insertObj);

            const insertQuery = mysql.format(
              `INSERT INTO ?? (${insertKeys.map(() => '??').join(', ')}) VALUES (${insertKeys.map(() => '?').join(', ')})`,
              [table, ...insertKeys, ...insertValues]
            );

            conn.query(insertQuery, function (insertErr, insertRows) {
              self.close_db_connection(conn);
              if (insertErr) return reject(insertErr);
              else return resolve(insertRows);
            });
          } else {
            self.close_db_connection(conn);
            return resolve(rows);
          }
        });
      });
    });
  },

  // update column with json data
  updateJSON : async (table, column, data, filter) => {

    return new Promise((resolve, reject) => {
      self.getConnection((err, conn) => {
        if (err) return reject(err);

        let query = "";
        let values = [];

        if (typeof data === "object") {
          const keys = Object.keys(data);
          query = `UPDATE ${table} SET ${column} = `;
          keys.forEach((key, index) => {
            query += `JSON_SET(${column}, '$.${key}', ?)`;
            values.push(data[key]);
            if (index !== keys.length - 1) {
              query += ', ';
            }
          });
        } else {
          return reject("data passed is not an object");
        }

        if (typeof filter === "object") {
          const filterKeys = Object.keys(filter);
          const filterValues = Object.values(filter);
          query += ` WHERE ${filterKeys.map(key => `${key} = ?`).join(' AND ')}`;
          values.push(...filterValues);
        } else {
          return reject("filter passed is not an object");
        }

        query = mysql.format(query, values);
        conn.query(query, function (err, rows) {
          self.close_db_connection(conn);
          if(rows.affectedRows && !rows.changedRows){
            self.insertJSON(table,column,data,filter)
            .then( rows => {
              return resolve(rows);
            })
            .catch( err => {
              return reject(err);
            })
          }else{
            if (err) return reject(err);
            else return resolve(rows);
          }
        });
      });
    });
  },

  insertJSON : async (table, column, data, filter) => {

    return new Promise((resolve, reject) => {
      self.getConnection((err, conn) => {
        if (err) return reject(err);

        let query = "";
        let values = [];

        if (typeof data === "object") {
          const jsonString = JSON.stringify(data);
          query = `UPDATE ?? SET ?? = ?`;
          const inserts = [table, column, jsonString];
          query = mysql.format(query, inserts);
        } else {
          return reject("data passed is not an object");
        }

        if (typeof filter === "object") {
          const filterKeys = Object.keys(filter);
          const filterValues = Object.values(filter);
          query += ` WHERE ${filterKeys.map(key => `${key} = ?`).join(' AND ')}`;
          values.push(...filterValues);
        } else {
          return reject("filter passed is not an object");
        }

        query = mysql.format(query, values);
        conn.query(query, function (err, rows) {
          self.close_db_connection(conn);
          if (err) return reject(err);
          else return resolve(rows);
        });
      });
    });
  },

  delete : async(table,filter)=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "";
        if(typeof filter === "object"){
          let values = [];
          query = `DELETE FROM ${table} WHERE `;
          for (let key in filter){
            if(values.length > 0)
              query += " AND ";
            query += key + " = ?"
            values.push(filter[key]);
          }
          query = mysql.format(query,values);
        }else{
          return reject("filter passed is not an object");
        }

        conn.query(query,function(err,rows){
          self.close_db_connection(conn);
          if(err) return reject(err)
          else return resolve(rows);
        });
      });
    });
  },

  getTables : async()=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "SHOW TABLES;"

        conn.query(query,function(err,rows){
          self.close_db_connection(conn);
          if(err) return reject(err)
          else return resolve(rows);
        });
      });
    });
  },

  deleteOldEntries : async(table,filter)=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "";
        if(typeof filter === "object"){
          let values = [];
          query = `DELETE FROM ?? WHERE `;
          values.push(table);
          for (let key in filter){
            if(key == "createdAt"){
              query += "createdAt < ?";
            }else if(key = "id")
              query += "id < ?"
            else 
              return reject("key not supported");
            values.push(filter[key]);
          }
          query = mysql.format(query,values);
        }else{
          return reject("filter passed is not an object");
        }

        conn.query(query,function(err,rows){
          self.close_db_connection(conn);
          if(err) return reject(err)
          else return resolve(rows);
        });
      });
    });
  },

  getDataFromDeviceId : async (table,deviceId)=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "SELECT ?? FROM ?? where device_id = ?";
        let args = [field,table,deviceId];
        query = mysql.format(query,args);
        conn.query(query,function(err,rows){
          $.db.close_db_connection(conn);
          if(err) return reject(err)
          else{
            if(rows.length == 1 ){
              return resolve(rows[0]);
            }else return resolve(null);
          }
        });
      });
    });
  },

  getFieldFromDeviceId : async (table,deviceId,field)=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "SELECT ?? FROM ?? where device_id = ?";
        let args = [field,table,deviceId];
        query = mysql.format(query,args);
        conn.query(query,function(err,rows){
          $.db.close_db_connection(conn);
          if(err) return reject(err)
          else{
            if(rows.length == 1 ){
              return resolve(rows[0][field]);
            }else return resolve(null);
          }
        });
      });
    });
  },

  getPropertyFromDeviceId : async(table,deviceId,field,key)=>{

    return new Promise((resolve,reject) => {

      self.getConnection((err,conn)=>{
        if(err) return reject(err);

        let query = "SELECT ?? FROM ?? where device_id = ?";
        let args = [field,table,deviceId];

        query = mysql.format(query,args);
        conn.query(query,function(err,rows){
          $.db.close_db_connection(conn);
          if(err) return reject(err)
          else{
            if(rows.length == 1 && rows[0]?.field && rows[0][field]?.key){
              return resolve(rows[0][field][key]);
            }else return resolve(null);
          }
        });
      });
    });
  }
}
