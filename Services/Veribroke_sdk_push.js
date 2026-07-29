// veribrokeService.js
import amqp from "amqplib";

const RABBITMQ_HOST=process.env.RABBITMQ_HOST 
const RABBITMQ_PASSWORD=process.env.RABBITMQ_PASSWORD
const RABBITMQ_PORT=process.env.RABBITMQ_PORT
const RABBITMQ_USER=process.env.RABBITMQ_USER
const RABBITMQ_VHOST=process.env.RABBITMQ_VHOST
const EXCHANGE_NAME=process.env.EXCHANGE_NAME || "io.opencrafts.veribroke-notifications"

const ROUTING_KEY=process.env.ROUTING_KEY || "veribroke.mpesa-stk"

export const sendPaymentRequest = async (data) => {
try {
  // RabbitMQ config
  const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST || '/'}`;
  const EXCHANGE_TYPE = "direct";

  // Connect to RabbitMQ
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // Declare exchange
  await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, { durable: true });

  // Publish message
  const message = Buffer.from(JSON.stringify(data));
  channel.publish(EXCHANGE_NAME, ROUTING_KEY, message, {
    contentType: "application/json",
    persistent: true,
  });

  // Close connection
  await channel.close();
  await connection.close();
} catch (error) {
  throw error;
}
};
