// Clean & professional HTML Email Template (shadcn-inspired)

const getBaseStyles = () => `
  <style>
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .bg-white { background: #ffffff; }
    .bg-dark { background: #0f172a; }
    .bg-light { background: #f8fafc; }
    .border { border: 1px solid #e2e8f0; }
    .rounded { border-radius: 8px; }
    .shadow { box-shadow: 0 2px 6px rgba(0,0,0,0.05); }
    .text-dark { color: #0f172a; }
    .text-muted { color: #64748b; }
    .text-white { color: #ffffff; }
    .font-sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    .font-mono { font-family: monospace; }
    .text-center { text-align: center; }
    .fw-bold { font-weight: 600; }
    .fw-medium { font-weight: 500; }
    .fs-lg { font-size: 18px; }
    .fs-xl { font-size: 20px; }
    .fs-xxl { font-size: 28px; }
    .p-24 { padding: 24px; }
    .p-16 { padding: 16px; }
    .py-32 { padding: 32px 0; }
    .mb-8 { margin-bottom: 8px; }
    .mb-16 { margin-bottom: 16px; }
    .mb-24 { margin-bottom: 24px; }
    .leading { line-height: 1.5; }
    .code-box { display: inline-block; background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px 32px; font-size: 24px; font-weight: 700; }
  </style>
`;

const getBaseHTML = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  ${getBaseStyles()}
</head>
<body class="bg-light font-sans" style="margin:0;padding:0;">
  <div class="container">
    <div class="bg-white rounded shadow border">
      ${content}
    </div>
  </div>
</body>
</html>
`;

const sendOtpEmailHtml = (name, otp) => {
  const content = `
    <!-- Header -->
    <div class="bg-dark text-center py-32 rounded-top">
      <h1 class="fs-xl fw-medium text-white">Verification Code</h1>
    </div>

    <!-- Body -->
    <div class="p-24">
      <div class="text-center mb-24">
        <h2 class="fs-lg fw-medium text-dark mb-8">Hello ${name},</h2>
        <p class="text-muted leading">Enter the code below to complete your login.</p>
      </div>

      <!-- OTP -->
      <div class="text-center mb-24">
        <p class="text-muted fs-sm mb-8">Your one-time code</p>
        <div class="code-box font-mono text-dark">${otp}</div>
      </div>

      <!-- Expiry -->
      <p class="text-center text-muted fs-sm mb-24">
        This code will expire in 10 minutes. If you didn’t request it, please ignore this email.
      </p>

      <!-- Security -->
      <div class="bg-light border rounded p-16 text-center">
        <p class="text-muted fs-xs leading">
          <strong>Security notice:</strong> Never share this code with anyone.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-light border-top text-center p-16">
      <p class="text-muted fs-xs">If you didn’t request this, just ignore this email.</p>
    </div>
  `;

  return getBaseHTML(content, "Email Verification");
};

const sendContactEmailHtml = (firstName, lastName, email, subject, message) => {
  const content = `
    <!-- Header -->
    <div class="bg-dark text-center py-32 rounded-top">
      <h1 class="fs-xl fw-medium text-white">New Contact Form Submission</h1>
    </div>

    <!-- Body -->
    <div class="p-24">
      <div class="mb-24">
        <h2 class="fs-lg fw-medium text-dark mb-16">Contact Information</h2>
        <p class="text-muted leading mb-8"><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p class="text-muted leading mb-8"><strong>Email:</strong> ${email}</p>
        <p class="text-muted leading mb-16"><strong>Subject:</strong> ${subject}</p>
      </div>

      <div class="mb-24">
        <h2 class="fs-lg fw-medium text-dark mb-16">Message</h2>
        <div class="bg-light border rounded p-16">
          <p class="text-muted leading" style="white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="bg-light border-top text-center p-16">
      <p class="text-muted fs-xs">This message was sent from the contact form on your website.</p>
    </div>
  `;

  return getBaseHTML(content, "Contact Form Submission");
};

export {sendOtpEmailHtml, sendContactEmailHtml};
