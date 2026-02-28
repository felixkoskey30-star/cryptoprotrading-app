const { getToken, generatePassword, formatPhone, MPESA } = require('../lib/mpesa');
const { setTransaction } = require('../lib/store');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, amount, email, userName } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Phone and amount required'
      });
    }

    const phone     = formatPhone(phoneNumber);
    const kesAmount = Math.ceil(parseFloat(amount) * 130);
    const token     = await getToken();
    const { password, timestamp } = generatePassword();

    const payload = {
      BusinessShortCode: MPESA.BUSINESS_SHORT_CODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            kesAmount,
      PartyA:            phone,
      PartyB:            MPESA.BUSINESS_SHORT_CODE,
      PhoneNumber:       phone,
      CallBackURL:       MPESA.CALLBACK_URL,
      AccountReference:  'CryptoPro',
      TransactionDesc:   `Deposit $${amount}`,
    };

    const { data } = await axios.post(MPESA.STK_URL, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const txId = data.CheckoutRequestID;

    // Save to Vercel KV — persists forever
    await setTransaction(txId, {
      email,
      userName,
      amount,
      kesAmount,
      phoneNumber: phone,
      status: 'pending',
      type: 'mpesa',
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: 'STK Push sent. Check your phone.',
      checkoutRequestID: txId,
      merchantRequestID: data.MerchantRequestID,
    });

  } catch (err) {
    console.error('❌ STK Push error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.errorMessage || 'Failed to initiate payment',
    });
  }
};
