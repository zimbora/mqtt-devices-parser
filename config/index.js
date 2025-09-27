module.exports = {
  version : "0.0.0",
  dev : process.env.dev || "true",
  web:{
    protocol : process.env.HTTP_PROTOCOL  || "http://",
    domain: process.env.DOMAIN            || '10.168.1.162',
    port: process.env.WEB_PORT            || 8002,
  },
  mqtt: {
    protocol:process.env.MQTT_PROTOCOL || 'MQTT',
    host:process.env.MQTT_HOST || 'localhost',
    port:process.env.MQTT_PORT || '1883',
    user:process.env.MQTT_USER || 'admin',
    pwd:process.env.MQTT_PWD || 'admin',
    client:process.env.MQTT_CLIENT || 'mqtt-devices-parser',
    logs_path: process.env.MQTT_LOGS || 'uServices',
    parseMessages: process.env.MQTT_PARSE_MESSAGES !== 'false' // Default to true for backward compatibility
  },
  kafka: {
    enabled: process.env.KAFKA_ENABLED === 'true' ? true : true,
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    groupId: process.env.KAFKA_GROUP_ID || 'mqtt-devices-parser-group',
    clientId: process.env.KAFKA_CLIENT_ID || 'mqtt-devices-parser',
    sasl: {
      mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain', // plain, scram-sha-256, scram-sha-512
      username: process.env.KAFKA_SASL_USERNAME || '',
      password: process.env.KAFKA_SASL_PASSWORD || ''
    },
    ssl: process.env.KAFKA_SSL === 'true' ? true : false,
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 3000,
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000
  },
  mysqldb: {
    conn_limit: process.env.DB_CONN_LIMIT || 15,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'user',
    pwd: process.env.DB_PWD   || 'user_pwd',
    name: process.env.DB_NAME || 'mqtt-aedes',
  },
  sync_main_tables : process.env.sync_main_tables || true,
  projects: {
    demo : process.env.demo || false,
  },
  demo : { // not need anymore. Can be created on dashboard
    uidPrefix: 'uid:',
    uidLength: 16 // max len for uid
  }
}
