import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let transporterPromise;
let resendClient = null;
let loggedProvider = false;

function getResend() {
  if (resendClient === null) {
    const key = process.env.RESEND_API_KEY;
    if (key && key.trim()) {
      resendClient = new Resend(key.trim());
      if (!loggedProvider) {
        console.info('Email: Using Resend (RESEND_API_KEY is set)');
        loggedProvider = true;
      }
    } else {
      resendClient = false;
      if (!loggedProvider) {
        console.warn(
          'Email: RESEND_API_KEY is not set in this environment. Add RESEND_API_KEY in Railway (or your host) to send via Resend and avoid SMTP connection timeouts.'
        );
        loggedProvider = true;
      }
    }
  }
  return resendClient || null;
}

function getTransporter() {
  if (!transporterPromise) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration is incomplete. Discovery emails will be skipped unless RESEND_API_KEY is set.');
      transporterPromise = Promise.resolve(null);
      return transporterPromise;
    }

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
      })
    );
  }
  return transporterPromise;
}

export async function sendMail({ subject, text, html, to: toOverride }) {
  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;
  const to = toOverride && toOverride.trim() ? toOverride.trim() : (process.env.EMAIL_TO || from);

  if (!from || !to) {
    console.warn('Email skipped (missing from/to):', subject || '(no subject)');
    return;
  }

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: from.trim(),
        to: to.trim(),
        subject: subject || '',
        text: text || undefined,
        html: html || undefined,
      });
      console.info('Email sent (Resend):', to === toOverride ? `to submitter ${to}` : 'to site owner', subject?.slice(0, 50));
      return;
    } catch (err) {
      console.error('Resend error:', err?.message || err);
      throw err;
    }
  }

  // No Resend → fall back to SMTP (often blocked in cloud, causes "Connection timeout")
  const transport = await getTransporter();
  if (!transport) {
    console.warn('Email skipped (no transport; set SMTP_* or RESEND_API_KEY):', subject || '(no subject)');
    return;
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.info('Email sent (SMTP):', to === toOverride ? `to submitter ${to}` : 'to site owner', subject?.slice(0, 50));
  } catch (err) {
    console.error('Error sending email:', err.message || err);
    throw err;
  }
}
