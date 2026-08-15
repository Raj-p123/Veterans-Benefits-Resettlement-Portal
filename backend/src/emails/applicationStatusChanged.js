import { wrapEmailLayout } from './baseLayout.js';

export const buildApplicationStatusChangedEmail = ({
  veteranName = 'Veteran',
  applicationId,
  schemeName,
  newStatus,
  adminRemarks,
  actionUrl,
}) => {
  const getBadgeClass = (st) => {
    switch (st) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'UNDER_REVIEW':
      case 'DOCUMENT_VERIFICATION':
        return 'status-review';
      default:
        return 'status-submitted';
    }
  };

  const getStatusHeadline = (st) => {
    switch (st) {
      case 'APPROVED':
        return '🎉 Scheme Application Approved';
      case 'REJECTED':
        return 'Application Decision Notice';
      case 'UNDER_REVIEW':
        return 'Application Under Active Review';
      case 'DOCUMENT_VERIFICATION':
        return 'Document Verification In Progress';
      default:
        return 'Application Status Updated';
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
      There has been an update regarding your welfare claim for <strong>${schemeName}</strong>.
    </p>

    <div style="margin:16px 0;">
      <span class="status-badge ${getBadgeClass(newStatus)}">New Status: ${newStatus.replace('_', ' ')}</span>
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
        <td class="details-label">Current Status</td>
        <td class="details-value"><strong>${newStatus.replace('_', ' ')}</strong></td>
      </tr>
      ${
        adminRemarks
          ? `<tr>
              <td class="details-label">Official Remarks</td>
              <td class="details-value" style="color:#334155;font-weight:500;">${adminRemarks}</td>
            </tr>`
          : ''
      }
    </table>

    <p style="font-size:14px;color:#475569;line-height:1.5;">
      Please log in to your portal dashboard for full tracking milestones and next steps.
    </p>

    ${
      actionUrl
        ? `<div style="text-align:left;margin-top:20px;">
            <a href="${actionUrl}" class="btn" target="_blank">View Application Dossier</a>
          </div>`
        : ''
    }
  `;

  return {
    subject: `Application Status Updated - ${applicationId}`,
    html: wrapEmailLayout({
      title: `Status Update - ${applicationId}`,
      preheader: `Your application for ${schemeName} is now ${newStatus}.`,
      contentHtml,
    }),
    text: `Dear ${veteranName},\n\nYour application for ${schemeName} (ID: ${applicationId}) has been updated.\nNew Status: ${newStatus}.\n${adminRemarks ? `Remarks: ${adminRemarks}\n` : ''}\nPlease view your application in the Veterans Portal.`,
  };
};

export default buildApplicationStatusChangedEmail;
