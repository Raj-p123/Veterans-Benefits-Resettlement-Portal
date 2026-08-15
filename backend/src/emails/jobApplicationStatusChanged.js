import { wrapEmailLayout } from './baseLayout.js';

export const buildJobApplicationStatusChangedEmail = ({
  veteranName = 'Veteran Candidate',
  jobTitle,
  companyName = 'Employer',
  applicationId,
  newStatus,
  employerRemarks,
  actionUrl,
}) => {
  const getBadgeClass = (st) => {
    switch (st) {
      case 'SELECTED':
        return 'status-selected';
      case 'SHORTLISTED':
      case 'INTERVIEW':
        return 'status-shortlisted';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-applied';
    }
  };

  const getStatusHeadline = (st) => {
    switch (st) {
      case 'SELECTED':
        return '🎉 Congratulations! Offer / Selection Update';
      case 'INTERVIEW':
        return '📅 Interview Invitation Scheduled';
      case 'SHORTLISTED':
        return '🌟 Application Shortlisted';
      case 'REJECTED':
        return 'Application Status Update';
      default:
        return 'Application Under Active Review';
    }
  };

  const contentHtml = `
    <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:800;">
      ${getStatusHeadline(newStatus)}
    </h2>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Dear <strong>${veteranName}</strong>,
    </p>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      The recruitment team at <strong>${companyName}</strong> has updated the status of your candidacy for the position of <strong>${jobTitle}</strong>.
    </p>

    <div style="margin:16px 0;">
      <span class="status-badge ${getBadgeClass(newStatus)}">New Stage: ${newStatus.replace('_', ' ')}</span>
    </div>

    <table class="details-table">
      <tr>
        <td class="details-label">Position</td>
        <td class="details-value">${jobTitle}</td>
      </tr>
      <tr>
        <td class="details-label">Company / Employer</td>
        <td class="details-value">${companyName}</td>
      </tr>
      <tr>
        <td class="details-label">Application ID</td>
        <td class="details-value" style="font-family:monospace;color:#1e40af;">${applicationId}</td>
      </tr>
      <tr>
        <td class="details-label">Current Stage</td>
        <td class="details-value"><strong>${newStatus.replace('_', ' ')}</strong></td>
      </tr>
      ${
        employerRemarks
          ? `<tr>
              <td class="details-label">Recruiter Remarks</td>
              <td class="details-value" style="color:#334155;font-weight:500;">${employerRemarks}</td>
            </tr>`
          : ''
      }
    </table>

    <p style="font-size:14px;color:#475569;line-height:1.5;">
      Check your portal dashboard for further details and to respond to recruitment scheduling requests.
    </p>

    ${
      actionUrl
        ? `<div style="text-align:left;margin-top:20px;">
            <a href="${actionUrl}" class="btn" target="_blank">View Application Dashboard</a>
          </div>`
        : ''
    }
  `;

  return {
    subject: `Job Application Status Updated - ${jobTitle}`,
    html: wrapEmailLayout({
      title: `Application Status - ${jobTitle}`,
      preheader: `Your application for ${jobTitle} at ${companyName} is now ${newStatus}.`,
      contentHtml,
    }),
    text: `Dear ${veteranName},\n\nYour application for ${jobTitle} at ${companyName} (ID: ${applicationId}) has been updated.\nNew Stage: ${newStatus}.\n${employerRemarks ? `Remarks: ${employerRemarks}\n` : ''}\nView details on the Veterans Portal.`,
  };
};

export default buildJobApplicationStatusChangedEmail;
