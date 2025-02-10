const axios = require('axios');
require('dotenv').config();

const forJawalyInstance = axios.create({
  baseURL: process.env.FORJAWALY_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  auth: {
    username: process.env.FORJAWALY_KEY,
    password: process.env.FORJAWALY_SECRET,
  },
});
async function sendSMS(phone, message) {
  const data = {
    messages: [
      {
        text: message,
        numbers: [phone],
        sender: process.env.FORJAWALY_SENDER || 'TechPack',
      },
    ],
  };

  try {
    const response = await forJawalyInstance.post('/account/area/sms/send', data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error sending SMS (response):', error.response.data);
    } else {
      console.error('Error sending SMS (message):', error.message);
    }
    throw error;
  }
}

module.exports = { sendSMS };
