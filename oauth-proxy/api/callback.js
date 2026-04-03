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
        window.opener.postMessage(
          'authorization:github:${status}:' + ${serializedPayload},
          '*'
        );
        window.setTimeout(function () {
          window.close();
        }, 1000);
      }
    }());
  </script>
  <p>Authorizing Decap CMS...</p>
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
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Missing code');
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
    const redirectUri = `${origin}/callback`;
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