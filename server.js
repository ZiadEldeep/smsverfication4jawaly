const express = require('express');
const bcrypt = require('bcrypt');
const { sendSMS } = require('./services/forjawalyService');
require('dotenv').config();

const app = express();
app.use(express.json());

app.use(express.static('public'));

const phoneRecords = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, errors: 'Phone is required.' });
  }

  const otp = generateOTP();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000);

  const hashedOTP = await bcrypt.hash(otp, 10);

  phoneRecords[phone] = {
    phone,
    verification_code: hashedOTP,
    current_code_expired_at: expirationTime,
    verified_at: null,
  };

  console.log(`Sending OTP to ${phone} with code ${otp}`);

  try {
    const result = await sendSMS(phone, `كود التحقق لحسابك هو: ${otp}`);

    if (result.code === 200) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        phone: phone,
        otp: otp,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.message || 'An error occurred while sending OTP',
      });
    }
  } catch (error) {
    console.error('Failed to send OTP:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.',
    });
  }
});

app.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
  }

  const phoneRecord = phoneRecords[phone];
  if (!phoneRecord) {
    return res.status(404).json({ success: false, message: 'Phone number not found.' });
  }

  if (new Date() > new Date(phoneRecord.current_code_expired_at)) {
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  const match = await bcrypt.compare(otp, phoneRecord.verification_code);
  if (match) {
    phoneRecord.verified_at = new Date();
    return res.status(200).json({
      success: true,
      message: 'Phone number verified successfully.',
      phone: phone,
      isVerified: true,
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP. Please try again.',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
