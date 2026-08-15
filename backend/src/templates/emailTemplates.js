/**
 * Transactional Email Templates for Veterans Benefits & Resettlement Portal
 */

const baseEmailLayout = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .email-header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .email-header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #f8fafc; }
    .email-header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
    .email-body { padding: 32px 24px; }
    .email-footer { background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background: #eff6ff; color: #1d4ed8; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 16px; }
    .info-box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; margin: 16px 0; border-radius: 0 4px 4px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>VETERANS BENEFITS & RESETTLEMENT PORTAL</h1>
      <p>Official Veteran Welfare & Defense Career Gateway</p>
    </div>
    <div class="email-body">
      ${contentHtml}
    </div>
    <div class="email-footer">
      <p>© ${new Date().getFullYear()} Veterans Benefits & Resettlement Portal • Ministry of Defence</p>
      <p>This is an automated notification. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

export const emailTemplates = {
  /**
   * Scheme Application Submitted
   */
  schemeApplicationSubmitted: ({ userName, schemeName, applicationId, appliedAt }) => {
    const content = `
      <h2 style="color: #0f172a; margin-top: 0;">Welfare Scheme Application Submitted</h2>
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Your application for the government welfare scheme <strong>${schemeName}</strong> has been successfully submitted and logged into the portal.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 6px;"><strong>Application ID:</strong> ${applicationId}</p>
        <p style="margin: 0 0 6px;"><strong>Scheme:</strong> ${schemeName}</p>
        <p style="margin: 0;"><strong>Submission Date:</strong> ${new Date(appliedAt || Date.now()).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      </div>

      <p>Our designated welfare officers will review your attached documents and service credentials. You can track real-time progress on your portal dashboard.</p>
      
      <a href="http://localhost:5173/veteran/applications/${applicationId}" class="btn">Track Application Status</a>
    `;
    return {
      subject: `[Submitted] Welfare Claim ${applicationId} - ${schemeName}`,
      html: baseEmailLayout('Scheme Application Submitted', content),
    };
  },

  /**
   * Scheme Application Status Changed
   */
  schemeApplicationStatusChanged: ({ userName, schemeName, applicationId, status, remarks }) => {
    const content = `
      <h2 style="color: #0f172a; margin-top: 0;">Welfare Application Status Update</h2>
      <p>Dear <strong>${userName}</strong>,</p>
      <p>The processing status for your application <strong>${applicationId}</strong> (${schemeName}) has been updated by the evaluation committee:</p>
      
      <div class="info-box">
        <p style="margin: 0 0 6px;"><strong>Current Stage:</strong> <span class="badge">${status.replace('_', ' ')}</span></p>
        ${remarks ? `<p style="margin: 0;"><strong>Officer Remarks:</strong> ${remarks}</p>` : ''}
      </div>

      <p>Please log in to your portal dashboard for further details and requested actions.</p>
      
      <a href="http://localhost:5173/veteran/applications/${applicationId}" class="btn">View Claim Timeline</a>
    `;
    return {
      subject: `[Update] Application ${applicationId} is now ${status.replace('_', ' ')}`,
      html: baseEmailLayout('Application Status Update', content),
    };
  },

  /**
   * Job Application Received by Employer
   */
  jobApplicationReceived: ({ employerName, candidateName, jobTitle, applicationId }) => {
    const content = `
      <h2 style="color: #0f172a; margin-top: 0;">New Veteran Candidate Applied</h2>
      <p>Dear Recruitment Team at <strong>${employerName}</strong>,</p>
      <p>A new veteran candidate <strong>${candidateName}</strong> has submitted an application for your opening: <strong>${jobTitle}</strong>.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 6px;"><strong>Application ID:</strong> ${applicationId}</p>
        <p style="margin: 0;"><strong>Job Role:</strong> ${jobTitle}</p>
      </div>

      <p>Log in to your Employer Recruitment Portal to review the military service record and verified defense credentials.</p>
      
      <a href="http://localhost:5173/employer/applications/${applicationId}" class="btn">Review Candidate Dossier</a>
    `;
    return {
      subject: `[New Applicant] ${candidateName} applied for ${jobTitle}`,
      html: baseEmailLayout('New Veteran Application Received', content),
    };
  },

  /**
   * Job Application Status Changed for Veteran
   */
  jobApplicationStatusChanged: ({ candidateName, jobTitle, companyName, applicationId, status, remarks }) => {
    const content = `
      <h2 style="color: #0f172a; margin-top: 0;">Job Application Status Update</h2>
      <p>Dear <strong>${candidateName}</strong>,</p>
      <p>Your job application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated by the corporate hiring team:</p>
      
      <div class="info-box">
        <p style="margin: 0 0 6px;"><strong>Status:</strong> <span class="badge">${status.replace('_', ' ')}</span></p>
        ${remarks ? `<p style="margin: 0;"><strong>Recruiter Note:</strong> ${remarks}</p>` : ''}
      </div>

      <p>You can check the full hiring audit trail and interview details directly on your portal account.</p>
      
      <a href="http://localhost:5173/veteran/job-applications/${applicationId}" class="btn">View Application Details</a>
    `;
    return {
      subject: `[Job Update] Your application for ${jobTitle} is ${status.replace('_', ' ')}`,
      html: baseEmailLayout('Job Application Status Update', content),
    };
  },
};

export default emailTemplates;
