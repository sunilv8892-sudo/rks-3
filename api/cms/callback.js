function getPublicOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function clearStateCookie() {
  return 'decap_cms_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0';
}

function escapeForHtml(jsonValue) {
  return JSON.stringify(jsonValue).replace(/</g, '\\u003c');
}

function renderCallbackPage(status, payload) {
  const payloadSafe = escapeForHtml(payload);
  const messageSafe = JSON.stringify(`authorization:github:${status}:${payloadSafe}`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CMS OAuth</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      font-family: Georgia, 'Times New Roman', serif;
      background: #f6efe4;
      color: #1f1a17;
    }
    .card {
      width: min(560px, 100%);
      padding: 24px;
      background: #fffaf2;
      border: 1px solid rgba(31, 26, 23, 0.12);
      border-radius: 16px;
      box-shadow: 0 12px 30px rgba(31, 26, 23, 0.10);
    }
    p {
      margin: 0;
      color: #6f6259;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <main class="card">
    <p id="oauth-status">Completing sign-in...</p>
  </main>

  <script>
    (function () {
      var expectedOrigin = window.location.origin;
      var message = ${messageSafe};
      var statusEl = document.getElementById('oauth-status');
      var completed = false;

      function setText(text) {
        if (statusEl) {
          statusEl.textContent = text;
        }
      }

      if (!window.opener) {
        setText('This page must be opened from the CMS login popup.');
        return;
      }

      function postHandshake() {
        window.opener.postMessage('authorizing:github', expectedOrigin);
      }

      function postResult() {
        window.opener.postMessage(message, expectedOrigin);
      }

      function finish() {
        if (completed) return;
        completed = true;
        postResult();
        setTimeout(function () {
          window.close();
        }, 120);
      }

      window.addEventListener('message', function (event) {
        if (event.origin !== expectedOrigin) {
          return;
        }
        if (event.data === 'authorizing:github') {
          finish();
        }
      });

      postHandshake();

      var attempts = 0;
      var retryTimer = window.setInterval(function () {
        attempts += 1;
        postHandshake();
        postResult();

        if (attempts >= 24) {
          window.clearInterval(retryTimer);
          setText('If this window does not close, switch back to the CMS tab.');
        }
      }, 300);
    }());
  </script>
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
  if (!response.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'GitHub token exchange failed');
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

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || process.env.GITHUB_OAUTH_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || process.env.GITHUB_OAUTH_SECRET;
  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Missing GitHub OAuth credentials');
    return;
  }

  const incomingState = String(req.query.state || '');
  const incomingCode = String(req.query.code || '');
  const oauthError = String(req.query.error || '');

  const cookies = parseCookies(req.headers.cookie);
  const expectedState = String(cookies.decap_cms_oauth_state || '');

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', clearStateCookie());
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (oauthError) {
    res.statusCode = 200;
    res.end(renderCallbackPage('error', { message: oauthError }));
    return;
  }

  if (!incomingCode) {
    res.statusCode = 200;
    res.end(renderCallbackPage('error', { message: 'Missing GitHub code' }));
    return;
  }

  if (!expectedState || incomingState !== expectedState) {
    res.statusCode = 200;
    res.end(renderCallbackPage('error', { message: 'Invalid OAuth state' }));
    return;
  }

  try {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/api/cms/callback`;

    const token = await exchangeCodeForToken({
      clientId,
      clientSecret,
      code: incomingCode,
      redirectUri,
      state: incomingState,
    });

    res.statusCode = 200;
    res.end(renderCallbackPage('success', { token }));
  } catch (error) {
    res.statusCode = 200;
    res.end(renderCallbackPage('error', { message: error.message || 'OAuth failed' }));
  }
};
