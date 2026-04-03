# Deployment Notes

The Decap/Netlify CMS stack has been removed.

## Current content workflow
1. Edit markdown files in the content folder.
2. Commit and push to GitHub.
3. Deploy from GitHub to your hosting platform (Vercel in current setup).

## Admin status
- /admin is disabled.
- admin/config.yml no longer exists.
- Netlify Identity and Git Gateway are not required.

## Verify after deploy
1. Confirm pages load correctly.
2. Confirm content changes from content/*.md appear on the site.
3. Confirm committee and gallery updates from content/committee and content/gallery appear correctly.
