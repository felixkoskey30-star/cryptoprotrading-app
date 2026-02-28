const { getAllTransactions } = require('../../lib/store');

module.exports = async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const all = await getAllTransactions();
    res.json({
      success: true,
      count: all.length,
      transactions: all,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch' });
  }
};
