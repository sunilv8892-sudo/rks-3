const crypto = require('crypto');

function getPublicOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function randomState(size = 24) {
  return crypto.randomBytes(size).toString('hex');
}

module.exports = function authHandler(req, res) {
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

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || process.env.GITHUB_OAUTH_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Missing GitHub OAuth client id');
    return;
  }

  const state = randomState();
  const origin = getPublicOrigin(req);
  const redirectUri = `${origin}/api/cms/callback`;
  const scope = String(req.query.scope || process.env.GITHUB_OAUTH_SCOPE || 'repo');

  res.statusCode = 302;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Set-Cookie',
    `decap_cms_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`,
  );

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);

  res.setHeader('Location', authUrl.toString());
  res.end();
};
