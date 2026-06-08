// utils/withRetry.js
async function withRetry(fn, retries = 3, delayMs = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw err;
      console.warn(`⚠️ Retry ${i + 1}/${retries} after error: ${err.message}`);
      await new Promise((res) => setTimeout(res, delayMs * (i + 1))); // backoff
    }
  }
}

module.exports = withRetry;