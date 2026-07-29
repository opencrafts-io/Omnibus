import amqp from "amqplib";
import {createUserInstitutionRepository , deleteUserInstitutionRepository} from '../Repositories/user_institution.repository.js'
import { logs } from '../Utils/logs.js';
const RABBITMQ_HOST = process.env.RABBITMQ_HOST
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_PORT = process.env.RABBITMQ_PORT
const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST

// const EXCHANGE_NAME=process.env.EXCHANGE_NAME || "io.opencrafts.veribroke"

// const ROUTING_KEY=process.env.ROUTING_KEY || "veribroke.mpesa-stk"

export async function consumeUserInstitutionEvents() {
  const start = process.hrtime.bigint();

  try {
    const EXCHANGE_NAME = 'verisafe.events.topic';
    const ROUTING_KEY_PATTERN = 'user.institution.*';
    const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST || '/'}`;

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, ROUTING_KEY_PATTERN);

    channel.consume(q.queue, async (msg) => {
      if (msg.content) {
        const rawContent = msg.content.toString();

        try {
          const data = JSON.parse(rawContent);

          // Validation rules
          if (data.meta?.source_service_id !== 'io.opencrafts.verisafe') {
            return channel.ack(msg);
          }

          const validEvents = ['user.institution.connected', 'user.institution.disconnected'];
          if (!validEvents.includes(data.meta?.event_type)) {
            return channel.ack(msg);
          }

          const { account_id, institution_id } = data.institution_connection || {};
          if (!account_id || !institution_id || !data.meta?.request_id) {
            return channel.ack(msg);
          }

          // Process the event
          let result;
          if (data.meta.event_type === 'user.institution.connected') {
            result = await createUserInstitutionRepository({ 
              user_id: account_id, 
              institution_id 
            });
          } else if (data.meta.event_type === 'user.institution.disconnected') {
            result = await deleteUserInstitutionRepository(account_id, institution_id);
          }

          channel.ack(msg);

          const end = process.hrtime.bigint();
          const durationMicroseconds = Number(end - start) / 1000;

          logs(
            durationMicroseconds,
            "INFO",
            'rabbitmq',
            'event',
            "User Institution Connection Event Processed Successfully",
            data.meta.request_id,
            201,
            data.meta.event_type
          );

        } catch (err) {
          
          const end = process.hrtime.bigint();
          const durationMicroseconds = Number(end - start) / 1000;
          
          logs(
            durationMicroseconds,
            "ERR",
            'rabbitmq',
            'event',
            "Failed to process event",
            msg.properties?.messageId || 'unknown',
            500,
            'processing_error',
            err.message
          );

          channel.ack(msg);
        }
      }
    }, { noAck: false });

  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;
    logs(
      durationMicroseconds,
      "ERR",
      'rabbitmq',
      'event',
      "Failed to connect to RabbitMQ",
      'unknown',
      500,
      'connection_error',
      error.message
    );
  }
}
