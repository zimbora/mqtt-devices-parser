module.exports = {
  version : "0.0.0",
  dev : process.env.dev || "true",
  web:{
    protocol : process.env.HTTP_PROTOCOL  || "http://",
    domain: process.env.DOMAIN            || '192.168.1.1',
  },
  mqtt: {
    protocol:process.env.MQTT_PROTOCOL || 'MQTT',
    host:process.env.MQTT_HOST || 'localhost',
    port:process.env.MQTT_PORT || '1883',
    user:process.env.MQTT_USER || 'admin',
    pwd:process.env.MQTT_PWD || 'admin',
    client:process.env.MQTT_CLIENT || 'mqtt-devices-parser',
    logs_path: process.env.MQTT_LOGS || 'uServices'
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
  }
}
