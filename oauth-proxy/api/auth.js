const crypto = require('crypto');

function getPublicOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

function randomState(length = 16) {
  return crypto.randomBytes(length).toString('hex');
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

  const clientId = process.env.GITHUB_OAUTH_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Missing GITHUB_OAUTH_ID');
    return;
  }

  const privateRepo = process.env.GITHUB_REPO_PRIVATE != null && process.env.GITHUB_REPO_PRIVATE !== '0';
  const scope = privateRepo ? 'repo,user' : 'public_repo,user';
  const origin = getPublicOrigin(req);
  const redirectUri = `${origin}/callback?provider=github`;
  const state = randomState();

  res.statusCode = 302;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader(
    'Set-Cookie',
    `decap_github_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`,
  );

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope);
  authorizeUrl.searchParams.set('state', state);

  res.setHeader('Location', authorizeUrl.toString());
  res.end();
};