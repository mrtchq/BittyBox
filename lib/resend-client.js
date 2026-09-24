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
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <!--[if mso]>
    <style type="text/css">
      body, table, td, p, h1, a, span { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;background-color:#06070a;color:#ede4d3;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Your Bitty Box access clearance expires in 15 minutes.</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#06070a;padding:36px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#0e1118;border:1px solid #202634;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.65),0 0 28px rgba(201,24,59,0.12)">
          <tr><td style="height:4px;background:#c9183b;background:linear-gradient(90deg,#c9183b 0%,#dfc291 50%,#8a0e23 100%)"></td></tr>
          <tr><td style="padding:28px 32px 14px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px">
              <tr>
                <td valign="middle" style="width:36px">
                  <img src="https://bittybox.org/bittybox-header-mark.png" alt="Bitty Box" width="32" height="32" style="display:block;border:0;border-radius:6px">
                </td>
                <td valign="middle" style="padding-left:10px">
                  <span style="display:block;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:15px;font-weight:800;letter-spacing:2px;color:#faf7f2;line-height:1.2">BITTYBOX</span>
                  <span style="display:block;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:9px;font-weight:600;letter-spacing:1.6px;color:#dfc291;line-height:1.2;margin-top:2px">URL-NATIVE MICRO-WEB</span>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#dfc291;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">BITTY BOX / AUTHENTICATION</p>
            <p style="display:inline-block;margin:16px 0 14px;padding:6px 14px;border:1px solid rgba(201,24,59,0.45);border-radius:999px;color:#fb7185;background-color:#250911;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">ACCESS CLEARANCE</p>
            <h1 style="margin:0 0 16px;color:#faf7f2;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.01em">Your workspace is ready.</h1>
            <p style="margin:0 0 14px;color:#ede4d3;font-size:15px;line-height:1.6">Hello ${escapedName},</p>
            <p style="margin:0;color:#ede4d3;font-size:15px;line-height:1.6">You asked to enter Bitty Box. Use this one-time clearance to open your workspace.</p>
          </td></tr>
          <tr><td style="padding:16px 32px 28px">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="border-radius:8px;background-color:#b01431;background-image:linear-gradient(135deg,#c9183b 0%,#8a0e23 55%,#470611 100%);border:1px solid rgba(246,241,230,0.28);box-shadow:0 6px 20px rgba(176,20,49,0.38)">
                  <a href="${magicLink}" style="display:inline-block;padding:14px 28px;border-radius:8px;color:#faf7f2;font-family:'JetBrains Mono','DM Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase">OPEN MY BITTY BOX</a>
                </td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:0 32px 28px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#12151d;border:1px solid #202634;border-left:3px solid #dfc291;border-radius:10px">
              <tr>
                <td style="padding:14px 16px">
                  <p style="margin:0 0 4px;color:#dfc291;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">EXPIRES IN 15 MINUTES</p>
                  <p style="margin:0;color:#b8ab96;font-size:13px;line-height:1.45">This link works once. Request another if it expires.</p>
                </td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:22px 32px 14px;border-top:1px solid #1c222e;background-color:#090b10">
            <p style="margin:0 0 7px;color:#faf7f2;font-size:13px;font-weight:700">Check the sender before you click.</p>
            <p style="margin:0;color:#b8ab96;font-size:13px;line-height:1.5">Legitimate Bitty Box sign-in emails come from <a href="mailto:support@bittybox.org" style="color:#dfc291;text-decoration:none;font-weight:600">Bitty Box Support &lt;support@bittybox.org&gt;</a>. We will never ask for your password in this email.</p>
          </td></tr>
          <tr><td style="padding:0 32px 28px;background-color:#090b10">
            <p style="margin:0;color:#847a6b;font-size:12px;line-height:1.5">If you did not request access, ignore this message. No action is needed.</p>
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
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="supported-color-schemes" content="dark">
    <!--[if mso]>
    <style type="text/css">
      body, table, td, p, h1, a, span { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <![endif]-->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap" rel="stylesheet">
  </head>
  <body style="margin:0;padding:0;background-color:#06070a;color:#ede4d3;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">Your One-Time Magic Key for ${escapedTitle}.</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#06070a;padding:36px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#0e1118;border:1px solid #202634;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,0.65),0 0 28px rgba(201,24,59,0.12)">
          <tr><td style="height:4px;background:#c9183b;background:linear-gradient(90deg,#c9183b 0%,#dfc291 50%,#8a0e23 100%)"></td></tr>
          <tr><td style="padding:28px 32px 14px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px">
              <tr>
                <td valign="middle" style="width:36px">
                  <img src="https://bittybox.org/bittybox-header-mark.png" alt="Bitty Box" width="32" height="32" style="display:block;border:0;border-radius:6px">
                </td>
                <td valign="middle" style="padding-left:10px">
                  <span style="display:block;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:15px;font-weight:800;letter-spacing:2px;color:#faf7f2;line-height:1.2">BITTYBOX</span>
                  <span style="display:block;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:9px;font-weight:600;letter-spacing:1.6px;color:#dfc291;line-height:1.2;margin-top:2px">URL-NATIVE MICRO-WEB</span>
                </td>
              </tr>
            </table>
            <p style="margin:0;color:#dfc291;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">BITTY BOX / SECURE KEY DELIVERY</p>
            <p style="display:inline-block;margin:16px 0 14px;padding:6px 14px;border:1px solid rgba(201,24,59,0.45);border-radius:999px;color:#fb7185;background-color:#250911;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">ONE-TIME MAGIC KEY</p>
            <h1 style="margin:0 0 16px;color:#faf7f2;font-family:'Cinzel','Playfair Display',Georgia,serif;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.01em">${escapedTitle}</h1>
            <p style="margin:0 0 14px;color:#ede4d3;font-size:15px;line-height:1.6">Hello ${escapedName},</p>
            <p style="margin:0;color:#ede4d3;font-size:15px;line-height:1.6">You have been designated as the recipient for this protected Bitty Box. Use the single-use cryptographic magic key below to decrypt and reveal the transmission.</p>
          </td></tr>
          <tr><td style="padding:10px 32px 20px">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#080a0f;border:1px dashed #b01431;border-radius:12px">
              <tr><td style="padding:22px;text-align:center">
                <div style="font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:2px;color:#dfc291;text-transform:uppercase;margin-bottom:10px">SECRET ONE-TIME KEY</div>
                <div style="font-family:'JetBrains Mono','DM Mono',Menlo,Monaco,Consolas,monospace;font-size:26px;font-weight:800;letter-spacing:4px;color:#faf7f2;text-shadow:0 0 16px rgba(201,24,59,0.55)">${escapedKey}</div>
                <div style="font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#847a6b;margin-top:10px">Enter this key on the unlock screen to decrypt the transmission.</div>
              </td></tr>
            </table>
          </td></tr>
          ${escapedNote ? `<tr><td style="padding:0 32px 20px">
            <div style="background-color:#12151d;border:1px solid #202634;border-left:3px solid #c9183b;border-radius:8px;padding:14px 18px">
              <p style="margin:0 0 6px;font-family:'JetBrains Mono','DM Mono',Menlo,monospace;font-size:11px;font-weight:700;letter-spacing:1px;color:#fb7185;text-transform:uppercase">Personal Memo</p>
              <p style="margin:0;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#ede4d3;font-style:italic;line-height:1.55">&ldquo;${escapedNote}&rdquo;</p>
            </div>
          </td></tr>` : ''}
          ${boxUrl ? `<tr><td style="padding:0 32px 28px">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td align="center" style="border-radius:8px;background-color:#b01431;background-image:linear-gradient(135deg,#c9183b 0%,#8a0e23 55%,#470611 100%);border:1px solid rgba(246,241,230,0.28);box-shadow:0 6px 20px rgba(176,20,49,0.38)">
                  <a href="${boxUrl}" style="display:inline-block;padding:14px 28px;border-radius:8px;color:#faf7f2;font-family:'JetBrains Mono','DM Mono',Menlo,Consolas,monospace;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none;text-transform:uppercase">OPEN PROTECTED BITTY BOX</a>
                </td>
              </tr>
            </table>
          </td></tr>` : ''}
          <tr><td style="padding:22px 32px 14px;border-top:1px solid #1c222e;background-color:#090b10">
            <p style="margin:0 0 7px;color:#faf7f2;font-size:13px;font-weight:700">End-to-End Ephemeral Encryption</p>
            <p style="margin:0;color:#b8ab96;font-size:13px;line-height:1.5">This Bitty Box ciphertext is encrypted in the browser. The payload requires this secret key to derive the AES-GCM decryption key. Sent securely from <a href="https://bittybox.org" style="color:#dfc291;text-decoration:none;font-weight:600">bittybox.org</a>.</p>
          </td></tr>
          <tr><td style="padding:0 32px 28px;background-color:#090b10">
            <p style="margin:0;color:#847a6b;font-size:12px;line-height:1.5">Legitimate Bitty Box key delivery emails come from <a href="mailto:support@bittybox.org" style="color:#dfc291;text-decoration:none;font-weight:600">Bitty Box Support &lt;support@bittybox.org&gt;</a>.</p>
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

