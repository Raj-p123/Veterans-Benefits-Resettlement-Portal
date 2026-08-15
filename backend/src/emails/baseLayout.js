/**
 * Base HTML Email Layout with Veterans Portal Official Branding
 */
export const wrapEmailLayout = ({ title, preheader = '', contentHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Veterans Benefits & Resettlement Portal'}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 30px 15px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      padding: 24px 30px;
      text-align: left;
    }
    .brand-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #93c5fd;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 8px;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .header p {
      margin: 4px 0 0;
      color: #cbd5e1;
      font-size: 13px;
    }
    .body-content {
      padding: 32px 30px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 12px 0;
    }
    .status-submitted, .status-applied {
      background-color: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .status-approved, .status-selected {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }
    .status-review, .status-shortlisted, .status-interview {
      background-color: #fffbeb;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .status-rejected {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background-color: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .details-table td {
      padding: 12px 16px;
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
    }
    .details-table tr:last-child td {
      border-bottom: none;
    }
    .details-label {
      color: #64748b;
      font-weight: 600;
      width: 38%;
    }
    .details-value {
      color: #0f172a;
      font-weight: 700;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 6px;
      margin-top: 18px;
      text-align: center;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.5;
    }
    .footer a {
      color: #2563eb;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="brand-badge">Official Portal Notice</div>
        <h1>Veterans Benefits &amp; Resettlement Portal</h1>
        <p>Serving Ex-Servicemen &amp; Defense Families Nationwide</p>
      </div>
      <div class="body-content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin:0 0 6px;">This is an automated administrative notification from the Veterans Benefits &amp; Resettlement Portal.</p>
        <p style="margin:0;">Need assistance? Access our online support desk or contact the veteran welfare cell.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export default wrapEmailLayout;
