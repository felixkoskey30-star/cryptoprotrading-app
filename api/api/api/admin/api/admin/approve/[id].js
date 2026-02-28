const { getTransaction, updateTransaction } = require('../../../lib/store');
const { sendEmail } = require('../../../lib/email');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const tx = await getTransaction(req.query.id);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    await updateTransaction(req.query.id, {
      status: 'completed',
      approvedAt: new Date().toISOString(),
    });

    await sendEmail({
      to_email: tx.email,
      to_name:  tx.userName,
      subject:  'Deposit Approved — CryptoPro',
      amount:   `$${tx.amount}`,
      extra:    'Your deposit has been verified and credited.',
    });

    res.json({ success: true, message: 'Transaction approved' });

  } catch (err) {
    console.error('❌ Approve error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to approve' });
  }
};
