# Decap OAuth Proxy

This folder is a separate free Vercel project for GitHub login with Decap CMS.

## What it does

- `/auth` starts the GitHub OAuth flow.
- `/callback` exchanges the GitHub code for an access token and posts it back to Decap.

## Deploy on Vercel

1. Create a second Vercel project from this folder only.
2. Set the project root directory to `oauth-proxy`.
3. Set these environment variables in that project:
   - `GITHUB_OAUTH_ID`
   - `GITHUB_OAUTH_SECRET`
   - `GITHUB_REPO_PRIVATE=1` if the repo is private
4. Create a GitHub OAuth App.
5. Set the OAuth App callback URL to `https://YOUR-PROXY-DOMAIN/callback`.
6. Set the OAuth App homepage URL to `https://YOUR-PROXY-DOMAIN`.

## Update the main site

In [admin/config.yml](../admin/config.yml), replace `base_url` with the proxy project URL.

## Notes

- This proxy is intentionally separate from the main site.
- The main site can stay on Vercel free hosting.
- The proxy can also stay on Vercel free hosting.