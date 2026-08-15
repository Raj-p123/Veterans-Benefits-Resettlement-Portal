import { wrapEmailLayout } from './baseLayout.js';

export const buildApplicationSubmittedEmail = ({
  veteranName = 'Veteran',
  applicationId,
  schemeName,
  submissionDate,
  status = 'SUBMITTED',
  actionUrl,
}) => {
  const formattedDate = submissionDate
    ? new Date(submissionDate).toLocaleDateString('en-IN', {
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
      Welfare Scheme Application Submitted
    </h2>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Dear <strong>${veteranName}</strong>,
    </p>
    <p style="font-size:15px;color:#334155;line-height:1.6;">
      Your application for the <strong>${schemeName}</strong> has been successfully received and registered with the Department of Ex-Servicemen Welfare board.
    </p>
    
    <div style="margin:16px 0;">
      <span class="status-badge status-submitted">Status: ${status}</span>
    </div>

    <table class="details-table">
      <tr>
        <td class="details-label">Application ID</td>
        <td class="details-value" style="font-family:monospace;color:#1e40af;">${applicationId}</td>
      </tr>
      <tr>
        <td class="details-label">Welfare Scheme</td>
        <td class="details-value">${schemeName}</td>
      </tr>
      <tr>
        <td class="details-label">Submission Date</td>
        <td class="details-value">${formattedDate}</td>
      </tr>
      <tr>
        <td class="details-label">Next Step</td>
        <td class="details-value">Official Document Verification &amp; Review</td>
      </tr>
    </table>

    <p style="font-size:14px;color:#475569;line-height:1.5;">
      You can track the progress of your application and view administrative remarks at any time directly in the portal.
    </p>

    ${
      actionUrl
        ? `<div style="text-align:left;margin-top:20px;">
            <a href="${actionUrl}" class="btn" target="_blank">Track Application Status</a>
          </div>`
        : ''
    }
  `;

  return {
    subject: `Scheme Application Submitted - ${applicationId}`,
    html: wrapEmailLayout({
      title: `Application Submitted - ${applicationId}`,
      preheader: `Your application ${applicationId} for ${schemeName} has been received.`,
      contentHtml,
    }),
    text: `Dear ${veteranName},\n\nYour application for ${schemeName} (ID: ${applicationId}) has been successfully submitted on ${formattedDate}.\nStatus: ${status}.\n\nTrack your application online at the Veterans Portal.`,
  };
};

export default buildApplicationSubmittedEmail;
