import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { store } from './store'
import { loadMeThunk } from './store/authSlice'
import { useAppDispatch } from './hooks/useAppDispatch'
import { ThemeProvider } from './context/ThemeContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'

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

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </Provider>
  )
}
