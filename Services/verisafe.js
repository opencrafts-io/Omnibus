// Services/rabbitmq.js
import amqp from 'amqplib';
import { createUserRepository, updateUserRepository } from '../Repositories/User.repository.js';
import { logs } from '../Utils/logs.js';
import dotenv from "dotenv";
dotenv.config(); 

const RABBIT_URL = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}${process.env.RABBITMQ_VHOST || '/'}`;

const QUEUE_NAME = process.env.V_QUEUE_NAME;
const EXCHANGE_NAME = process.env.V_EXCHANGE_NAME;
const ROUTING_KEY = process.env.V_ROUTING_KEY;

export const startVerisafeListener = async () => {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    channel.consume(QUEUE_NAME, async msg => {
      if (!msg) return;

      const data = msg.content.toString();
      await processVerisafeEvent(JSON.parse(data));

      channel.ack(msg);
    });
  } catch (error) {
    console.error("❌ RabbitMQ connection failed:", error);
    channel.nack(msg, false, false);
  }
};


export const processVerisafeEvent = async (event) => {
  const start = process.hrtime.bigint();

  try {
    const { event_type } = event.meta;
    const { id, email, username, name, phone } = event.user;

    if (event_type === "user.created") {
      await createUserRepository({ id, email, username, name, phone });

      logEvent(start, "User created successfully");
    }

    if (event_type === "user.updated") {
      await updateUserRepository(id, { email, username, name, phone });

      logEvent(start, "User updated successfully");
    }

  } catch (error) {
    console.error("Error processing event:", error.message);
  }
};


const logEvent = (start, message) => {
  const end = process.hrtime.bigint();
  const durationMicroseconds = Number(end - start) / 1000;

  logs(
    durationMicroseconds,
    "INFO",
    "0.0.0.0",            
    "RABBIT_EVENT", 
    message,
    "/rabbitmq/event",
    200,
    "RabbitMQ Listener"
  );
};
