/*
 *
 */
import session from 'express-session';
import RedisStore from '../utils/connectRedis';

import client from '../data/redis/client';
import { getHostFromRequest } from '../utils/ip';
import { HOUR, COOKIE_SESSION_NAME } from './constants';
import { SESSION_SECRET, SHARD_NAME } from './config';


const middlewareStore = {};

export default (req, res, next) => {
  const domain = (SHARD_NAME)
    ? getHostFromRequest(req, false, true)
    : null;
  // Check if HTTPS is being used (via X-Forwarded-Proto header or direct connection)
  const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.secure;
  const storeKey = `${domain || 'default'}_${isSecure ? 'secure' : 'insecure'}`;
  
  let sess = middlewareStore[storeKey];
  if (!sess) {
    const store = new RedisStore({ client });
    sess = session({
      name: COOKIE_SESSION_NAME,
      store,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain,
        httpOnly: true,
        // Set secure flag in production when HTTPS is detected
        secure: process.env.NODE_ENV === 'production' && isSecure,
        sameSite: 'lax', // CSRF protection
        maxAge: 30 * 24 * HOUR,
      },
    });
    middlewareStore[storeKey] = sess;
  }
  return sess(req, res, next);
};
