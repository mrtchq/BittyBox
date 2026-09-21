// ─────────────────────────────────────────────────────────────────────────────
// lib/resend-client.js
// Resend API integration for Bitty Box transactional emails & delivery
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_BASE = 'https://api.resend.com';
const DEFAULT_API_KEY = process.env.RESEND_API_KEY || '';
// Authentication identity is a trust boundary, not a deployment preference.
// Keep it fixed so a stale environment variable cannot silently change the sender.
const DEFAULT_FROM = 'Bitty Box Support <support@bittybox.org>';
const DEFAULT_REPLY_TO = 'support@bittybox.org';

/**
 * Send an email via Resend API
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email address or array of addresses
 * @param {string} options.subject - Subject line
 * @param {string} [options.html] - HTML body
 * @param {string} [options.text] - Plaintext body
 * @param {string} [options.from] - Sender email (defaults to support@bittybox.org)
 * @param {string|string[]} [options.replyTo] - Reply-To identity
 * @param {string} [options.apiKey] - Override API key
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
  replyTo,
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
    ...(replyTo ? { reply_to: Array.isArray(replyTo) ? replyTo : [replyTo] } : {}),
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
 * Send the canonical Bitty Box access-clearance email via Resend.
 */
export async function sendMagicLinkEmail({
  to,
  displayName = '',
  magicLink,
  apiKey = DEFAULT_API_KEY,
} = {}) {
  const recipientName = displayName || String(to || '').split('@')[0] || 'Builder';
  const escapedName = recipientName.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character));
  const subject = 'Bitty Box access clearance';

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#0b0b0d;color:#f4f1ea;font-family:Arial,Helvetica,sans-serif">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Your Bitty Box access clearance expires in 15 minutes.</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0b0b0d;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#151517;border:1px solid #39393d;border-radius:18px;overflow:hidden">
          <tr><td style="height:4px;background:#d8bb82"></td></tr>
          <tr><td style="padding:32px 32px 14px">
            <p style="margin:0;color:#d8bb82;font-size:12px;font-weight:700;letter-spacing:2px">BITTY BOX / AUTHENTICATION</p>
            <p style="display:inline-block;margin:22px 0 14px;padding:7px 10px;border:1px solid #675934;border-radius:999px;color:#f1d79e;background:#292517;font-size:11px;font-weight:700;letter-spacing:1.2px">ACCESS CLEARANCE</p>
            <h1 style="margin:0 0 14px;color:#ffffff;font-size:28px;line-height:1.15;font-weight:700">Your workspace is ready.</h1>
            <p style="margin:0;color:#c9c6bf;font-size:16px;line-height:1.55">Hello ${escapedName},</p>
            <p style="margin:14px 0 0;color:#c9c6bf;font-size:16px;line-height:1.55">You asked to enter Bitty Box. Use this one-time clearance to open your workspace.</p>
          </td></tr>
          <tr><td style="padding:16px 32px 30px">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#d8bb82"><a href="${magicLink}" style="display:inline-block;padding:15px 22px;border-radius:10px;color:#17130a;font-size:14px;font-weight:700;letter-spacing:.4px;text-decoration:none">OPEN MY BITTY BOX</a></td></tr></table>
          </td></tr>
          <tr><td style="padding:0 32px 28px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#202024;border:1px solid #39393d;border-radius:10px"><tr><td style="padding:15px 16px">
              <p style="margin:0 0 4px;color:#f1d79e;font-size:12px;font-weight:700;letter-spacing:.5px">EXPIRES IN 15 MINUTES</p>
              <p style="margin:0;color:#aaa7a0;font-size:13px;line-height:1.45">This link works once. Request another if it expires.</p>
            </td></tr></table>
          </td></tr>
          <tr><td style="padding:22px 32px;border-top:1px solid #39393d;background:#111113">
            <p style="margin:0 0 7px;color:#f4f1ea;font-size:13px;font-weight:700">Check the sender before you click.</p>
            <p style="margin:0;color:#aaa7a0;font-size:13px;line-height:1.5">Legitimate Bitty Box sign-in emails come from <a href="mailto:support@bittybox.org" style="color:#f1d79e;text-decoration:none">Bitty Box Support &lt;support@bittybox.org&gt;</a>. We will never ask for your password in this email.</p>
          </td></tr>
          <tr><td style="padding:18px 32px 28px;background:#111113">
            <p style="margin:0;color:#77746f;font-size:12px;line-height:1.5">If you did not request access, ignore this message. No action is needed.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `BITTY BOX / ACCESS CLEARANCE\n\nHello ${recipientName},\n\nYou asked to enter Bitty Box. Use this one-time clearance to open your workspace.\n\nOPEN MY BITTY BOX\n${magicLink}\n\nExpires in 15 minutes. This link works once.\n\nCHECK THE SENDER\nOnly trust sign-in links delivered from support@bittybox.org. Bitty Box will never ask for your password in this email.\n\nIf you did not request access, ignore this message. No action is needed.`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    from: DEFAULT_FROM,
    replyTo: DEFAULT_REPLY_TO,
    apiKey,
  });
}

