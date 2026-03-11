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
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const to = toOverride && toOverride.trim() ? toOverride.trim() : (process.env.EMAIL_TO || from);

  if (!from || !to) {
    console.warn('EMAIL_FROM or EMAIL_TO not set. Skipping email send.');
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
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

