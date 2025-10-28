
# mqtt-devices-parser

## NPM Module
  - MQTT parser
  - Parses topics coming from devices and updates data on dB
  - **NEW**: Kafka consumer support for multi-process message parsing

## Deploy
  ```
  parser.deploy(config,projectsPath);
  ```

## Run
  ```
  parser.init(config,projects);
  ```

## Examples
  check example path to see how to use this module

## UnitTest


## Dependencies

- mysql8.0
- MQTT
- **NEW**: Confluentic Kafka (optional)

## Front end
- Node service running the following [project](https://github.com/zimbora/mgmt-iot-web)

## Configuration

The default configuration uses ./config/index.js file\
In your program set the same struct and pass it as argument on the module init call.

An mqtt account will be created using the following settings
mqtt.user - mqtt user login
mqtt.pwd - mqtt pwd login

### Kafka Consumer Configuration (NEW)

The module now supports consuming messages from Kafka topics as an alternative or complement to MQTT. This enables multi-process message parsing using Kafka's shared subscription mechanism.

#### Environment Variables

**Kafka Settings:**
- `KAFKA_ENABLED` - Set to `'true'` to enable Kafka consumer (default: `false`)
- `KAFKA_BROKERS` - Comma-separated list of Kafka brokers (default: `'localhost:9092'`)
- `KAFKA_GROUP_ID` - Consumer group ID for shared subscriptions (default: `'mqtt-devices-parser-group'`)
- `KAFKA_CLIENT_ID` - Kafka client identifier (default: `'mqtt-devices-parser'`)

**Authentication (SASL):**
- `KAFKA_SASL_MECHANISM` - SASL mechanism: `'plain'`, `'scram-sha-256'`, `'scram-sha-512'` (default: `'plain'`)
- `KAFKA_SASL_USERNAME` - SASL username (default: empty)
- `KAFKA_SASL_PASSWORD` - SASL password (default: empty)

**Security:**
- `KAFKA_SSL_ENABLED` - Set to `'true'` to enable SSL (default: `false`)

**Connection Settings:**
- `KAFKA_CONNECTION_TIMEOUT` - Connection timeout in ms (default: `3000`)
- `KAFKA_REQUEST_TIMEOUT` - Request timeout in ms (default: `30000`)

**MQTT Parsing Control:**
- `MQTT_PARSE_MESSAGES` - Set to `'false'` to disable direct MQTT message parsing (default: `true`)

#### Usage Examples

**Example 1: Use Kafka with SSL and SCRAM-SHA-256 authentication - Most Secure**
```bash
export KAFKA_SSL_ENABLED=true
export KAFKA_SSL_CERTFILE='./certs/ca.cert'
export KAFKA_SSL_REJECT_UNAUTHORIZED=true
export KAFKA_BROKERS=kafka1:9092,kafka2:9092
export KAFKA_SASL_USERNAME=myuser
export KAFKA_SASL_PASSWORD=mypassword
export KAFKA_SASL_MECHANISM=scram-sha-256
```
**Example 2: Use Kafka with SSL No trust and SCRAM-SHA-256 authentication.
Prone to MITM attacks**
```bash
export KAFKA_SSL_ENABLED=true
export KAFKA_SSL_CERTFILE=''
export KAFKA_SSL_REJECT_UNAUTHORIZED=false
export KAFKA_BROKERS=kafka1:9092,kafka2:9092
export KAFKA_SASL_USERNAME=myuser
export KAFKA_SASL_PASSWORD=mypassword
export KAFKA_SASL_MECHANISM=scram-sha-256
```
**Example 3: Use Kafka without SSL and SCRAM-SHA-256 authentication. Basic authentication with no encryption. Credentials are not shared**
```bash
export KAFKA_SSL_ENABLED=false
export KAFKA_SSL_CERTFILE=''
export KAFKA_SSL_REJECT_UNAUTHORIZED=true
export KAFKA_BROKERS=kafka1:9092,kafka2:9092
export KAFKA_SASL_USERNAME=myuser
export KAFKA_SASL_PASSWORD=mypassword
export KAFKA_SASL_MECHANISM=scram-sha-256
```

**Example 4: Use KAFKA without authentication. Not secure at all**
```bash
export KAFKA_ENABLED=true
export KAFKA_SSL_ENABLED=false
export KAFKA_SASL_USERNAME=''
export KAFKA_SASL_PASSWORD=''
```

**Example 5: KAFKA Multi-process deployment**
```bash
# Start multiple instances with the same group ID for load balancing
export KAFKA_ENABLED=true
export KAFKA_GROUP_ID=my-parser-group
export KAFKA_BROKERS=kafka1:9092,kafka2:9092
# Each process will consume different partitions automatically
```

**Example 6: Use MQTT only (disable KAFKA parsing)**
```bash
export KAFKA_ENABLED=false
```

#### Kafka Topic Structure

Kafka topics should correspond to project names configured in your `projects` array. Messages are expected to have:

- **Topic**: The project name (e.g., `demo`, `freeRTOS2`)
- **Key**: Device path part (e.g., `uid:123/status`)
- **Value**: Message payload (same format as MQTT payloads)

The consumer will automatically format messages as `{project}/{key}` to match the expected MQTT topic structure.

#### Shared Subscriptions

When multiple instances use the same `KAFKA_GROUP_ID`, Kafka automatically distributes messages across consumers, enabling:

- **Load balancing**: Messages are distributed across multiple parser instances
- **High availability**: If one instance fails, others continue processing
- **Scalability**: Add more instances to handle increased load

#### Message Flow

1. **MQTT Mode** (traditional): MQTT messages → `$.device.parseMessage`
2. **Kafka Mode**: Kafka messages → Topic formatting → `$.device.parseMessage`  
3. **Hybrid Mode**: Both MQTT and Kafka messages → `$.device.parseMessage`
