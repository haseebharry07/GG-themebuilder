const mongoose = require("mongoose");

const marketplaceInstallationSchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true, index: true },
  builderAgencyId: { type: String, required: true, unique: true, index: true },
  companyName: { type: String, default: "" },
  companyEmail: { type: String, default: "" },
  locationIds: { type: [String], default: [] },
  userId: { type: String, default: "" },
  installedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: false });

module.exports = mongoose.models.MarketplaceInstallation ||
  mongoose.model("MarketplaceInstallation", marketplaceInstallationSchema);
