# Netlify Deployment (Free)

This site is fully static and uses Decap CMS for editing.

## 1. Push to GitHub
1. Commit all project files.
2. Push to your GitHub repository.

## 2. Connect to Netlify
1. Netlify -> Add new site -> Import from Git.
2. Select your GitHub repository.
3. Build command: leave blank.
4. Publish directory: .

## 3. Enable Identity
1. Site dashboard -> Identity.
2. Click Enable Identity.

## 4. Enable Git Gateway
1. Identity -> Services -> Git Gateway.
2. Enable and authorize GitHub.

## 5. Invite Admin User
1. Identity -> Invite users.
2. Send invite email.
3. Accept invite and create password.

## 6. Verify CMS
1. Open /admin.
2. Login via Netlify Identity.
3. Create/update committee and gallery entries.
4. Publish changes.

## 7. Verify Public Site
1. Confirm all pages load and keep original theme.
2. Confirm home/about/facilities/terms/contact content updates from markdown.
3. Confirm committee and gallery cards update after publish.

## 8. Required Config Check
In admin/config.yml set:

```yml
site_content_source:
   repo: your-github-username/your-repository-name
   branch: main
```

Without this value, committee/gallery folder listing cannot be fetched on public pages.
