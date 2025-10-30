const generateOTPCode = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = Date.now() + 10 * 60 * 1000; 
  return { otp, expiresAt };
};

module.exports = generateOTPCode;
