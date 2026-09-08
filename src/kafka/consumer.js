const logger = require('../logger').child({ label: 'Kafka' });
const { Kafka, logLevel } = require('kafkajs');
const fs = require('fs');

var kafka = null;
var consumer = null;
var running = false;

var self = module.exports = {

  init: async (config, projects) => {

    return new Promise(async (resolve, reject) => {
      try {
        if (!config.kafka.enabled) {
          logger.info("[Kafka] consumer is disabled");
          return resolve();
        }

        logger.info("[Kafka] Initializing consumer...");

        // Generate a random 6-digit number
        const randomNumber = Math.floor(100000 + Math.random() * 900000);

        // Build Kafka configuration
        const kafkaConfig = {
          clientId: `${config.kafka.clientId}-${randomNumber}`,
          brokers: config.kafka.brokers,
          connectionTimeout: config.kafka.connectionTimeout,
          requestTimeout: config.kafka.requestTimeout,
          logLevel: logLevel.INFO
        };

        if(config.kafka.ssl.enabled === true){
          logger.info("[Kafka] Try to establish SSL connection..");
          if(config.kafka.ssl.rejectUnauthorized){
            // check certificate. Most secure
            kafkaConfig.ssl = {
              ca: [fs.readFileSync(config.kafka.ssl.file, 'utf8')],
              rejectUnauthorized: config.kafka.ssl.rejectUnauthorized
            }
           }else{
            // trust certificate. Prone to MITM attacks
            kafkaConfig.ssl = {
              rejectUnauthorized: config.kafka.ssl.rejectUnauthorized
            }
          }
        }

        // Add SASL authentication if credentials provided
        if (config.kafka.sasl.username && config.kafka.sasl.password) {
          logger.info("[Kafka] SASL: username and password are defined");
          kafkaConfig.sasl = {
            mechanism: config.kafka.sasl.mechanism,
            username: config.kafka.sasl.username,
            password: config.kafka.sasl.password
          };
        }

        kafka = new Kafka(kafkaConfig);

        let kafkaGroupId = "";
        if(config.env === 'development'){
          const n = Math.floor(Math.random() * 1000) + 1; // 1..1000
          kafkaGroupId = `${config.kafka.groupId}-${String(n)}`;
        }else{
          kafkaGroupId = config.kafka.groupId;
        }

        // Create consumer with shared subscription support
        consumer = kafka.consumer({
          groupId: kafkaGroupId,
          sessionTimeout: 30000,
          rebalanceTimeout: 60000,
          heartbeatInterval: 3000,
          maxBytesPerPartition: 1048576,
          minBytes: 1,
          maxBytes: 10485760,
          maxWaitTimeInMs: 5000,
          retry: {
            initialRetryTime: 300,
            retries: 8
          }
        });

        // Subscribe to project topics
        const topics = projects.map(project => project.toString());
        
        if (topics.length === 0) {
          logger.info("[Kafka] No topics to subscribe to");
          return resolve();
        }

        await consumer.subscribe({ 
          topics: topics,
          fromBeginning: false 
        });

        logger.info(`[Kafka] consumer subscribed to topics: ${topics.join(', ')}`);

        return resolve();
      } catch (error) {
        logger.error("[Kafka] Failed to initialize consumer:", error);
        return reject(error);
      }
    });
  },

  start: async () => {
    if (!consumer || running) {
      return;
    }

    try {
      logger.info("[Kafka] Starting consumer...");
      running = true;

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {

          logger.info(`[KAFKA] rx: ${message.key.toString()}`);

          try {
            let payload = message.value ? message.value.toString() : '';
            const kafkaTopic = topic.toString();
            
            // Format message to look like MQTT format for compatibility
            // Kafka topic becomes the project name, message key becomes the device path
            const messageKey = message.key ? message.key.toString() : '';
            
            let formattedTopic;
            if (messageKey) {
              // If message has a key, use it as the device path: project/device_path
              formattedTopic = `${kafkaTopic}/${messageKey}`;
            } else {
              // If no key, try to extract from headers or use a default format
              const headers = message.headers || {};
              const devicePath = headers.device_path ? headers.device_path.toString() : 'unknown';
              formattedTopic = `${kafkaTopic}/${devicePath}`;
            }

            try{
              payload = JSON.parse(payload);
              //logger.info(`[KAFKA] payload: ${payload.mqtt.payload}`);
            }catch(error){
              logger.info(`[KAFKA] error: ${payload}`);
              logger.info(error)
            }

            // Call the device parser with formatted topic
            await $.device.parseMessage(payload.client.id, formattedTopic, JSON.stringify(payload.mqtt.payload), payload.mqtt.retain);

          } catch (error) {
            logger.error('[Kafka] Error processing message:', {
              topic: topic.toString(),
              partition,
              offset: message.offset ? message.offset.toString() : 'unknown',
              error: error.message
            });
          }
        },
      });

      logger.info("[Kafka] consumer started successfully");
    } catch (error) {
      logger.error("[KAFKA] Failed to start consumer:", error);
      running = false;
      throw error;
    }
  },

  stop: async () => {
    if (!consumer || !running) {
      return;
    }

    try {
      logger.info("[KAFKA] Stopping consumer...");
      running = false;
      await consumer.stop();
      await consumer.disconnect();
      logger.info("[KAFKA] consumer stopped successfully");
    } catch (error) {
      logger.error("[KAFKA] Error stopping consumer:", error);
    }
  },

  isRunning: () => {
    return running;
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  if (running) {
    logger.info('Received SIGINT, gracefully shutting down Kafka consumer...');
    await self.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (running) {
    logger.info('Received SIGTERM, gracefully shutting down Kafka consumer...');
    await self.stop();
  }
  process.exit(0);
});