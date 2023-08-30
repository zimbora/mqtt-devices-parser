module.exports = {
  version : "1.0.1",
  dev : process.env.dev || "true",
  web:{
    protocol : process.env.HTTP_PROTOCOL  || "http://",
    domain: process.env.DOMAIN            || '192.168.1.101',
    fw_path : '/api/firmware/'
  },
  mqtt: {
    protocol:process.env.MQTT_PROTOCOL || 'MQTT',
    host:process.env.MQTT_HOST || 'localhost',
    port:process.env.MQTT_PORT || '1883',
    user:process.env.MQTT_USER || 'admin',
    pwd:process.env.MQTT_PWD || 'admin',
    client:process.env.MQTT_CLIENT || 'mqtt-devices-parser'
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
    freeRTOS2 : process.env.freeRTOS2 || true,
    rtls_linux : process.env.rtls_linux || false,
  }
}
