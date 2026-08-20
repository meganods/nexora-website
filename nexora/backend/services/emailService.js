const nodemailer = require("nodemailer");

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
    // Strip surrounding quotes if present (common env var mistake)
    pass: (process.env.EMAIL_PASS || process.env.EMAIL_SERVER_PASSWORD || "").replace(/^["']|["']$/g, ""),
  },
  tls: {
    rejectUnauthorized: false,  // Allow self-signed certs (Render sandbox)
  },
});

console.log("[SMTP Config] host=smtp.gmail.com port=587 secure=false family=4");

const net = require("net");
const socket = net.connect(587, "smtp.gmail.com", () => {
  console.log("[SMTP Diagnostics] TCP connection to smtp.gmail.com:587 established SUCCESSFULLY from Render runtime.");
  socket.destroy();
});

socket.on("error", (err) => {
  console.error("[SMTP Diagnostics] TCP connection to smtp.gmail.com:587 FAILED from Render runtime. Error:", err.message);
});

socket.setTimeout(10000, () => {
  console.error("[SMTP Diagnostics] TCP connection to smtp.gmail.com:587 TIMED OUT (10s) from Render runtime.");
  socket.destroy();
});

// Verify SMTP connection on startup so we catch config errors early in logs
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP transporter verify FAILED:", error.message);
  } else {
    console.log("SMTP transporter ready — emails can be sent.");
  }
});

const sendOTP = async (email, otp) => {
  console.log(`[OTP Request] Received request for email address: ${email}`);
  try {
    const mailOptions = {
      from: `"Nexora Services" <${process.env.EMAIL_USER || "meganodscare@gmail.com"}>`,
      to: email,
      subject: "Your Nexora Verification Code",
      html: `
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
      `,
    };

    console.log(`[SMTP Attempt] Attempting to send OTP email to: ${email}`);
    console.log(`[SMTP Waiting] sendMail started`);

    // Wrap the sendMail call in a promise race with a 15-second timeout
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
