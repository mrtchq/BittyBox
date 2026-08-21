// ─────────────────────────────────────────────────────────────────────────────
// lib/resend-client.js
// Resend API integration for Bitty Box transactional emails & delivery
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_BASE = 'https://api.resend.com';
const DEFAULT_API_KEY = process.env.RESEND_API_KEY || '';
const DEFAULT_FROM = process.env.RESEND_DEFAULT_FROM || 'Bitty Box <notifications@bittybox.org>';

/**
 * Send an email via Resend API
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address or array of addresses
 * @param {string} options.subject - Subject line
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plaintext body
 * @param {string} [options.from] - Sender email (defaults to notifications@bittybox.org)
 * @param {string} [options.apiKey] - Override API key
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  apiKey = DEFAULT_API_KEY,
} = {}) {
  if (!to || !subject || (!html && !text)) {
    throw new Error('sendEmail requires "to", "subject", and either "html" or "text"');
  }

  if (!apiKey) {
    return {
      success: false,
      error: 'RESEND_API_KEY is not configured',
    };
  }

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  };

  try {
    const res = await fetch(`${RESEND_API_BASE}/emails`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data.message || data.error || 'Failed to send email',
      };
    }

    return {
      success: true,
      id: data.id,
      from,
      to: payload.to,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * List verified sending domains from Resend
 */
export async function listDomains(apiKey = DEFAULT_API_KEY) {
  try {
    const res = await fetch(`${RESEND_API_BASE}/domains`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Check API key validity & account health
 */
export async function checkHealth(apiKey = DEFAULT_API_KEY) {
  try {
    const res = await fetch(`${RESEND_API_BASE}/api-keys`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const data = await res.json();
    return {
      connected: res.ok,
      status: res.status,
      keys: data.data || [],
    };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

/**
 * Send a Magic Link Sign-In / Account Creation Email via Resend
 */
export async function sendMagicLinkEmail({
  to,
  displayName = '',
  magicLink,
  from = DEFAULT_FROM,
  apiKey = DEFAULT_API_KEY,
} = {}) {
  const recipientName = displayName ? displayName : to.split('@')[0];
  const subject = '⚡ Your Bitty Box Magic Sign-In Link';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Bitty Box Sign-In Link</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050314; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 540px; margin: 30px auto; background: #0c0824; border: 1px solid rgba(0, 242, 255, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 0 50px rgba(0, 242, 255, 0.15); }
    .header { padding: 32px 24px 20px; text-align: center; background: linear-gradient(180deg, rgba(0, 242, 255, 0.1) 0%, transparent 100%); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: 0.15em; color: #00f2ff; text-transform: uppercase; text-shadow: 0 0 20px rgba(0, 242, 255, 0.6); }
    .badge { display: inline-block; padding: 4px 12px; margin-top: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #d946ef; background: rgba(217, 70, 239, 0.15); border: 1px solid rgba(217, 70, 239, 0.4); border-radius: 20px; }
    .content { padding: 32px 28px; text-align: center; }
    .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .message { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
    .button-container { margin: 28px 0; }
    .magic-button { display: inline-block; padding: 16px 36px; font-size: 14px; font-weight: 800; text-decoration: none; color: #050314 !important; background: #00f2ff; border-radius: 12px; letter-spacing: 0.1em; text-transform: uppercase; box-shadow: 0 0 30px rgba(0, 242, 255, 0.5); }
    .fallback { margin-top: 30px; padding: 14px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; font-size: 11px; color: #64748b; word-break: break-all; text-align: left; }
    .fallback a { color: #38bdf8; text-decoration: none; }
    .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); background: rgba(0, 0, 0, 0.2); }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">⚡ BITTY BOX</div>
      <div class="badge">Passwordless Authentication</div>
    </div>
    <div class="content">
      <div class="greeting">Hello ${recipientName},</div>
      <div class="message">
        Tap the button below to instantly sign in or create your Bitty Box account. No password required.
      </div>
      <div class="button-container">
        <a href="${magicLink}" class="magic-button" target="_blank">ACCESS YOUR ACCOUNT ⚡</a>
      </div>
      <div class="message" style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
        ⏱️ This single-use link will expire in <strong>15 minutes</strong>.
      </div>
      <div class="fallback">
        <div style="font-weight: 700; color: #94a3b8; margin-bottom: 4px;">Button not working? Direct link:</div>
        <a href="${magicLink}">${magicLink}</a>
      </div>
    </div>
    <div class="footer">
      If you did not request this transmission, you can safely disregard it.<br>
      Bitty Box • Self-Contained URL Micro-Apps & Storage
    </div>
  </div>
</body>
</html>
`;

  const text = `
BITTY BOX PASSWORDLESS AUTHENTICATION
-------------------------------------
Hello ${recipientName},

Use the magic link below to instantly access or create your Bitty Box account (expires in 15 minutes):

${magicLink}

If you didn't request this email, you can safely ignore it.
`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    from,
    apiKey,
  });
}
