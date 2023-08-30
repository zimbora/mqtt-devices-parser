const fs = require('fs').promises;
const path = require('path');
const {Sequelize, DataTypes} = require("sequelize");
var SqlString = require('sequelize/lib/sql-string')
var mysql = require('mysql2');
var sequelize;

//var modelsPath = './models/';
var config = require('../config');

var self = module.exports = {

   init : async ()=>{

      return new Promise((resolve,reject) => {
         sequelize = new Sequelize(
            config.mysqldb.name,
            config.mysqldb.user,
            config.mysqldb.pwd,
            {
               host: config.mysqldb.host,
               dialect: 'mysql'
            },
         );
         return resolve(sequelize);
      })
   },

   connect : async ()=>{

      return new Promise((resolve,reject) => {
         sequelize.authenticate().then(() => {
            console.log('Connection has been established successfully.');
            return resolve();
         }).catch((error) => {
            console.error('Unable to connect to the database: ', error);
            return reject();
         });
      });
   },

   load : async (modelsPath)=>{

      return new Promise(async(resolve,reject) => {
         var files = await fs.readdir(modelsPath)
         files = files.filter((file) => {
            // Exclude models.js and any non-js files
            return (file.indexOf('.') !== 0) && (file !== 'models.js') && (file.slice(-9) === 'models.js');
         })
         files.forEach((file,counter) => {
            const model = require(path.join(modelsPath, file));
            model(sequelize, DataTypes);
            if(counter == files.length-1){
               return resolve();
            }
         });
      });
   },

   sync : async ()=>{

      return new Promise((resolve,reject) => {
         //sequelize.sync({alter:true,force:true}).then(() => {
         sequelize.sync({alter:true}).then( async () => {
            console.log('All tables were synced!');
            return resolve();
         }).catch((error) => {
            console.error('Unable to create table : ', error);
            return reject();
         });
      });
   },

   dropTableIndexes : async()=>{

      return new Promise((resolve,reject) => {
         let tables = Object.keys(sequelize.models);

         console.log(tables);
         if(!tables?.length)
            return resolve();

         tables.forEach(async(tableName,counter)=>{
            await self.dropAllIndexes(tableName);
            if(counter == tables.length-1)
               return resolve();
         });
      });
   },

   dropAllIndexes : async (tableName)=>{

      return new Promise( async(resolve,reject) => {
         // Fetch all indexes from the table
         let query = `SHOW INDEXES FROM ??`
         query = mysql.format(query,[tableName]);
         const indexes = await sequelize.query(query);

         // Filter out primary key index and unique indexes if you don't want to drop them
         const filteredIndexes = indexes[0].filter(index => index.Key_name !== 'PRIMARY' && !index.Non_unique);

         console.log(filteredIndexes);
         if(!filteredIndexes?.length)
            return resolve();

         // Drop each index
         filteredIndexes.forEach( async(index,counter)=>{
            try{
               let query = `DROP INDEX ?? ON ??`
               query = mysql.format(query,[index.Key_name,tableName]);
               await sequelize.query(query);
            }catch (error) {
               console.error('Error:', error);
            }
            console.log(`Dropped index ${index.Key_name}`);
            if(counter == filteredIndexes.length-1)
               return resolve();
         })
      });
   },

   get: (modelName)=>{

      if(modelName != ""){
         if(sequelize.models[modelName]){
            const model = sequelize.models[modelName];
            const keys = Object.keys(model.rawAttributes);
            let obj = {}
            keys.map((key)=>{
               obj[key] = null;
            })
            return obj;
         }else return;
      }else{
         return models = Object.keys(sequelize.models).map(modelName => {
            const model = sequelize.models[modelName];
            const keys = Object.keys(model.rawAttributes);
            return {
               modelName,
               keys
            };
         });
      }
   },

   getUser : async (type)=>{

      return new Promise( async (resolve,reject) => {
         const user = await sequelize.models['users'].findOne({
             where: {
                 type: type
             }
         });
         return resolve(user);
      });
   },

   insertUser: async (type, password,level)=>{

      return new Promise( async (resolve,reject) => {
         // Insert a record if it doesn't exist
         const res = await sequelize.models['users'].findOrCreate({
           where: { type: type },
           defaults: {
               password: password,
               level: level
            }
         })
         .then(([user, created]) => {
            if (created) {
               console.log('New user created:', type);
            } else {
               console.log('User already exists:', type);
            }
            return resolve(user);
         })
         .catch(error => {
           console.error('Error:', error);
           return reject(error);
         });
      });
   },

   insertClient: async (nick, token, user_id)=>{

      return new Promise( async (resolve,reject) => {
         // Insert a record if it doesn't exist
         const res = await sequelize.models['clients'].findOrCreate({
           where: { nick: nick },
           defaults: {
               user_id: user_id,
               token: token
            }
         })
         .then(([client, created]) => {
            if (created) {
               console.log('New client created:', nick);
            } else {
               console.log('Client already exists:', nick);
            }
            return resolve(client);
         })
         .catch(error => {
           console.error('Error:', error);
         });
      });
   }

}

