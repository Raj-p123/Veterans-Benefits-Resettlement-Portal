/**
 * Centralized Socket.IO Event Names (Backend)
 */
export const SOCKET_EVENTS = {
  // Connection Events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',

  // Scheme Application Events
  APPLICATION_CREATED: 'application:created',
  APPLICATION_SUBMITTED: 'application:submitted',
  APPLICATION_STATUS_CHANGED: 'application:statusChanged',
  APPLICATION_WITHDRAWN: 'application:withdrawn',

  // Job & Recruitment Events
  JOB_CREATED: 'job:created',
  JOB_UPDATED: 'job:updated',
  JOB_CLOSED: 'job:closed',
  JOB_APPLICATION_CREATED: 'job:applicationCreated',
  JOB_APPLICATION_STATUS_CHANGED: 'job:applicationStatusChanged',

  // Notification Events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_READ_ALL: 'notification:readAll',
  NOTIFICATION_COUNT_UPDATED: 'notification:countUpdated',

  // Dashboard & Real-Time Events
  DASHBOARD_UPDATED: 'dashboard:updated',

  // Phase 8 Admin Real-Time Events
  ADMIN_VETERAN_REGISTERED: 'admin:veteranRegistered',
  ADMIN_EMPLOYER_REGISTERED: 'admin:employerRegistered',
  ADMIN_JOB_CREATED: 'admin:jobCreated',
  ADMIN_APPLICATION_CREATED: 'admin:applicationCreated',
  ADMIN_DOCUMENT_UPLOADED: 'admin:documentUploaded',
  ADMIN_VERIFICATION_UPDATED: 'admin:verificationUpdated',
  ADMIN_DASHBOARD_UPDATED: 'admin:dashboardUpdated',
};

export default SOCKET_EVENTS;
