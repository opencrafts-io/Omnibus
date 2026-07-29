// utils/logs.js
import logger from './logger.js';

const logs = (
  durationMicroseconds,
  level,
  clientIp,
  method,
  msg,
  path,
  status,
  userAgent
) => {
  const timestamp = new Date().toISOString();

  const levelMap = {
    ERR: 'error',
    ERROR: 'error',
    INFO: 'info',
    WARN: 'warn',
    DEBUG: 'debug',
  };

  const logLevel = levelMap[level.toUpperCase()] || 'info';

  logger[logLevel]({
    timestamp,
    level: logLevel,
    client_ip: clientIp,
    duration: `${durationMicroseconds}μs`,
    method,
    msg,
    path,
    status,
    user_agent: userAgent,
  });
};

export { logs };
