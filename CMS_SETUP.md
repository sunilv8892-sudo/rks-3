# Decap CMS Full Auth Flow (Vercel + GitHub)

This project uses Decap CMS at `/admin` with GitHub OAuth authentication.

## 1. GitHub OAuth App
Create a GitHub OAuth App and set:

- Homepage URL: `https://YOUR_SITE_DOMAIN`
- Authorization callback URL: `https://YOUR_SITE_DOMAIN/api/cms/callback`

Use your production site domain for both values.

## 2. Vercel Environment Variables
In your Vercel project, add:

- `GITHUB_OAUTH_CLIENT_ID` = OAuth app Client ID
- `GITHUB_OAUTH_CLIENT_SECRET` = OAuth app Client Secret
- Optional: `GITHUB_OAUTH_SCOPE` = `repo` (default)

## 3. Deploy
Push the repository so Vercel deploys:

- `admin/index.html` (Decap dashboard bootstrap)
- `admin/config.yml` (collections)
- `api/cms/auth.js` (OAuth start)
- `api/cms/callback.js` (OAuth callback + Decap handshake)

## 4. Login Flow
1. Open `/admin`.
2. Decap opens GitHub login popup.
3. Popup goes to `/api/cms/auth` then GitHub authorize.
4. GitHub returns to `/api/cms/callback`.
5. Callback sends success message to Decap and closes popup.
6. Decap dashboard loads with editable collections.

## 5. Access Rules
- GitHub users must have write access to `sunilv8892-sudo/rks-3`.
- Without write access, Decap login may succeed but content operations will fail.

## 6. Troubleshooting
- If login fails, verify callback URL matches your exact deployed domain.
- If popup does not close, confirm `/admin` and `/api/cms/*` are on the same domain.
- If token exchange fails, re-check `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`.
