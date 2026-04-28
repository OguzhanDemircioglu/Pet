import { matchPath } from 'react-router-dom'

export type RouteBucket = 'public' | 'customer' | 'admin' | null

export function findBucket(
  pathname: string,
  buckets: { publicRoutes: string[]; customerRoutes: string[]; adminRoutes: string[] },
): RouteBucket {
  const tryMatch = (patterns: string[]) => patterns.some(p => matchPath(p, pathname) !== null)
  if (tryMatch(buckets.adminRoutes)) return 'admin'
  if (tryMatch(buckets.customerRoutes)) return 'customer'
  if (tryMatch(buckets.publicRoutes)) return 'public'
  return null
}
