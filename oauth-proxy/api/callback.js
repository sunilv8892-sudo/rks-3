function getPublicOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) {
        return acc;
      }
      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function renderCallbackPage(status, payload) {
  const serializedPayload = JSON.stringify(payload);
  const callbackMessage = JSON.stringify(`authorization:github:${status}:${serializedPayload}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Decap OAuth</title>
</head>
<body>
  <script>
    (function () {
      if (window.opener) {
        function receiveMessage() {
          window.opener.postMessage(${callbackMessage}, '*');
          window.removeEventListener('message', receiveMessage, false);
          window.setTimeout(function () {
            window.close();
          }, 250);
        }

        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      }
    }());
  </script>
  <p>Authorizing Decap CMS...</p>
</body>
</html>`;
}

function renderHelpPage(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Decap OAuth</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f6efe4;
      color: #1f1a17;
      padding: 24px;
    }
    main {
      max-width: 560px;
      background: #fffaf2;
      border: 1px solid rgba(31, 26, 23, 0.12);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(31, 26, 23, 0.12);
    }
    p { line-height: 1.65; color: #6f6259; }
    a {
      display: inline-flex;
      margin-top: 16px;
      padding: 12px 18px;
      border-radius: 999px;
      text-decoration: none;
      color: white;
      background: linear-gradient(135deg, #8c5a33, #6a3f20);
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main>
    <h1>OAuth callback</h1>
    <p>${message}</p>
    <p>Open the proxy homepage and click Start GitHub Login instead.</p>
    <a href="/">Go to homepage</a>
  </main>
</body>
</html>`;
}

async function exchangeCodeForToken({ clientId, clientSecret, code, redirectUri, state }) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      state,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange GitHub code');
  }

  if (!data.access_token) {
    throw new Error('GitHub did not return an access token');
  }

  return data.access_token;
}

module.exports = async function callbackHandler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Method Not Allowed');
    return;
  }

  const provider = String(req.query.provider || '');
  if (provider !== 'github') {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Invalid provider');
    return;
  }

  const clientId = process.env.GITHUB_OAUTH_ID;
  const clientSecret = process.env.GITHUB_OAUTH_SECRET;
  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Missing GitHub OAuth credentials');
    return;
  }

  const code = String(req.query.code || '');
  const returnedState = String(req.query.state || '');
  if (!code) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderHelpPage('This endpoint is working, but GitHub did not send an authorization code. That usually means you opened /callback directly instead of coming back from GitHub login.'));
    return;
  }

  const cookies = parseCookies(req.headers.cookie);
  const expectedState = cookies.decap_github_oauth_state || '';
  if (expectedState && returnedState !== expectedState) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Invalid OAuth state');
    return;
  }

  try {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/callback?provider=github`;
    const token = await exchangeCodeForToken({
      clientId,
      clientSecret,
      code,
      redirectUri,
      state: returnedState,
    });

    res.statusCode = 200;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderCallbackPage('success', { token }));
  } catch (error) {
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(renderCallbackPage('error', { message: error.message || 'GitHub OAuth failed' }));
  }
};