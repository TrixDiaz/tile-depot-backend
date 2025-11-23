const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000); // 6 digit OTP
};

const generateOTPExpiresAt = () => {
  // Create date 10 minutes from now in Asia/Manila timezone
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now

  // Get the timezone offset for Asia/Manila (UTC+8)
  const manilaOffset = 8 * 60; // 8 hours in minutes
  const utcTime = new Date(
    expiresAt.getTime() + expiresAt.getTimezoneOffset() * 60000
  );
  const manilaTime = new Date(utcTime.getTime() + manilaOffset * 60000);

  return manilaTime;
};

export {generateOTP, generateOTPExpiresAt};
