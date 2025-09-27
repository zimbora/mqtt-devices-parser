/**
 * Example showing how to use mqtt-devices-parser with Kafka consumer support
 * 
 * This example demonstrates:
 * 1. Traditional MQTT-only mode
 * 2. Kafka-only mode 
 * 3. Hybrid mode (both MQTT and Kafka)
 */

const parser = require('../index.js');
const fs = require('fs');

global.BASE_DIR = process.cwd();

// Example configuration with Kafka support
const configWithKafka = {
  version: "1.0.0",
  dev: true,
  web: {
    protocol: "http://",
    domain: 'localhost',
    port: 8002,
  },
  mqtt: {
    protocol: 'MQTT',
    host: 'localhost',
    port: '1883',
    user: 'admin',
    pwd: 'admin',
    client: 'mqtt-devices-parser-example',
    logs_path: 'uServices',
    parseMessages: true // Set to false to disable MQTT message parsing
  },
  kafka: {
    enabled: true, // Enable Kafka consumer
    brokers: ['localhost:9092'], // Your Kafka brokers
    groupId: 'mqtt-devices-parser-group',
    clientId: 'mqtt-devices-parser-client',
    sasl: {
      mechanism: 'plain', // or 'scram-sha-256', 'scram-sha-512'
      username: '', // Your Kafka username
      password: ''  // Your Kafka password
    },
    ssl: false, // Set to true for SSL/TLS
    connectionTimeout: 3000,
    requestTimeout: 30000
  },
  mysqldb: {
    conn_limit: 15,
    host: 'localhost',
    port: 3306,
    user: 'user',
    pwd: 'user_pwd',
    name: 'mqtt-aedes',
  },
  sync_main_tables: true,
  projects: {
    demo: true,
    // Add your project names here
    // These will become Kafka topic names when Kafka is enabled
  },
  demo: {
    uidPrefix: 'uid:',
    uidLength: 16
  }
};

// Example: MQTT-only configuration (traditional mode)
const configMQTTOnly = {
  ...configWithKafka,
  kafka: {
    ...configWithKafka.kafka,
    enabled: false // Disable Kafka
  },
  mqtt: {
    ...configWithKafka.mqtt,
    parseMessages: true // Keep MQTT parsing enabled
  }
};

// Example: Kafka-only configuration
const configKafkaOnly = {
  ...configWithKafka,
  kafka: {
    ...configWithKafka.kafka,
    enabled: true // Enable Kafka
  },
  mqtt: {
    ...configWithKafka.mqtt,
    parseMessages: false // Disable MQTT parsing
  }
};

// Load projects from directories
var projectsPath = '../projects/';
var projects = [];

try {
  fs.readdirSync(projectsPath)
    .filter((file) => {
      return (file.indexOf('.') == -1);
    })
    .forEach((project) => {
      if (configWithKafka.projects[project]) {
        projects.push(project);
      }
    });
} catch (error) {
  console.log('Projects directory not found, using default projects');
  projects = ['demo'];
}

async function runExample() {
  try {
    console.log('=== MQTT Devices Parser with Kafka Support Example ===\n');
    
    // Choose which configuration to use
    const selectedConfig = configWithKafka; // Change this to test different modes
    
    console.log('Configuration mode:');
    console.log('- MQTT parsing enabled:', selectedConfig.mqtt.parseMessages);
    console.log('- Kafka consumer enabled:', selectedConfig.kafka.enabled);
    console.log('- Projects:', projects.join(', '));
    console.log();
    
    if (selectedConfig.kafka.enabled) {
      console.log('Kafka configuration:');
      console.log('- Brokers:', selectedConfig.kafka.brokers.join(', '));
      console.log('- Group ID:', selectedConfig.kafka.groupId);
      console.log('- SASL enabled:', !!(selectedConfig.kafka.sasl.username && selectedConfig.kafka.sasl.password));
      console.log();
    }
    
    // Initialize the parser
    console.log('Initializing parser...');
    await parser.init(selectedConfig, projects);
    
    console.log('Parser initialized successfully!');
    console.log();
    
    if (selectedConfig.kafka.enabled) {
      console.log('Kafka consumer is running and listening for messages on topics:', projects.join(', '));
      console.log('Send messages to these Kafka topics with format:');
      console.log('- Topic: <project_name> (e.g., "demo")');
      console.log('- Key: <device_path> (e.g., "uid:123/status")');
      console.log('- Value: <message_payload> (e.g., "online")');
      console.log();
    }
    
    if (selectedConfig.mqtt.parseMessages) {
      console.log('MQTT client is connected and parsing messages');
      console.log('Subscribed to MQTT topics:', projects.map(p => p + '/#').join(', '));
      console.log();
    }
    
    console.log('Press Ctrl+C to stop...');
    
    // Keep the process running
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\nShutting down gracefully...');
        resolve();
      });
    });
    
  } catch (error) {
    console.error('Error running example:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (configWithKafka.dev) {
    process.exit(1);
  }
});

// Run the example
runExample();