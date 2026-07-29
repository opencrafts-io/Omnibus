import amqp from "amqplib";
import { logs } from '../Utils/logs.js';
import crypto from 'crypto';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD
const RABBITMQ_PORT = process.env.RABBITMQ_PORT
const RABBITMQ_USER = process.env.RABBITMQ_USER
const RABBITMQ_VHOST = process.env.RABBITMQ_VHOST
export async function sendPushNotification(notificationData, sourceServiceId, requestId = null) {
  const start = process.hrtime.bigint();

  try {
    // Validation
    if (!sourceServiceId || !sourceServiceId.startsWith('io.opencrafts.')) {
      throw new Error('source_service_id must start with io.opencrafts.');
    }

    if (!notificationData.headings || !notificationData.headings.en) {
      throw new Error('headings.en is required');
    }

    if (!notificationData.contents || !notificationData.contents.en) {
      throw new Error('contents.en is required');
    }

    if (!notificationData.target_user_id) {
      throw new Error('target_user_id is required');
    }

    const targetingFields = [
      'included_segments',
      'excluded_segments',
      'include_external_user_ids',
      'include_email_tokens',
      'include_phone_numbers',
      'include_ios_tokens',
      'include_android_reg_ids',
      'include_chrome_web_reg_ids',
      'include_firebase_reg_ids',
      'include_amazon_reg_ids',
      'include_windows_phone_reg_ids',
      'include_chrome_reg_ids'
    ];

    const hasTargeting = targetingFields.some(field =>
      notificationData[field] && notificationData[field].length > 0
    );

    if (!hasTargeting) {
      throw new Error('At least one targeting field (included_segments, include_external_user_ids, etc.) is required');
    }

    // Validate ttl if provided (safely ignoring null or undefined values)
    if (notificationData.ttl !== undefined && notificationData.ttl !== null) {
      if (notificationData.ttl < 1 || notificationData.ttl > 2592000) {
        throw new Error('ttl must be between 1 and 2,592,000 seconds (30 days)');
      }
    }
    // Validate send_after if provided
    if (notificationData.send_after) {
      const sendAfterDate = new Date(notificationData.send_after);
      if (isNaN(sendAfterDate.getTime())) {
        throw new Error('send_after must be a valid ISO 8601 timestamp');
      }
      if (sendAfterDate <= new Date()) {
        throw new Error('send_after must be a future date');
      }
    }

    // Validate external user IDs count
    const externalUserIds = notificationData.include_external_user_ids || [];
    if (externalUserIds.length >= 2000) {
      throw new Error('Total external user IDs (including target_user_id) must not exceed 2,000');
    }

    const EXCHANGE_NAME = 'gossip.topic.exchange';
    const ROUTING_KEY = 'gossip.push.send';
    const RABBITMQ_URL = `amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}${RABBITMQ_VHOST || '/'}`;

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

    // Generate request_id if not provided
    const finalRequestId = requestId || crypto.randomUUID();

    // Build the notification object
    const notification = {
      headings: notificationData.headings,
      contents: notificationData.contents,
      target_user_id: notificationData.target_user_id
    };

    // Add optional content fields
    const optionalFields = [
      'subtitle', 'big_picture', 'large_icon', 'small_icon', 'data',
      'buttons', 'url', 'web_url', 'app_url', 'send_after',
      'delayed_option', 'ttl', 'priority',
      'included_segments', 'excluded_segments', 'include_external_user_ids',
      'include_email_tokens', 'include_phone_numbers', 'include_ios_tokens',
      'include_android_reg_ids', 'include_chrome_web_reg_ids',
      'include_firebase_reg_ids', 'include_amazon_reg_ids',
      'include_windows_phone_reg_ids', 'include_chrome_reg_ids'
    ];

    optionalFields.forEach(field => {
      if (notificationData[field] !== undefined && notificationData[field] !== null) {
        notification[field] = notificationData[field];
      }
    });

    // Build the complete message
    const message = {
      metadata: {
        event_type: 'push.send',
        timestamp: new Date().toISOString(),
        source_service_id: sourceServiceId,
        request_id: finalRequestId
      },
      notification: notification
    };

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
      'push',
      "Push notification published to Gossip Monger",
      finalRequestId,
      201,
      'push.send'
    );

    return published;

  } catch (error) {
    const end = process.hrtime.bigint();
    const durationMicroseconds = Number(end - start) / 1000;

    logs(
      durationMicroseconds,
      "ERR",
      'rabbitmq',
      'push',
      "Failed to publish push notification",
      requestId || 'unknown',
      500,
      'push_publish_error',
      error.message
    );

    throw error;
  }
}

