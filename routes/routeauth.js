require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const mongoose = require("mongoose");
const Theme = require("../models/UserTheme");
const ThemeTemplate = require("../models/Theme");
const UserScript = require("../models/userScript");
const AgencyInfo = require("../models/AgencyInfo");
const AgencySettings = require("../models/AgencySettings");
const MarketplaceInstallation = require("../models/MarketplaceInstallation");

function getInstallationDetails(data) {
  return data?.installationDetails || data || {};
}

async function createOrUpdateInstallation(details) {
  const companyId = details.companyId || details.locationId;
  if (!companyId) throw new Error("GHL did not return an installation companyId or locationId");

  let installation = await MarketplaceInstallation.findOne({ companyId });
  if (!installation) {
    const builderAgencyId = `ghl_${crypto.randomBytes(16).toString("hex")}`;
    try {
      installation = await MarketplaceInstallation.create({
        companyId,
        builderAgencyId,
        companyName: details.companyName || "",
        companyEmail: details.companyEmail || "",
        locationIds: details.locationId ? [details.locationId] : [],
        userId: details.userId || ""
      });
    } catch (error) {
      // A repeated OAuth callback can race with the first one; reuse its install row.
      if (error.code !== 11000) throw error;
      installation = await MarketplaceInstallation.findOne({ companyId });
    }
  } else {
    installation.companyName = details.companyName || installation.companyName;
    installation.companyEmail = details.companyEmail || installation.companyEmail;
    installation.userId = details.userId || installation.userId;
    if (details.locationId && !installation.locationIds.includes(details.locationId)) {
      installation.locationIds.push(details.locationId);
    }
    installation.updatedAt = new Date();
    await installation.save();
  }

  // Make provisioning safe to retry if any database operation was interrupted.
  const builderAgencyId = installation.builderAgencyId;
  const template = await ThemeTemplate.findOne({ themeName: "Default Theme" }).lean();
  const email = (installation.companyEmail || details.companyEmail || `${companyId}@marketplace.invalid`).toLowerCase();
  let theme = await Theme.findOne({ agencyId: builderAgencyId });
  if (!theme) {
    theme = await Theme.create({
      rlNo: companyId,
      email: [email],
      agencyId: builderAgencyId,
      themeData: template?.themeData || {},
      selectedTheme: template ? "Default Theme" : null,
      bodyFont: template?.themeData?.["--body-font"] || null,
      isActive: true,
      createdBy: "GHL Marketplace"
    });
  }
  await Promise.all([
    AgencyInfo.updateOne({ agencyId: builderAgencyId }, { $setOnInsert: {
      agencyId: builderAgencyId,
      agency_name: installation.companyName || details.companyName || "GHL Marketplace Customer",
      full_name: details.companyOwnerFullName || null,
      relationship_no: details.relationshipNumber || null
    } }, { upsert: true }),
    UserScript.updateOne({ agencyId: builderAgencyId }, { $setOnInsert: {
      email,
      agencyId: builderAgencyId,
      themeId: theme._id,
      customJs: "",
      customCss: ""
    } }, { upsert: true }),
    AgencySettings.updateOne({ agencyId: builderAgencyId }, { $setOnInsert: {
      agencyId: builderAgencyId,
      themeId: theme._id,
      selectedTheme: template ? "Default Theme" : null,
      bodyFont: template?.themeData?.["--body-font"] || null
    } }, { upsert: true })
  ]);

  return installation;
}

async function marketplaceCallback(req, res, credentialSuffix = "_v2") {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing OAuth code");
  const clientId = process.env[`GHL_CLIENT_ID${credentialSuffix}`];
  const clientSecret = process.env[`GHL_CLIENT_SECRET${credentialSuffix}`];
  const redirectUri = process.env[`GHL_REDIRECT_URI${credentialSuffix}`];
  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(503).send("Marketplace OAuth is not configured on this server.");
  }

  try {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      user_type: process.env.GHL_USER_TYPE || "Company",
      redirect_uri: redirectUri
    });
    const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: params.toString()
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("GHL OAuth exchange failed:", tokenData.error || tokenResponse.status);
      return res.status(502).send("Could not complete the GHL installation. Please try installing again.");
    }

    let details = getInstallationDetails(tokenData);
    const appId = process.env.GHL_APP_ID;
    if (appId) {
      const detailsResponse = await fetch(`https://services.leadconnectorhq.com/marketplace/app/${encodeURIComponent(appId)}/installations`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, Version: "v3", Accept: "application/json" }
      });
      if (detailsResponse.ok) details = { ...details, ...getInstallationDetails(await detailsResponse.json()) };
      else console.warn("GHL installer details unavailable:", detailsResponse.status);
    }

    await mongoose.connection.asPromise();
    const installation = await createOrUpdateInstallation(details);
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        console.error("Marketplace session regeneration failed:", regenerateError.message);
        return res.status(500).send("Installation completed, but the app session could not be created. Reopen the app from GHL.");
      }
      req.session.marketplace = {
        companyId: installation.companyId,
        builderAgencyId: installation.builderAgencyId
      };
      req.session.save((error) => {
      if (error) {
        console.error("Marketplace session save failed:", error.message);
        return res.status(500).send("Installation completed, but the app session could not be created. Reopen the app from GHL.");
      }
      res.redirect("/marketplace/app");
      });
    });
  } catch (error) {
    console.error("Marketplace OAuth callback failed:", error.message);
    res.status(500).send("Could not finish setting up your Theme Builder account.");
  }
}

router.get("/oauth/callbackv2", (req, res) => marketplaceCallback(req, res, "_v2"));
router.get("/oauth/callback", (req, res) => marketplaceCallback(req, res, ""));

module.exports = router;
