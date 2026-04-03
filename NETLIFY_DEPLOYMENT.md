# Deployment Notes (Vercel + Decap CMS)

## Current setup
- Hosting: Vercel
- CMS: Decap at `/admin`
- Auth: GitHub OAuth using same-domain API routes:
	- `/api/cms/auth`
	- `/api/cms/callback`

## Deploy flow
1. Push changes to GitHub.
2. Vercel auto-deploys from the repository.
3. Open `/admin` and log in with GitHub.

## Required environment variables on Vercel
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- Optional: `GITHUB_OAUTH_SCOPE` (`repo` by default)

## Verify after deploy
1. Confirm site pages load correctly.
2. Confirm `/admin` opens Decap login.
3. Confirm GitHub login returns to Decap dashboard.
4. Confirm edits from CMS commit to GitHub and appear on site after redeploy.
