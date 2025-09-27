const { Kafka, logLevel } = require('kafkajs');

var kafka = null;
var consumer = null;
var running = false;

var self = module.exports = {

  init: async (config, projects) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!config.kafka.enabled) {
          console.log("Kafka consumer is disabled");
          return resolve();
        }

        console.log("Initializing Kafka consumer...");

        // Build Kafka configuration
        const kafkaConfig = {
          clientId: config.kafka.clientId,
          brokers: config.kafka.brokers,
          connectionTimeout: config.kafka.connectionTimeout,
          requestTimeout: config.kafka.requestTimeout,
          logLevel: logLevel.INFO
        };

        // Add SASL authentication if credentials provided
        if (config.kafka.sasl.username && config.kafka.sasl.password) {
          kafkaConfig.sasl = {
            mechanism: config.kafka.sasl.mechanism,
            username: config.kafka.sasl.username,
            password: config.kafka.sasl.password
          };
        }

        // Add SSL configuration if enabled
        if (config.kafka.ssl) {
          kafkaConfig.ssl = true;
        }

        kafka = new Kafka(kafkaConfig);

        // Create consumer with shared subscription support
        consumer = kafka.consumer({
          groupId: config.kafka.groupId,
          sessionTimeout: 30000,
          rebalanceTimeout: 60000,
          heartbeatInterval: 3000,
          maxBytesPerPartition: 1048576,
          minBytes: 1,
          maxBytes: 10485760,
          maxWaitTimeInMs: 5000,
          retry: {
            initialRetryTime: 100,
            retries: 8
          }
        });

        // Subscribe to project topics
        const topics = projects.map(project => project.toString());
        
        if (topics.length === 0) {
          console.log("No Kafka topics to subscribe to");
          return resolve();
        }

        await consumer.subscribe({ 
          topics: topics,
          fromBeginning: false 
        });

        console.log(`Kafka consumer subscribed to topics: ${topics.join(', ')}`);

        return resolve();
      } catch (error) {
        console.error("Failed to initialize Kafka consumer:", error);
        return reject(error);
      }
    });
  },

  start: async () => {
    if (!consumer || running) {
      return;
    }

    try {
      console.log("Starting Kafka consumer...");
      running = true;

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const payload = message.value ? message.value.toString() : '';
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

            console.log(`Kafka message received - Topic: ${formattedTopic}, Payload: ${payload}`);

            // Call the device parser with formatted topic
            await $.device.parseMessage(null, formattedTopic, payload, false);

          } catch (error) {
            console.error('Error processing Kafka message:', error);
          }
        },
      });

      console.log("Kafka consumer started successfully");
    } catch (error) {
      console.error("Failed to start Kafka consumer:", error);
      running = false;
      throw error;
    }
  },

  stop: async () => {
    if (!consumer || !running) {
      return;
    }

    try {
      console.log("Stopping Kafka consumer...");
      running = false;
      await consumer.stop();
      await consumer.disconnect();
      console.log("Kafka consumer stopped successfully");
    } catch (error) {
      console.error("Error stopping Kafka consumer:", error);
    }
  },

  isRunning: () => {
    return running;
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  if (running) {
    console.log('Received SIGINT, gracefully shutting down Kafka consumer...');
    await self.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (running) {
    console.log('Received SIGTERM, gracefully shutting down Kafka consumer...');
    await self.stop();
  }
  process.exit(0);
});