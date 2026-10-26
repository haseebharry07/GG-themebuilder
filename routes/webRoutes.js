const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const { isAuthenticated } = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

router.get("/", (req, res) => {
  res.render("support-home");
});

router.get("/documentation", (req, res) => {
  res.render("documentation");
});

router.get("/terms", (req, res) => {
  res.render("terms");
});

router.get("/privacy", (req, res) => {
  res.render("privacy");
});

// Protected route
router.get("/dashboard", isAuthenticated, dashboardController.getDashboard);

router.get("/onboard", isAuthenticated, (req, res) => {
  res.render("onboard", { admin: req.session.admin });
});

// PATCH /dashboard/toggle-status
router.patch("/dashboard/toggle-status", async (req, res) => {
  try {
    const { agencyId, isActive } = req.body;
    if (!agencyId) return res.status(400).json({ error: "agencyId required" });

    const db = await mongoose.connection.asPromise().then(c => c.db);
    const result = await db.collection("userThemes").updateOne(
      { agencyId: String(agencyId).trim() },
      { $set: { isActive: Boolean(isActive) } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Agency not found" });
    }

    return res.json({ success: true, agencyId, isActive });
  } catch (err) {
    console.error("TOGGLE STATUS ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /dashboard/update-emails
router.patch("/dashboard/update-emails", async (req, res) => {
  try {
    const { agencyId, emails } = req.body;
    if (!agencyId) return res.status(400).json({ error: "agencyId required" });

    const db = await mongoose.connection.asPromise().then(c => c.db);

    // Find newly added email compared to existing
    const current = await db.collection("userThemes").findOne({ agencyId });
    const currentEmails = current?.email || [];
    const newEmail = emails.find(e => !currentEmails.includes(e));

    // If there's a new email, check it isn't already used by another agency
    if (newEmail) {
      const existing = await db.collection("userThemes").findOne({
        agencyId: { $ne: agencyId },
        email: newEmail
      });

      if (existing) {
        const agencyInfo = await db.collection("agencyinfos").findOne({
          agencyId: existing.agencyId
        });
        return res.status(400).json({
          error: "EMAIL_EXISTS",
          email: newEmail,
          agencyName: agencyInfo?.agency_name || "Another Agency"
        });
      }
    }

    // Update emails
    await db.collection("userThemes").updateOne(
      { agencyId },
      { $set: { email: emails } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update Emails Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;