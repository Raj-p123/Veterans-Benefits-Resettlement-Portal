import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { emailService } from '../services/emailService.js';
import { config } from '../config/environment.js';

export const testAuth = (req, res) => {
  return sendSuccess(res, 'Authentication successful', {
    user: req.user,
    message: 'You have accessed a general authenticated route.',
  });
};

export const testVeteran = (req, res) => {
  return sendSuccess(res, 'Veteran authorization successful', {
    user: req.user,
    message: 'Welcome to the Veteran-only secure resource.',
  });
};

export const testEmployer = (req, res) => {
  return sendSuccess(res, 'Employer authorization successful', {
    user: req.user,
    message: 'Welcome to the Employer-only secure resource.',
  });
};

export const testAdmin = (req, res) => {
  return sendSuccess(res, 'Admin authorization successful', {
    user: req.user,
    message: 'Welcome to the Admin-only secure resource.',
  });
};

/**
 * Development test email endpoint
 * POST /api/test/email
 */
export const testEmail = async (req, res, next) => {
  try {
    if (config.nodeEnv === 'production') {
      throw ApiError.forbidden('Test email endpoint is disabled in production environment');
    }

    const { to } = req.body;
    const recipient = to || req.user?.email || 'test@example.com';

    const result = await emailService.sendEmail({
      to: recipient,
      subject: 'Veterans Portal Email Test',
      html: `
        <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;padding:30px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;max-width:600px;margin:0 auto;color:#0f172a;">
          <div style="background:#1e3a8a;color:#ffffff;padding:12px 20px;border-radius:6px;margin-bottom:20px;">
            <h2 style="margin:0;font-size:18px;">Veterans Benefits &amp; Resettlement Portal</h2>
          </div>
          <p style="font-size:15px;color:#334155;">This is an automated verification test from the Veterans Portal email service.</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:12px 16px;border-radius:6px;margin:16px 0;">
            <strong style="color:#1e40af;">Resend email integration is working.</strong>
          </div>
          <p style="font-size:13px;color:#64748b;margin-top:20px;">Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      text: 'Veterans Portal Email Test\n\nResend email integration is working.',
    });

    return sendSuccess(res, 'Test email dispatch processed', {
      to: recipient,
      result,
      isConfigured: emailService.isConfigured,
      from: emailService.from,
    });
  } catch (error) {
    next(error);
  }
};
