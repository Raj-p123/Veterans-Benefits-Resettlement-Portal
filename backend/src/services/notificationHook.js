import EventEmitter from 'events';

class ApplicationNotificationEmitter extends EventEmitter {}

export const notificationEmitter = new ApplicationNotificationEmitter();

export const NOTIFICATION_EVENTS = {
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  APPLICATION_STATUS_CHANGED: 'APPLICATION_STATUS_CHANGED',
  APPLICATION_WITHDRAWN: 'APPLICATION_WITHDRAWN',
  APPLICATION_APPROVED: 'APPLICATION_APPROVED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
};

/**
 * Emits an application event for notification dispatchers
 */
export const emitApplicationEvent = (eventType, payload) => {
  console.log(`[Notification Hook] Event Emitted: ${eventType}`, {
    applicationId: payload.applicationId,
    status: payload.status,
    timestamp: new Date().toISOString(),
  });
  notificationEmitter.emit(eventType, payload);
};