/**
 * Send a simple push notification to a segment
 */
export async function sendSegmentPushNotification({
  headings,
  contents,
  target_user_id,
  included_segments = ['Active Users'],
  subtitle = null,
  data = null,
  url = null,
  send_after = null,
  ttl = null
}, sourceServiceId) {

  return sendPushNotification({
    headings: typeof headings === 'string' ? { en: headings } : headings,
    contents: typeof contents === 'string' ? { en: contents } : contents,
    target_user_id,
    included_segments,
    subtitle: subtitle ? (typeof subtitle === 'string' ? { en: subtitle } : subtitle) : undefined,
    data,
    url,
    send_after,
    ttl
  }, sourceServiceId);
}

export async function sendUserPushNotification({
  headings,
  contents,
  target_user_id,
  include_external_user_ids = [],
  subtitle = null,
  data = null,
  buttons = null,
  url = null,
  app_url = null,
  send_after = null,
  ttl = null
}, sourceServiceId) {

  // Ensure target_user_id is not duplicated in external_user_ids
  const externalIds = [...new Set([target_user_id, ...include_external_user_ids])];

  if (externalIds.length > 2000) {
    throw new Error('Total external user IDs cannot exceed 2,000');
  }

  return sendPushNotification({
    headings: typeof headings === 'string' ? { en: headings } : headings,
    contents: typeof contents === 'string' ? { en: contents } : contents,
    target_user_id,
    include_external_user_ids: externalIds,
    subtitle: subtitle ? (typeof subtitle === 'string' ? { en: subtitle } : subtitle) : undefined,
    data,
    buttons,
    url,
    app_url,
    send_after,
    ttl
  }, sourceServiceId);
}


export async function sendInteractivePushNotification({
  headings,
  contents,
  target_user_id,
  buttons,
  included_segments = ['Active Users'],
  data = null,
  url = null,
  ttl = null
}, sourceServiceId) {

  if (!buttons || !buttons.length) {
    throw new Error('Buttons array is required for interactive notifications');
  }

  // Validate buttons structure
  buttons.forEach((button, index) => {
    if (!button.id || !button.text) {
      throw new Error(`Button at index ${index} must have both id and text`);
    }
  });

  return sendPushNotification({
    headings: typeof headings === 'string' ? { en: headings } : headings,
    contents: typeof contents === 'string' ? { en: contents } : contents,
    target_user_id,
    included_segments,
    buttons,
    data,
    url,
    ttl
  }, sourceServiceId);
}

export async function schedulePushNotification({
  headings,
  contents,
  target_user_id,
  send_after,
  included_segments = ['Active Users'],
  ttl = 86400, // Default 24 hours
  data = null,
  delayed_option = 'timezone'
}, sourceServiceId) {

  if (!send_after) {
    throw new Error('send_after timestamp is required for scheduled notifications');
  }

  const sendAfterDate = new Date(send_after);
  if (sendAfterDate <= new Date()) {
    throw new Error('send_after must be a future date');
  }

  return sendPushNotification({
    headings: typeof headings === 'string' ? { en: headings } : headings,
    contents: typeof contents === 'string' ? { en: contents } : contents,
    target_user_id,
    included_segments,
    send_after,
    ttl,
    data,
    delayed_option
  }, sourceServiceId);
}