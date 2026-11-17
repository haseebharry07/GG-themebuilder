# GHL Marketplace setup

The Marketplace install callback provisions a Theme Builder tenant from the GHL company/location identity. The sidebar page at `/marketplace/app` uses the OAuth-created session to load only that tenant's saved snippets.

## Server environment

Set these on the deployed server:

- `GHL_CLIENT_ID_v2`, `GHL_CLIENT_SECRET_v2`: the Marketplace OAuth client credentials.
- `GHL_REDIRECT_URI_v2`: the exact HTTPS callback URL `https://YOUR_APP_HOST/oauth/callbackv2`.
- `GHL_APP_ID`: the Marketplace app ID (used to fetch installer details; it is different from the OAuth client ID).
- `GHL_USER_TYPE`: token type matching the Marketplace app installation (`Company` for agency installs; use `Location` for a location-targeted app).
- `APP_BASE_URL`: the canonical HTTPS origin, such as `https://app.example.com`.
- `SESSION_SECRET`: a long random secret dedicated to Express sessions.
- `MONGO_URI`: the production MongoDB connection string. The app stores customer sessions in MongoDB so restarts and multiple app instances retain login state.
- `JWT_SECRET`: still used by the existing admin API authentication.

Use HTTPS in production. The app session cookie is `HttpOnly`, `Secure`, and `SameSite=None` so it can be sent when GHL embeds the sidebar page in an iframe.

## Marketplace developer portal

1. Configure the OAuth redirect URL to exactly match `GHL_REDIRECT_URI_v2`.
2. Add the `marketplace-installer-details.readonly` scope if you want the callback to display the verified company name and owner details. The callback also uses company/location identifiers returned by OAuth. Set `GHL_USER_TYPE` to match the target user selected in the app's OAuth settings.
3. Add a custom menu/sidebar module whose URL is `https://YOUR_APP_HOST/marketplace/app`. Use the app's supported iframe launch option if you want it embedded in GHL.
4. Use an agency/company-level installation for the current per-agency Whitelabel script model. For agency bulk installs or future locations, configure and implement the App Install webhook and location-token flow before enabling those distribution options.
5. Set the install callback to `/oauth/callbackv2`; do not use `/connected?token=...`. The callback never puts OAuth tokens in a browser URL.

## Customer instructions shown in the app

After installation, the sidebar page displays the account's Custom CSS and Custom JavaScript snippets with copy buttons and instructions for adding each to the GHL Whitelabel settings. The snippets point to the existing Theme Builder CSS/JS delivery endpoints and use the internal tenant identifier provisioned for that GHL company.

Before public release, confirm in a GHL Marketplace test app that OAuth returns the expected `companyId` (or `locationId` for a location install), the callback matches the portal configuration, and the sidebar module opens `/marketplace/app` with cookies enabled.
