const { kv } = require('@vercel/kv');

// Save a transaction
async function setTransaction(id, data) {
  try {
    await kv.set(`tx:${id}`, JSON.stringify(data));
    // Expire after 30 days
    await kv.expire(`tx:${id}`, 60 * 60 * 24 * 30);
    console.log(`✅ Transaction saved: ${id}`);
  } catch (err) {
    console.error('❌ KV set error:', err.message);
    throw err;
  }
}

// Get a transaction
async function getTransaction(id) {
  try {
    const data = await kv.get(`tx:${id}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('❌ KV get error:', err.message);
    return null;
  }
}

// Update a transaction
async function updateTransaction(id, updates) {
  try {
    const existing = await getTransaction(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    await kv.set(`tx:${id}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('❌ KV update error:', err.message);
    throw err;
  }
}

// Get all transactions
async function getAllTransactions() {
  try {
    const keys = await kv.keys('tx:*');
    if (!keys.length) return [];
    const all = await Promise.all(
      keys.map(async key => {
        const data = await kv.get(key);
        return {
          id: key.replace('tx:', ''),
          ...JSON.parse(data)
        };
      })
    );
    return all.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  } catch (err) {
    console.error('❌ KV getAll error:', err.message);
    return [];
  }
}

module.exports = {
  setTransaction,
  getTransaction,
  updateTransaction,
  getAllTransactions
};
