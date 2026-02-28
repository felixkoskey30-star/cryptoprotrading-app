const { setTransaction } = require('../lib/store');
const { sendEmail }      = require('../lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, userName, amount, reference } = req.body;

    const paymentId = 'BANK-' + Date.now();

    await setTransaction(paymentId, {
      type: 'bank',
      email, userName,
      amount, reference,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
    });

    await sendEmail({
      to_email: process.env.ADMIN_EMAIL,
      to_name:  'Admin',
      subject:  'New Bank Transfer — Verify Required',
      amount:   `$${amount}`,
      extra:    `Reference: ${reference} | User: ${userName} (${email})`,
    });

    res.json({
      success: true,
      message: 'Bank transfer submitted',
      paymentId,
    });

  } catch (err) {
    console.error('❌ Bank error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to process' });
  }
};
