import amqp from "amqplib";
import { logs } from '../Utils/logs.js';
import crypto from 'crypto';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_PORT = process.env.RABBITMQ_PORT
const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST

export async function sendEmail(emailData, sourceServiceId, requestId = null) {
  const start = process.hrtime.bigint();
  
  try {
    // Validation
    if (!emailData.to_addresses || !emailData.to_addresses.length) {
      throw new Error('to_addresses is required and must have at least one recipient');
    }
    
    if (!emailData.subject) {
      throw new Error('subject is required');
    }
    
    if (!emailData.from_address || !emailData.from_address.endsWith('@posta.opencrafts.io')) {
      throw new Error('from_address must end with @posta.opencrafts.io');
    }
    
    // Validate email body or template
    const hasBody = emailData.body_html || emailData.body_text;
    const hasTemplate = emailData.template_id;
    
    if (!hasBody && !hasTemplate) {
      throw new Error('Either body_html/body_text OR template_id must be provided');
    }
    
    if (hasBody && hasTemplate) {
      throw new Error('Cannot provide both body content and template_id');
    }
    
    const EXCHANGE_NAME = 'gossip.topic.exchange';
    const ROUTING_KEY = 'gossip.emails.send';
    const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST || '/'}`;
    
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    
    // Generate request_id if not provided
    const finalRequestId = requestId || crypto.randomUUID();
    
    // Build the message
    const message = {
      email: {
        from_address: emailData.from_address,
        to_addresses: emailData.to_addresses,
        subject: emailData.subject
      },
      metadata: {
        event_type: 'email.send',
        timestamp: new Date().toISOString(),
        source_service_id: sourceServiceId,
        request_id: finalRequestId
      }
    };
    
    // Add optional email fields
    if (emailData.reply_to) message.email.reply_to = emailData.reply_to;
    if (emailData.cc_addresses) message.email.cc_addresses = emailData.cc_addresses;
    if (emailData.bcc_addresses) message.email.bcc_addresses = emailData.bcc_addresses;
    if (emailData.body_html) message.email.body_html = emailData.body_html;
    if (emailData.body_text) message.email.body_text = emailData.body_text;
    if (emailData.template_id) message.email.template_id = emailData.template_id;
    if (emailData.template_vars) message.email.template_vars = emailData.template_vars;
    if (emailData.attachments) message.email.attachments = emailData.attachments;
    
    const published = channel.publish(
      EXCHANGE_NAME,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(message)),
      { 
        persistent: true,
        messageId: finalRequestId,
        timestamp: Math.floor(Date.now() / 1000)
      }
    );
    
    await channel.close();
    await connection.close();
    
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;
    
    logs(
      durationMicroseconds,
      "INFO",
      'rabbitmq',
      'email',
      "Email published to Gossip Monger",
      finalRequestId,
      201,
      'email.send'
    );
    
    return published;
    
  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;
    
    logs(
      durationMicroseconds,
      "ERR",
      'rabbitmq',
      'email',
      "Failed to publish email",
      requestId || 'unknown',
      500,
      'email_publish_error',
      error.message
    );
    throw error;
  }
}

/**
 * Send a plain email (HTML or text)
 */
export async function sendPlainEmail({
  to_addresses,
  subject,
  body_html = null,
  body_text = null,
  from_address = null,
  reply_to = null,
  cc_addresses = null,
  bcc_addresses = null,
  attachments = null
}, sourceServiceId) {
  
  const defaultFrom = process.env.GOSSIP_FROM_ADDRESS || 'sherehe@posta.opencrafts.io';
  
  return sendEmail({
    from_address: from_address || defaultFrom,
    to_addresses,
    subject,
    body_html,
    body_text,
    reply_to,
    cc_addresses,
    bcc_addresses,
    attachments
  }, sourceServiceId);
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail({
  to_addresses,
  subject,
  template_id,
  template_vars = {},
  from_address = null,
  reply_to = null,
  cc_addresses = null,
  bcc_addresses = null,
  attachments = null,
}, sourceServiceId) {
  
  const defaultFrom = process.env.GOSSIP_FROM_ADDRESS || 'sherehe@posta.opencrafts.io';
  
  return sendEmail({
    from_address: from_address || defaultFrom,
    to_addresses,
    subject,
    template_id,
    template_vars,
    reply_to,
    cc_addresses,
    bcc_addresses,
    attachments
  }, sourceServiceId);
}