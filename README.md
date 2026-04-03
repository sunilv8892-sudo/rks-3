# rks-3

Static website with Decap CMS admin on Vercel.

## Admin

- Open `/admin` to launch CMS.
- `/admin` redirects to `/admin/index.html`.

## Authentication

GitHub OAuth runs on same-domain API routes:

- `/api/cms/auth`
- `/api/cms/callback`

Required Vercel environment variables:

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- Optional: `GITHUB_OAUTH_SCOPE` (`repo` by default)

Full setup steps: `CMS_SETUP.md`