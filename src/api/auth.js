import client from './client';

// Confirmed against the real frugull-backend repo (authController.js):
//
//   POST /auth/send-code    { email }                  -> { message }
//   POST /auth/signup       { email, code, username }  -> 201 { user, token }
//   POST /auth/verify-code  { email, code }             -> { user, token }
//                                                           404 { error } if no account yet
//   POST /auth/logout       (auth header)               -> { message }
//   GET  /auth/me           (auth header)                -> { user }
//
// Error responses use the key `error`, not `message`.
//
// "user" row (from users table):
//   { id, email, username, email_verified, points_balance, rank_tier,
//     wants_email_updates, created_at, updated_at }
//   rank_tier is one of: egg | baby_gull | gull | frugull | gullfather

export async function sendCode(email) {
  const { data } = await client.post('/auth/send-code', { email });
  return data;
}

export async function signup({ email, code, username }) {
  const { data } = await client.post('/auth/signup', { email, code, username });
  return data;
}

export async function verifyCode({ email, code }) {
  const { data } = await client.post('/auth/verify-code', { email, code });
  return data;
}

export async function logout() {
  const { data } = await client.post('/auth/logout');
  return data;
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data;
}
