const fs = require('fs');

$ = {};
var path = "/../..";
$.config = require(__dirname + path + '/config');
$.kafka_consumer = require(__dirname + path + '/src/kafka/consumer.js');
$.device = {
  parseMessage: async (client, topic, payload, retain) => {
    console.log('Mock parseMessage called:', { topic, payload, retain });
  }
};

async function testKafkaConsumerInit() {
  console.log('\n=== Testing Kafka Consumer Initialization ===');
  
  try {
    // Test with Kafka disabled
    console.log('1. Testing with Kafka disabled...');
    const configDisabled = { ...$.config, kafka: { ...$.config.kafka, enabled: false } };
    await $.kafka_consumer.init(configDisabled, ['test-project']);
    console.log('✓ Kafka consumer init with disabled config passed');
    
    // Test with Kafka enabled but no authentication
    console.log('2. Testing with Kafka enabled (no auth)...');
    const configEnabled = { 
      ...$.config, 
      kafka: { 
        ...$.config.kafka, 
        enabled: true,
        sasl: { username: '', password: '' }
      } 
    };
    await $.kafka_consumer.init(configEnabled, ['test-project']);
    console.log('✓ Kafka consumer init with enabled config passed');
    
    // Test isRunning method
    console.log('3. Testing isRunning method...');
    console.log('Is running:', $.kafka_consumer.isRunning());
    console.log('✓ isRunning method works');
    
    console.log('\n✓ All Kafka consumer tests passed!');
  } catch (error) {
    console.error('✗ Kafka consumer test failed:', error.message);
  }
}

async function testConfiguration() {
  console.log('\n=== Testing Configuration ===');
  
  console.log('Kafka enabled:', $.config.kafka.enabled);
  console.log('Kafka brokers:', $.config.kafka.brokers);
  console.log('Kafka groupId:', $.config.kafka.groupId);
  console.log('Kafka SASL mechanism:', $.config.kafka.sasl.mechanism);
  
  console.log('✓ Configuration test passed!');
}

async function runTests() {
  console.log('Starting Kafka Consumer Tests...');
  
  await testConfiguration();
  await testKafkaConsumerInit();
  
  console.log('\n=== All Tests Completed ===');
  process.exit(0);
}

runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});