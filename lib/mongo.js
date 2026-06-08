const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (cached.conn) {
    // Verify connection is still alive
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    }
    // Connection dropped, reset and reconnect
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000, // Increase from 5s to 10s
      socketTimeoutMS: 45000,          // Increase from 10s to 45s
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true,               // Add retry on read failures
    };

    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        cached.promise = null; // Always reset on failure
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;