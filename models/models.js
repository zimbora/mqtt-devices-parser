const fs = require('fs').promises;
const path = require('path');
const { Sequelize, DataTypes } = require("sequelize");
var SqlString = require('sequelize/lib/sql-string');
var mysql = require('mysql2');
var sequelize;

// var modelsPath = './models/';

var self = module.exports = {
  init: async (config) => {
    return new Promise((resolve, reject) => {
      sequelize = new Sequelize({
        database: config.mysqldb.name,
        username: config.mysqldb.user,
        password: config.mysqldb.pwd,
        host: config.mysqldb.host,
        port: config.mysqldb.port,
        dialect: 'mysql',
      });
      return resolve(sequelize);
    });
  },

  connect: async () => {
    return new Promise((resolve, reject) => {
      sequelize
        .authenticate()
        .then(() => {
          console.log('Connection has been established successfully.');
          return resolve();
        })
        .catch((error) => {
          console.error('Unable to connect to the database: ', error);
          return reject();
        });
    });
  },

  load: async (modelsPath) => {
    return new Promise(async (resolve, reject) => {
      var files = await fs.readdir(modelsPath);
      files = files.filter((file) => {
        // Exclude models.js and non-js files
        return (
          file.indexOf('.') !== 0 &&
          file !== 'models.js' &&
          file.slice(-9) === 'models.js'
        );
      });
      files.forEach((file, counter) => {
        const model = require(path.join(modelsPath, file));
        model(sequelize, DataTypes);
        if (counter === files.length - 1) {
          return resolve();
        }
      });
    });
  },

  sync: async () => {
    return new Promise((resolve, reject) => {
      // sequelize.sync({alter:true,force:true}).then(() => {
      sequelize
        .sync({ alter: true })
        .then(async () => {
          console.log('All tables were synced!');
          return resolve();
        })
        .catch((error) => {
          console.error('Unable to create table : ', error);
          return reject();
        });
    });
  },

  dropTableIndexes: async () => {
    return new Promise((resolve, reject) => {
      let tables = Object.keys(sequelize.models);

      console.log(tables);
      if (!tables?.length) return resolve();

      tables.forEach(async (tableName, counter) => {
        self
          .dropAllIndexes(tableName)
          .then((res) => {
            if (counter === tables.length - 1) return resolve();
          })
          .catch((error) => {
            if (counter === tables.length - 1) return resolve();
          });
      });
    });
  },

  dropAllIndexes: async (tableName) => {
    return new Promise(async (resolve, reject) => {
      // Fetch all indexes from the table
      let query = `SHOW INDEXES FROM ??`;
      query = mysql.format(query, [tableName]);

      var indexes;
      sequelize
        .query(query)
        .then((res) => {
          indexes = res;

          // Filter out primary key index and unique indexes if you don't want to drop them
          const filteredIndexes = indexes[0].filter(
            (index) => index.Key_name !== 'PRIMARY' && !index.Non_unique
          );

          if (!filteredIndexes?.length) return resolve();

          // Drop each index
          filteredIndexes.forEach(async (index, counter) => {
            let query = `DROP INDEX ?? ON ??`;
            query = mysql.format(query, [index.Key_name, tableName]);
            sequelize
              .query(query)
              .then((res) => {
                console.log(`Dropped index ${index.Key_name}`);
                if (counter === filteredIndexes.length - 1) return resolve();
              })
              .catch((error) => {
                if (counter === filteredIndexes.length - 1)
                  return resolve();
              });
          });
        })
        .catch(() => {
          return resolve();
        });
    });
  },

  get: (modelName) => {
    if (modelName != "") {
      if (sequelize.models[modelName]) {
        const model = sequelize.models[modelName];
        const keys = Object.keys(model.rawAttributes);
        let obj = {};
        keys.map((key) => {
          obj[key] = null;
        });
        return obj;
      } else return;
    } else {
      return (models = Object.keys(sequelize.models).map((modelName) => {
        const model = sequelize.models[modelName];
        const keys = Object.keys(model.rawAttributes);
        return {
          modelName,
          keys,
        };
      }));
    }
  },

  getUser: async (type) => {
    return new Promise(async (resolve, reject) => {
      const user = await sequelize.models['users'].findOne({
        where: {
          type: type,
        },
      });
      return resolve(user);
    });
  },

  insertUser: async (type, password, level) => {
    return new Promise(async (resolve, reject) => {
      // Insert a record if it doesn't exist
      const res = await sequelize.models['users'].findOrCreate({
        where: { type: type },
        defaults: {
          password: password,
          level: level,
        },
      })
        .then(([user, created]) => {
          if (created) {
            console.log('New user created:', type);
          } else {
            console.log('User already exists:', type);
          }
          return resolve(user);
        })
        .catch((error) => {
          console.error('Error:', error);
          return reject(error);
        });
    });
  },

  insertClient: async (nick, token, user_id) => {
    return new Promise(async (resolve, reject) => {
      // Insert a record if it doesn't exist
      const res = await sequelize.models['clients'].findOrCreate({
        where: { nick: nick },
        defaults: {
          user_id: user_id,
          token: token,
        },
      })
        .then(([client, created]) => {
          if (created) {
            console.log('New client created:', nick);
          } else {
            console.log('Client already exists:', nick);
          }
          return resolve(client);
        })
        .catch((error) => {
          console.error('Error:', error);
          return reject(error);
        });
    });
  },

  insertProject: async(project) => {
    return new Promise(async (resolve, reject) => {
      // Insert a record if it doesn't exist
      const res = await sequelize.models['projects'].findOrCreate({
        where : { name: project?.name },
        defaults : {
          description : "firmware running on esp32",
          project_table : project?.name,
          logs_table : "logs_"+project?.name,
          uidPrefix : project?.uidPrefix,
          uidLength : project?.uidLength,
        },
      })
        .then(([client, created]) => {
          if (created) {
            console.log('New project created:', project?.name);
          } else {
            console.log('Project already exists:', project?.name);
          }
          return resolve(client);
        })
        .catch((error) => {
          console.error('Error:', error);
          return reject(error);
        });
    });
  },

  seedCommonLwM2MObjects: async(objects) => {
    try {
      const results = await Promise.all(
        objects.map(async (object) => {
          const [record, created] = await sequelize.models['lwm2mObjects'].upsert(
            {
              objectId: object.objectId,
              name: object.name,
              description: object.description,
            },
            {
              where: { objectId: object.objectId }, // Ensure the record exists based on objectId
            }
          );
          return { record, created };
        })
      );
      console.log("Insert/Update completed for LwM2M Objects.");
      return results;
    } catch (error) {
      console.error("Error inserting/updating LwM2M Objects:", error.message);
      throw error;
    }
  },
  /*
  seedCommonLwM2MResources: async(resources) => {
    try {
      const results = await Promise.all(
        resources.map(async (resource) => {
          const [record, created] = await sequelize.models['lwm2mResources'].upsert(
            {
              objectId: resource.objectId,
              resourceId: resource.resourceId,
              name: resource.name,
              description: resource.description,
            },
            {
              where: { objectId: object.objectId, resourceId: object.resourceId }, // Ensure the record exists based on objectId and resourceId
            }
          );
          return { record, created };
        })
      );
      console.log("Insert/Update completed for LwM2M Resources.");
      return results;
    } catch (error) {
      console.error("Error inserting/updating LwM2M Resources:", error.message);
      throw error;
    }
  },
  */

  /**
 * Seed LwM2M resources into the database.
 *
 * Expected DB model: sequelize.models['lwm2mResources']
 * with a composite unique key on (objectId, resourceId) recommended.
 *
 * @param {Array} resources - Either:
 *   - Flat: [{ objectId, resourceId, name, description }, ...]
 *   - Nested: [{ objectId, name, resources: [{ resourceId, name, description }, ...] }, ...]
 * @param {import('sequelize').Sequelize} sequelize - An initialized Sequelize instance.
 * @returns {Promise<Array<{ objectId:number, resourceId:number, created:boolean, updated:boolean }>>}
 */
  seedCommonLwM2MResources: async (resources) => {
    if (!sequelize || !sequelize.models || !sequelize.models['lwm2mResources']) {
      throw new Error("sequelize instance with model 'lwm2mResources' is required");
    }
    if (!Array.isArray(resources)) {
      throw new Error('resources must be an array');
    }

    // Normalize input: flatten nested object.resources into a flat {objectId,resourceId,...} list
    const flatResources = [];
    for (const entry of resources) {
      if (entry && Array.isArray(entry.resources)) {
        // Nested structure: object -> resources[]
        for (const res of entry.resources) {
          flatResources.push({
            objectId: entry.objectId,
            resourceId: res.resourceId,
            name: res.name,
            description: res.description
          });
        }
      } else if (
        entry &&
        typeof entry.objectId !== 'undefined' &&
        typeof entry.resourceId !== 'undefined'
      ) {
        // Already flat
        flatResources.push({
          objectId: entry.objectId,
          resourceId: entry.resourceId,
          name: entry.name,
          description: entry.description
        });
      } else {
        // Skip invalid entries but warn
        // eslint-disable-next-line no-console
        console.warn('Skipping invalid resource entry:', entry);
      }
    }

    const { lwm2mResources } = sequelize.models;

    const results = [];
    try {
      await sequelize.transaction(async (t) => {
        for (const res of flatResources) {
          const where = { objectId: res.objectId, resourceId: res.resourceId };

          // Try to find existing record
          const [record, created] = await lwm2mResources.findOrCreate({
            where,
            defaults: {
              name: res.name,
              description: res.description
            },
            transaction: t
          });

          if (!created) {
            // Update existing with latest values
            await record.update(
              { name: res.name, description: res.description },
              { transaction: t }
            );
          }

          results.push({
            objectId: res.objectId,
            resourceId: res.resourceId,
            created,
            updated: !created
          });
        }
      });

      // eslint-disable-next-line no-console
      console.log('Insert/Update completed for LwM2M Resources.');
      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error inserting/updating LwM2M Resources:', error.message);
      throw error;
    }
  }
};
