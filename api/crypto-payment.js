const { setTransaction } = require('../lib/store');
const { sendEmail }      = require('../lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, userName, amount, cryptoType, txHash } = req.body;

    const paymentId = 'CRYPTO-' + Date.now();

    await setTransaction(paymentId, {
      type: 'crypto',
      email, userName,
      amount, cryptoType, txHash,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
    });

    await sendEmail({
      to_email: process.env.ADMIN_EMAIL,
      to_name:  'Admin',
      subject:  'New Crypto Payment — Verify Required',
      amount:   `$${amount}`,
      extra:    `Type: ${cryptoType} | TxHash: ${txHash} | User: ${userName}`,
    });

    res.json({
      success: true,
      message: 'Submitted for verification',
      paymentId,
    });

  } catch (err) {
    console.error('❌ Crypto error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process' });
  }
};
