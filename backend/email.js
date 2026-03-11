import nodemailer from 'nodemailer';

let transporterPromise;

function getTransporter() {
  if (!transporterPromise) {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('SMTP configuration is incomplete. Discovery emails will be skipped.');
      transporterPromise = Promise.resolve(null);
      return transporterPromise;
    }

    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      })
    );
  }
  return transporterPromise;
}

export async function sendMail({ subject, text, html, to: toOverride }) {
  const transport = await getTransporter();
  if (!transport) {
    console.warn('Email skipped (no SMTP transport):', subject || '(no subject)');
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const to = toOverride && toOverride.trim() ? toOverride.trim() : (process.env.EMAIL_TO || from);

  if (!from || !to) {
    console.warn('Email skipped (missing from/to):', subject || '(no subject)');
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
    console.info('Email sent:', to === toOverride ? `to submitter ${to}` : 'to site owner', subject?.slice(0, 50));
  } catch (err) {
    console.error('Error sending email:', err.message || err);
    throw err;
  }
}

