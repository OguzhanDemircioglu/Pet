import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './store'
import { loadMeThunk } from './store/authSlice'
import { useAppDispatch } from './hooks/useAppDispatch'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

function AppInner() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(loadMeThunk())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/urunler" element={<ProductListPage />} />
        <Route path="/urun/:slug" element={<ProductDetailPage />} />
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
