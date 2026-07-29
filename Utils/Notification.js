import amqp from 'amqplib';
import dotenv from "dotenv";
dotenv.config(); 
const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST || '/'}`;
const EXCHANGE_NAME = process.env.G_EXCHANGE_NAME;
const ROUTING_KEY = process.env.G_ROUTING_KEY;

export async function sendNotification(payload) {
  let connection;
  let channel;

  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Ensure exchange exists
    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });

    // Publish notification payload
    channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(payload)),
      { contentType: 'application/json', persistent: true }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
  } finally {
    if (channel) await channel.close();
    if (connection) await connection.close();
  }
}
