import { useSelector } from 'react-redux'
import type { RootState } from '../store'

export function useSiteSettings() {
  return useSelector((s: RootState) => s.siteSettings.data)
}
