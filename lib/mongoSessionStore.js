const session = require("express-session");
const connectDB = require("./mongo");

class MongoSessionStore extends session.Store {
  constructor() {
    super();
    this.collectionName = "sessions";
    this.indexReady = null;
  }

  async collection() {
    await connectDB();
    const collection = require("mongoose").connection.collection(this.collectionName);
    if (!this.indexReady) {
      this.indexReady = collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((error) => {
        this.indexReady = null;
        throw error;
      });
    }
    await this.indexReady;
    return collection;
  }

  get(sid, callback) {
    this.collection()
      .then((collection) => collection.findOne({ _id: sid, expiresAt: { $gt: new Date() } }))
      .then((record) => callback(null, record ? record.session : null))
      .catch((error) => callback(error));
  }

  set(sid, value, callback = () => {}) {
    const expiry = value.cookie?.expires ? new Date(value.cookie.expires) : new Date(Date.now() + (value.cookie?.maxAge || 86400000));
    this.collection()
      .then((collection) => collection.updateOne(
        { _id: sid },
        { $set: { session: value, expiresAt: expiry } },
        { upsert: true }
      ))
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  touch(sid, value, callback = () => {}) {
    const expiry = value.cookie?.expires ? new Date(value.cookie.expires) : new Date(Date.now() + (value.cookie?.maxAge || 86400000));
    this.collection()
      .then((collection) => collection.updateOne({ _id: sid }, { $set: { expiresAt: expiry } }))
      .then(() => callback(null))
      .catch((error) => callback(error));
  }

  destroy(sid, callback = () => {}) {
    this.collection()
      .then((collection) => collection.deleteOne({ _id: sid }))
      .then(() => callback(null))
      .catch((error) => callback(error));
  }
}

module.exports = MongoSessionStore;
