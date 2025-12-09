/*
 * Rate limiter instance exported for admin functions
 */
import MassRateLimiter from '../utils/MassRateLimiter';
import { HOUR } from '../core/constants';

const rateLimiter = new MassRateLimiter(HOUR);

export default rateLimiter;
