import { getDBStatus } from '../config/database.js';

export const getHealth = (req, res) => {
  const dbStatus = getDBStatus();

  return res.status(200).json({
    status: 'ok',
    success: true,
    message: 'Veterans Benefits & Resettlement Portal API is running',
    timestamp: new Date().toISOString(),
    database: dbStatus.isConnected ? 'connected' : dbStatus.state,
  });
};
