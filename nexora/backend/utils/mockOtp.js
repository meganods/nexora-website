const OTP_TTL_MS = 5 * 60 * 1000;

const otpStore = new Map();

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const storeOtp = (phone) => {
  const otp = generateOtp();
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS });
  return otp;
};

const verifyOtp = (phone, otp) => {
  const record = otpStore.get(phone);

  if (!record) {
    return { valid: false, message: "OTP not found or expired. Request a new one." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, message: "OTP has expired. Request a new one." };
  }

  if (record.otp !== otp) {
    return { valid: false, message: "Invalid OTP." };
  }

  otpStore.delete(phone);
  return { valid: true };
};

module.exports = { storeOtp, verifyOtp };
