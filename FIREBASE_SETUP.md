# Decap CMS Setup Guide

This project uses Decap CMS with Netlify Identity + Git Gateway.

## 1. Prepare GitHub Repository
1. Push the project to a GitHub repository.
2. Confirm admin/config.yml is committed.

## 2. Configure CMS Repo Mapping
Open admin/config.yml and set:

```yml
site_content_source:
  repo: your-github-username/your-repository-name
  branch: main
```

This is used by the frontend to load committee and gallery folder entries.

## 3. Enable Netlify Identity
1. Open your site dashboard in Netlify.
2. Go to Identity.
3. Click Enable Identity.

## 4. Enable Git Gateway
1. In the same Identity section, enable Git Gateway.
2. Authorize GitHub when prompted.

## 5. Invite Admin Users
1. Identity -> Invite users.
2. Send invite to content managers.
3. They set password through email invite.

## 6. Access CMS
1. Visit /admin.
2. Login with invited account.
3. Edit Pages, Committee, and Gallery collections.

## 7. Content Paths
- Pages: content/home.md, content/about.md, content/facilities.md, content/terms.md, content/contact.md
- Committee: content/committee/*.md
- Gallery: content/gallery/*.md
- Uploads: images/uploads

## 8. Publishing Flow
1. Create or edit content in CMS.
2. Click Publish.
3. CMS commits changes to GitHub.
4. Netlify auto-deploys updated site.
