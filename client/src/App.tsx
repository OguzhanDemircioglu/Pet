import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useSelector } from 'react-redux'
import { store } from './store'
import { loadMeThunk } from './store/authSlice'
import { fetchNotificationsThunk } from './store/notificationSlice'
import { useAppDispatch } from './hooks/useAppDispatch'
import { ThemeProvider } from './context/ThemeContext'
import type { RootState } from './store'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfilePage from './pages/ProfilePage'
import PhoneRequiredModal from './components/PhoneRequiredModal'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function AppInner() {
  const dispatch = useAppDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const authLoading = useSelector((s: RootState) => s.auth.loading)

  useEffect(() => {
    dispatch(loadMeThunk())
  }, [dispatch])

  useEffect(() => {
    if (user) dispatch(fetchNotificationsThunk())
  }, [user, dispatch])

  if (!authLoading && user && !user.phone) {
    return <PhoneRequiredModal />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/urunler" element={<ProductListPage />} />
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
        <Route path="/profil" element={<ProfilePage />} />
      </Routes>
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
