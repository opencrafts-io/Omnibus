import amqp from "amqplib";
import {
  createInstitutionRepository,
  updateInstitutionRepository,
  deleteInstitutionRepository
} from '../Repositories/institution.repository.js'
import { logs } from "../Utils/logs.js";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD;
const RABBITMQ_PORT = process.env.RABBITMQ_PORT;
const RABBITMQ_USER = process.env.RABBITMQ_USER;
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST || "/";

const EXCHANGE_NAME = "professor.exchange";
const EXCHANGE_TYPE = "direct";
const ROUTING_KEY = "institution.events";
const QUEUE_NAME = "user-service.institution.events";

export async function consumeInstitutionEvents() {
  try {
    const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST}`;

    const connection = await amqp.connect(RABBITMQ_URL);

    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, EXCHANGE_TYPE, {
      durable: true,
    });

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    await channel.bindQueue(
      QUEUE_NAME,
      EXCHANGE_NAME,
      ROUTING_KEY
    );

    channel.prefetch(1);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) return;

        const start = process.hrtime.bigint();

        try {
          const payload = JSON.parse(msg.content.toString());


          const metadata = payload.metadata;
          const institution = payload.institution;

          if (!metadata || !institution) {
            return channel.ack(msg);
          }

          if (
            metadata.source_service_id !==
            "io.opencrafts.verisafe"
          ) {
            return channel.ack(msg);
          }

          switch (metadata.event_type) {
            case "institution.created":

              await createInstitutionRepository(institution)


              break;

            case "institution.updated":

              await updateInstitutionRepository(institution.id, institution)

              break;

            case "institution.deleted":

              await deleteInstitutionRepository(institution.id)

              break;

            default:
              break;
          }

          channel.ack(msg);

          const end = process.hrtime.bigint();

          const durationMicroseconds =
            Number(end - start) / 1000;

          logs(
            durationMicroseconds,
            "INFO",
            "rabbitmq",
            "event",
            "Institution Event Processed Successfully",
            metadata.request_id,
            200,
            metadata.event_type
          );
        } catch (err) {

          const end = process.hrtime.bigint();

          const durationMicroseconds =
            Number(end - start) / 1000;

          logs(
            durationMicroseconds,
            "ERR",
            "rabbitmq",
            "event",
            "Failed to process Institution Event",
            "unknown",
            500,
            "processing_error",
            err.message
          );

          channel.ack(msg);
        }
      },
      {
        noAck: false,
      }
    );
  } catch (err) {
             logs(
            1,
            "ERR",
            "rabbitmq",
            "event",
            "Rabbitmq error",
            "unknown",
            500,
            "processing_error",
            err.message
          );
  }
}
