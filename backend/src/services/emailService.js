import { Resend } from 'resend';
import { config } from '../config/environment.js';
import { buildApplicationSubmittedEmail } from '../emails/applicationSubmitted.js';
import { buildApplicationStatusChangedEmail } from '../emails/applicationStatusChanged.js';
import {
  buildJobApplicationSubmittedEmail,
  buildJobApplicationReceivedEmail,
} from '../emails/jobApplicationReceived.js';
import { buildJobApplicationStatusChangedEmail } from '../emails/jobApplicationStatusChanged.js';

class EmailService {
  constructor() {
    this.resend = null;
    this.from = config.email.from || 'onboarding@resend.dev';
    this.isConfigured = false;

    this.init();
  }

  /**
   * Initialize Resend client safely
   */
  init() {
    if (config.email.resendApiKey && config.email.resendApiKey.length > 0) {
      try {
        this.resend = new Resend(config.email.resendApiKey);
        this.isConfigured = true;
        console.log('[Resend] Email service initialized with Resend SDK.');
      } catch (err) {
        console.warn('[Resend] Failed to instantiate Resend client:', err.message);
        this.resend = null;
        this.isConfigured = false;
      }
    } else {
      console.log(
        '[Resend] Resend API key not configured. Email notifications are disabled.'
      );
      this.resend = null;
      this.isConfigured = false;
    }
  }

  /**
   * Check user notification preference foundation
   * @param {Object} preferences
   * @param {'applicationUpdates'|'jobUpdates'|'systemNotifications'} type
   */
  isPreferenceEnabled(preferences, type) {
    if (!preferences) return true;
    if (preferences[type] === false) return false;
    return true;
  }

  /**
   * Core send method with non-blocking resilience
   * @param {Object} options { to, subject, html, text }
   */
  async sendEmail({ to, subject, html, text }) {
    if (!to) {
      console.warn('[Resend] Email dispatch skipped: recipient address is missing.');
      return { success: false, error: 'Recipient address missing' };
    }

    const recipient = Array.isArray(to) ? to[0] : to;

    // If Resend is not configured, simulate delivery in development
    if (!this.resend || !this.isConfigured) {
      console.log(
        `[Resend Simulated Delivery] To: ${recipient} | Subject: "${subject}"`
      );
      return {
        success: true,
        simulated: true,
        message: 'Resend not configured; simulated delivery in console.',
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || '',
      });

      if (response.error) {
        console.warn(`[Resend] Delivery warning for "${subject}":`, response.error.message || response.error);
        return { success: false, error: response.error.message };
      }

      console.log(`[Resend] Email sent successfully: "${subject}" -> ${recipient}`);
      return { success: true, data: response.data };
    } catch (error) {
      // Graceful error capture: never crash the parent transaction
      console.warn(
        `[Resend] Failed to send email to ${recipient} ("${subject}"):`,
        error.message || 'Unknown network error'
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * 1. Scheme Application Submitted Email (To Veteran)
   */
  async sendApplicationSubmittedEmail({
    to,
    veteranName,
    applicationId,
    schemeName,
    submissionDate,
    status,
    actionUrl,
  }) {
    try {
      const { subject, html, text } = buildApplicationSubmittedEmail({
        veteranName,
        applicationId,
        schemeName,
        submissionDate,
        status,
        actionUrl,
      });

      return await this.sendEmail({ to, subject, html, text });
    } catch (err) {
      console.warn('[Resend] Error preparing scheme submitted email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 2. Scheme Application Status Changed Email (To Veteran)
   */
  async sendApplicationStatusChangedEmail({
    to,
    veteranName,
    applicationId,
    schemeName,
    newStatus,
    adminRemarks,
    actionUrl,
  }) {
    try {
      const { subject, html, text } = buildApplicationStatusChangedEmail({
        veteranName,
        applicationId,
        schemeName,
        newStatus,
        adminRemarks,
        actionUrl,
      });

      return await this.sendEmail({ to, subject, html, text });
    } catch (err) {
      console.warn('[Resend] Error preparing scheme status email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 3. Job Application Submitted Confirmation (To Veteran)
   */
  async sendJobApplicationSubmittedEmail({
    to,
    veteranName,
    jobTitle,
    companyName,
    applicationId,
    applicationDate,
    status,
    actionUrl,
  }) {
    try {
      const { subject, html, text } = buildJobApplicationSubmittedEmail({
        veteranName,
        jobTitle,
        companyName,
        applicationId,
        applicationDate,
        status,
        actionUrl,
      });

      return await this.sendEmail({ to, subject, html, text });
    } catch (err) {
      console.warn('[Resend] Error preparing job application confirmation email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 4. New Job Application Alert (To Employer / Recruiter)
   */
  async sendJobApplicationReceivedEmail({
    to,
    applicantName,
    veteranId,
    jobTitle,
    applicationId,
    applicationDate,
    actionUrl,
  }) {
    try {
      const { subject, html, text } = buildJobApplicationReceivedEmail({
        applicantName,
        veteranId,
        jobTitle,
        applicationId,
        applicationDate,
        actionUrl,
      });

      return await this.sendEmail({ to, subject, html, text });
    } catch (err) {
      console.warn('[Resend] Error preparing recruiter notification email:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * 5. Job Application Status Changed (To Veteran Candidate)
   */
  async sendJobApplicationStatusChangedEmail({
    to,
    veteranName,
    jobTitle,
    companyName,
    applicationId,
    newStatus,
    employerRemarks,
    actionUrl,
  }) {
    try {
      const { subject, html, text } = buildJobApplicationStatusChangedEmail({
        veteranName,
        jobTitle,
        companyName,
        applicationId,
        newStatus,
        employerRemarks,
        actionUrl,
      });

      return await this.sendEmail({ to, subject, html, text });
    } catch (err) {
      console.warn('[Resend] Error preparing candidate stage update email:', err.message);
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
export default emailService;
