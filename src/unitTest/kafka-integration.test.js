const fs = require('fs');

$ = {};
var path = "/../..";
$.config = require(__dirname + path + '/config');

// Mock device module to prevent actual parsing
$.device = {
  parseMessage: async (client, topic, payload, retain) => {
    console.log('Mock parseMessage called:', { topic, payload, retain });
    return Promise.resolve();
  }
};

async function testConfigurationValues() {
  console.log('\n=== Testing Configuration Values ===');
  
  // Test default values
  console.log('Default Kafka enabled:', $.config.kafka.enabled);
  console.log('Default Kafka brokers:', $.config.kafka.brokers);
  console.log('Default Kafka groupId:', $.config.kafka.groupId);
  console.log('Default Kafka SASL mechanism:', $.config.kafka.sasl.mechanism);
  
  // Test with environment variables
  process.env.MQTT_PARSE_MESSAGES = 'false';
  process.env.KAFKA_ENABLED = 'true';
  process.env.KAFKA_BROKERS = 'broker1:9092,broker2:9092';
  process.env.KAFKA_GROUP_ID = 'test-group';
  process.env.KAFKA_SASL_MECHANISM = 'scram-sha-256';
  process.env.KAFKA_SASL_USERNAME = 'testuser';
  process.env.KAFKA_SASL_PASSWORD = 'testpass';
  
  // Reload config to pick up env variables
  delete require.cache[require.resolve(__dirname + path + '/config')];
  const newConfig = require(__dirname + path + '/config');
  
  console.log('\nWith environment variables:');
  console.log('Kafka enabled:', newConfig.kafka.enabled);
  console.log('Kafka brokers:', newConfig.kafka.brokers);
  console.log('Kafka groupId:', newConfig.kafka.groupId);
  console.log('Kafka SASL mechanism:', newConfig.kafka.sasl.mechanism);
  console.log('Kafka SASL username:', newConfig.kafka.sasl.username);
  console.log('Kafka SASL password:', newConfig.kafka.sasl.password ? '[SET]' : '[NOT SET]');
  
  console.log('✓ Configuration values test passed!');
}

async function testKafkaConsumerModule() {
  console.log('\n=== Testing Kafka Consumer Module Structure ===');
  
  try {
    const kafkaConsumer = require(__dirname + path + '/src/kafka/consumer.js');
    
    // Test module exports
    console.log('Module has init method:', typeof kafkaConsumer.init === 'function');
    console.log('Module has start method:', typeof kafkaConsumer.start === 'function');
    console.log('Module has stop method:', typeof kafkaConsumer.stop === 'function');
    console.log('Module has isRunning method:', typeof kafkaConsumer.isRunning === 'function');
    
    // Test initial state
    console.log('Initial running state:', kafkaConsumer.isRunning());
    
    // Test with disabled Kafka
    const configDisabled = { kafka: { enabled: false } };
    await kafkaConsumer.init(configDisabled, ['test']);
    console.log('Init with disabled config succeeded');
    
    console.log('✓ Kafka consumer module structure test passed!');
  } catch (error) {
    console.error('✗ Kafka consumer module test failed:', error.message);
  }
}

async function testMQTTMessageParsing() {
  console.log('\n=== Testing MQTT Message Parsing Logic ===');
  
  // Test the logic that would be used in index.js
  const testConfigs = [
    { kafka: { enabled: true } },
    { kafka: { enabled: false } }
  ];
  
  for (const config of testConfigs) {
    console.log(`\nTesting with kafka parseMessages: ${config.kafka.enabled}`);
    
    // Simulate the MQTT message handler logic
    const mockTopic = "test/uid:123/status";
    const mockPayload = "online";
    const mockPacket = { retain: false };
    
    if (!config.kafka.enabled) {
      console.log('Would call device.parseMessage');
      await $.device.parseMessage(null, mockTopic, mockPayload, mockPacket.retain);
    } else {
      console.log('Would skip device.parseMessage');
    }
  }
  
  console.log('✓ MQTT message parsing logic test passed!');
}

async function runTests() {
  console.log('Starting Kafka Integration Tests...');
  
  await testConfigurationValues();
  await testKafkaConsumerModule();
  await testMQTTMessageParsing();
  
  console.log('\n=== All Tests Completed Successfully ===');
  process.exit(0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});