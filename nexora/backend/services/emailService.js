const nodemailer = require("nodemailer");

// SMTP Transporter configuration (as fallback for localhost or if API keys aren't set)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,          // STARTTLS on port 587 (NOT SSL on 465)
  family: 4,              // Force IPv4 — Render blocks outgoing IPv6
  connectionTimeout: 15000, // Timeout after 15 seconds
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER || "meganodscare@gmail.com",
    pass: (process.env.EMAIL_PASS || process.env.EMAIL_SERVER_PASSWORD || "").replace(/^["']|["']$/g, ""),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Conditionally verify SMTP on startup ONLY if HTTP keys are missing
if (!process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY) {
  console.log("[SMTP Config] Direct SMTP fallback active. host=smtp.gmail.com port=587 secure=false family=4");
  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP transporter verify FAILED:", error.message);
    } else {
      console.log("SMTP transporter ready — emails can be sent.");
    }
  });
} else {
  console.log(`[Email Service Config] HTTP-based transactional mailer active: ${process.env.RESEND_API_KEY ? "Resend" : "SendGrid"}`);
}

const sendOTP = async (email, otp) => {
  console.log(`[OTP Request] Received request for email address: ${email}`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #0F3D30; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nexora Premium Services</h1>
      </div>
      <div style="padding: 30px; background-color: #fcfcfc;">
        <h2 style="color: #333333; margin-top: 0;">Verification Code</h2>
        <p style="color: #555555; font-size: 16px; line-height: 1.5;">
          Please use the following OTP to verify your account or login. This code is valid for 5 minutes.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <span style="display: inline-block; padding: 15px 30px; background-color: #f0fdf4; border: 2px dashed #22c55e; color: #166534; font-size: 32px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
            ${otp}
          </span>
        </div>
        <p style="color: #888888; font-size: 14px; line-height: 1.5;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Nexora. All rights reserved.</p>
      </div>
    </div>
  `;

  // 1. RESEND HTTP API DELIVERY
  if (process.env.RESEND_API_KEY) {
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    console.log(`[Resend Attempt] Sending OTP to: ${email} via Resend. From: ${fromEmail}`);
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Nexora Services <${fromEmail}>`,
          to: [email],
          subject: "Your Nexora Verification Code",
          html: htmlContent,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.id) {
        console.log(`[Resend Success] Email sent successfully to ${email}. Message ID: ${resData.id}`);
        return true;
      } else {
        console.error(`[Resend Error] API responded with error:`, resData);
        return false;
      }
    } catch (err) {
      console.error(`[Resend Error] HTTP request failed: ${err.message}`);
      return false;
    }
  }

  // 2. SENDGRID HTTP API DELIVERY
  if (process.env.SENDGRID_API_KEY) {
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || "info@nexora.in";
    console.log(`[SendGrid Attempt] Sending OTP to: ${email} via SendGrid. From: ${fromEmail}`);
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: "Nexora Services" },
          subject: "Your Nexora Verification Code",
          content: [{ type: "text/html", value: htmlContent }],
        }),
      });

      if (response.status === 202 || response.ok) {
        console.log(`[SendGrid Success] Email sent successfully to ${email}.`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[SendGrid Error] API responded with status ${response.status}: ${errText}`);
        return false;
      }
    } catch (err) {
      console.error(`[SendGrid Error] HTTP request failed: ${err.message}`);
      return false;
    }
  }

  // 3. SMTP NODEMAILER FALLBACK (Localhost)
  console.log(`[SMTP Fallback Attempt] Attempting to send OTP email to: ${email}`);
  try {
    const mailOptions = {
      from: `"Nexora Services" <${process.env.EMAIL_USER || "meganodscare@gmail.com"}>`,
      to: email,
      subject: "Your Nexora Verification Code",
      html: htmlContent,
    };

    console.log(`[SMTP Waiting] sendMail started`);
    const sendMailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("SMTP sendMail timed out after 15 seconds")), 15000)
    );

    const info = await Promise.race([sendMailPromise, timeoutPromise]);
    console.log(`[SMTP Success] Email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    if (error.message && error.message.includes("timed out")) {
      console.error(`[SMTP Timeout] Failed to send OTP email to ${email} within 15 seconds. error: ${error.message}`);
    } else {
      console.error(`[SMTP Error] Failed to send OTP email to ${email}. Error: ${error.message}`, error);
    }
    return false;
  }
};

module.exports = {
  sendOTP,
};
