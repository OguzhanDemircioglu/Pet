import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useSelector } from 'react-redux'
import { store } from './store'
import { loadMeThunk } from './store/authSlice'
import { fetchNotificationsThunk } from './store/notificationSlice'
import { fetchHomepageThunk } from './store/campaignSlice'
import { fetchCatalogThunk } from './store/productSlice'
import { fetchSiteSettingsThunk } from './store/siteSettingsSlice'
import { fetchAllowedRoutesThunk } from './store/routesSlice'
import { useAppDispatch } from './hooks/useAppDispatch'
import { ThemeProvider } from './context/ThemeContext'
import type { RootState } from './store'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfilePage from './pages/ProfilePage'
import PaymentResultPage from './pages/PaymentResultPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import FAQPage from './pages/FAQPage'
import PhoneRequiredModal from './components/PhoneRequiredModal'
import RouteGuard from './components/RouteGuard'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function AppInner() {
  const dispatch = useAppDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const authInitialized = useSelector((s: RootState) => s.auth.initialized)

  useEffect(() => {
    dispatch(loadMeThunk())
    dispatch(fetchSiteSettingsThunk())
    dispatch(fetchAllowedRoutesThunk())
    dispatch(fetchHomepageThunk())
    const t = setTimeout(() => dispatch(fetchCatalogThunk()), 2000)
    return () => clearTimeout(t)
  }, [dispatch])

  useEffect(() => {
    if (user) dispatch(fetchNotificationsThunk())
  }, [user, dispatch])

  if (authInitialized && user && !user.phone) {
    return <PhoneRequiredModal />
  }

  return (
    <BrowserRouter>
      <RouteGuard>
        <Routes>
          <Route path="/"                    element={<HomePage />} />
          <Route path="/login"               element={<LoginPage />} />
          <Route path="/urunler"             element={<ProductListPage />} />
          <Route path="/urun/:slug"          element={<ProductDetailPage />} />
          <Route path="/profil"              element={<ProfilePage />} />
          <Route path="/odeme-sonuc"         element={<PaymentResultPage />} />
          <Route path="/hakkimizda"          element={<AboutPage />} />
          <Route path="/iletisim"            element={<ContactPage />} />
          <Route path="/gizlilik-politikasi" element={<PrivacyPolicyPage />} />
          <Route path="/sss"                 element={<FAQPage />} />
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </RouteGuard>
      <Toaster position="top-right" />
    </BrowserRouter>
  )
}

function AppWithProviders() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </Provider>
  )
}

export default function App() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppWithProviders />
      </GoogleOAuthProvider>
    )
  }
  return <AppWithProviders />
}