/**
 * Send a One-Time Magic Key delivery email via Resend.
 */
export async function sendOneTimeMagicKeyEmail({
  to,
  recipientName = '',
  magicKey,
  boxTitle = 'Untitled Bitty Box',
  boxUrl = '',
  note = '',
  apiKey = DEFAULT_API_KEY,
} = {}) {
  const recipient = recipientName || String(to || '').split('@')[0] || 'Friend';
  const escapedName = recipient.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
  const escapedTitle = (boxTitle || 'Untitled Bitty Box').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
  const escapedNote = note ? note.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)) : '';
  const escapedKey = magicKey.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
  const subject = `Your One-Time Magic Key for "${escapedTitle}"`;

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#06040d;color:#f4f1ea;font-family:Arial,Helvetica,sans-serif">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Your One-Time Magic Key for ${escapedTitle}.</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#06040d;padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#100b1e;border:1px solid #eab308;border-radius:18px;overflow:hidden;box-shadow:0 0 35px rgba(234,179,8,0.25)">
          <tr><td style="height:4px;background:linear-gradient(90deg, #eab308, #00f2ff, #eab308)"></td></tr>
          <tr><td style="padding:32px 32px 16px">
            <p style="margin:0;color:#facc15;font-size:12px;font-weight:700;letter-spacing:2px">BITTY BOX / SECURE KEY DELIVERY</p>
            <p style="display:inline-block;margin:18px 0 14px;padding:6px 12px;border:1px solid #ca8a04;border-radius:999px;color:#fef08a;background:#2d2006;font-size:11px;font-weight:700;letter-spacing:1.2px">ONE-TIME MAGIC KEY</p>
            <h1 style="margin:0 0 14px;color:#ffffff;font-size:26px;line-height:1.2;font-weight:700">${escapedTitle}</h1>
            <p style="margin:0;color:#c9c6bf;font-size:15px;line-height:1.55">Hello ${escapedName},</p>
            <p style="margin:12px 0 0;color:#c9c6bf;font-size:15px;line-height:1.55">You have been designated as the recipient for this protected Bitty Box. Use the single-use cryptographic magic key below to decrypt and reveal the transmission.</p>
          </td></tr>
          <tr><td style="padding:10px 32px 20px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#04020a;border:2px dashed #eab308;border-radius:12px">
              <tr><td style="padding:20px;text-align:center">
                <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#facc15;text-transform:uppercase;margin-bottom:8px">SECRET ONE-TIME KEY</div>
                <div style="font-family:'JetBrains Mono',Menlo,Monaco,Consolas,monospace;font-size:26px;font-weight:800;letter-spacing:4px;color:#ffffff;text-shadow:0 0 12px rgba(234,179,8,0.6)">${escapedKey}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:8px">Enter this key into the unlock screen when opening the Box.</div>
              </td></tr>
            </table>
          </td></tr>
          ${escapedNote ? `<tr><td style="padding:0 32px 20px">
            <div style="background:#17112c;border-left:3px solid #00f2ff;border-radius:6px;padding:12px 16px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#00f2ff;text-transform:uppercase">Personal Memo</p>
              <p style="margin:0;font-size:14px;color:#e2e8f0;font-style:italic;line-height:1.5">&ldquo;${escapedNote}&rdquo;</p>
            </div>
          </td></tr>` : ''}
          ${boxUrl ? `<tr><td style="padding:0 32px 28px">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#eab308;box-shadow:0 0 15px rgba(234,179,8,0.4)"><a href="${boxUrl}" style="display:inline-block;padding:14px 24px;border-radius:10px;color:#050212;font-size:14px;font-weight:700;letter-spacing:.5px;text-decoration:none">OPEN PROTECTED BITTY BOX</a></td></tr></table>
          </td></tr>` : ''}
          <tr><td style="padding:20px 32px;border-top:1px solid #2d2447;background:#0c0818">
            <p style="margin:0 0 6px;color:#f4f1ea;font-size:12px;font-weight:700">End-to-End Ephemeral Encryption</p>
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5">This Bitty Box ciphertext is encrypted in the browser. The payload requires this secret key to derive the AES-GCM decryption key. Sent securely from <a href="https://bittybox.org" style="color:#facc15;text-decoration:none">bittybox.org</a>.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  const text = `BITTY BOX / SECURE KEY DELIVERY\n\nHello ${recipient},\n\nYou have been designated as the recipient for "${boxTitle}".\n\nYOUR ONE-TIME MAGIC KEY:\n${magicKey}\n\n${note ? `Personal memo:\n"${note}"\n\n` : ''}${boxUrl ? `Open the Box:\n${boxUrl}\n\n` : ''}Enter this key on the unlock screen to decrypt the transmission.\n\nSent securely via Bitty Box (support@bittybox.org).`;

  return sendEmail({
    to,
    subject,
    html,
    text,
    from: DEFAULT_FROM,
    replyTo: DEFAULT_REPLY_TO,
    apiKey,
  });
}

