import { wrapEmailLayout } from './baseLayout.js';

/**
 * Email sent to the Veteran confirming their job application submission
 */
export const buildJobApplicationSubmittedEmail = ({
  veteranName = 'Veteran',
  jobTitle,
  companyName,
  applicationId,
  applicationDate,
  status = 'APPLIED',
  actionUrl,
}) => {
  const formattedDate = applicationDate
    ? new Date(applicationDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const contentHtml = `
    <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:800;">
      Job Application Successfully Submitted
    </h2>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Dear <strong>${veteranName}</strong>,
    </p>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been transmitted to the employer's recruitment desk.
    </p>

    <div style="margin:16px 0;">
      <span class="status-badge status-applied">Status: ${status}</span>
    </div>

    <table class="details-table">
      <tr>
        <td class="details-label">Application ID</td>
        <td class="details-value" style="font-family:monospace;color:#1e40af;">${applicationId}</td>
      </tr>
      <tr>
        <td class="details-label">Position</td>
        <td class="details-value">${jobTitle}</td>
      </tr>
      <tr>
        <td class="details-label">Company / Employer</td>
        <td class="details-value">${companyName}</td>
      </tr>
      <tr>
        <td class="details-label">Submission Date</td>
        <td class="details-value">${formattedDate}</td>
      </tr>
    </table>

    <p style="font-size:14px;color:#475569;line-height:1.5;">
      You will receive instant portal and email updates whenever the recruiter reviews your profile or updates your candidacy stage.
    </p>

    ${
      actionUrl
        ? `<div style="text-align:left;margin-top:20px;">
            <a href="${actionUrl}" class="btn" target="_blank">View Application Status</a>
          </div>`
        : ''
    }
  `;

  return {
    subject: `Job Application Submitted - ${applicationId}`,
    html: wrapEmailLayout({
      title: `Job Application Submitted - ${applicationId}`,
      preheader: `Your application for ${jobTitle} at ${companyName} has been submitted.`,
      contentHtml,
    }),
    text: `Dear ${veteranName},\n\nYour application for ${jobTitle} at ${companyName} (ID: ${applicationId}) has been successfully submitted on ${formattedDate}.\n\nTrack your progress in the Veterans Portal.`,
  };
};

/**
 * Email sent to the Employer alerting them of a new veteran candidate
 */
export const buildJobApplicationReceivedEmail = ({
  applicantName = 'Veteran Candidate',
  veteranId,
  jobTitle,
  applicationId,
  applicationDate,
  actionUrl,
}) => {
  const formattedDate = applicationDate
    ? new Date(applicationDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

  const contentHtml = `
    <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:800;">
      New Candidate Application Received
    </h2>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Dear Hiring Team,
    </p>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      A qualified defense veteran has applied for your open requisition: <strong>${jobTitle}</strong>.
    </p>

    <table class="details-table">
      <tr>
        <td class="details-label">Applicant Name</td>
        <td class="details-value">${applicantName}</td>
      </tr>
      ${
        veteranId
          ? `<tr>
              <td class="details-label">Veteran ID</td>
              <td class="details-value" style="font-family:monospace;color:#1e40af;">${veteranId}</td>
            </tr>`
          : ''
      }
      <tr>
        <td class="details-label">Requisition / Role</td>
        <td class="details-value">${jobTitle}</td>
      </tr>
      <tr>
        <td class="details-label">Application ID</td>
        <td class="details-value" style="font-family:monospace;color:#1e40af;">${applicationId}</td>
      </tr>
      <tr>
        <td class="details-label">Application Date</td>
        <td class="details-value">${formattedDate}</td>
      </tr>
    </table>

    <p style="font-size:14px;color:#475569;line-height:1.5;">
      Access the applicant's military background, verified credentials, and resume directly through your recruiter dashboard.
    </p>

    ${
      actionUrl
        ? `<div style="text-align:left;margin-top:20px;">
            <a href="${actionUrl}" class="btn" target="_blank">Review Candidate Dossier</a>
          </div>`
        : ''
    }
  `;

  return {
    subject: `New Job Application - ${jobTitle}`,
    html: wrapEmailLayout({
      title: `New Candidate - ${jobTitle}`,
      preheader: `${applicantName} has applied for ${jobTitle}.`,
      contentHtml,
    }),
    text: `Dear Hiring Team,\n\n${applicantName} has applied for ${jobTitle} (Application ID: ${applicationId}) on ${formattedDate}.\n\nReview the candidate profile in your Employer Dashboard.`,
  };
};

export default buildJobApplicationReceivedEmail;
