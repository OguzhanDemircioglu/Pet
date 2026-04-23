import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '../store'
import { updateUserPhone } from '../store/authSlice'
import { authApi } from '../api/authApi'
import { PHONE_RE } from '../constants/regex'
import { useSiteSettings } from '../hooks/useSiteSettings'
import PhoneInput from './PhoneInput'

export default function PhoneRequiredModal() {
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)
  const settings = useSiteSettings()
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!PHONE_RE.test(phoneVal)) {
      setPhoneError('05XX XXX XX XX formatında girin')
      return
    }
    const val = phoneVal.replace(/\s/g, '')
    setSaving(true)
    try {
      await authApi.updatePhone(val)
      dispatch(updateUserPhone(val))
    } catch {
      setPhoneError('Bir hata oluştu, tekrar deneyin')
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--bg2)', borderRadius: 'var(--r2)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 60px rgba(0,0,0,.18)',
        padding: '40px 36px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
          <img src="/logo.svg" alt="Logo" style={{ width: 36, height: 36 }} />
          <span style={{ fontSize: 20, fontWeight: 900 }}>
            <span style={{ color: 'var(--primary)' }}>{settings.brandPart1}</span>
            <span style={{ color: 'var(--accent)' }}>{settings.brandPart2}</span>
          </span>
        </div>

        <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>

        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Merhaba {user?.firstName}!
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.6 }}>
          Devam etmek için telefon numaranı gir.<br />
          Sipariş bildirimlerinde kullanılacak.
        </p>

        <div style={{ textAlign: 'left', marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
            Telefon Numarası *
          </label>
          <PhoneInput
            value={phoneVal}
            onChange={v => { setPhoneVal(v); setPhoneError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            style={{
              width: '100%', height: 48,
              border: `1.5px solid ${phoneError ? '#dc2626' : 'var(--border)'}`,
              borderRadius: 'var(--r)',
              background: phoneError ? '#fef2f2' : 'var(--bg3)',
              color: 'var(--text)', fontSize: 16,
              padding: '0 14px', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
              transition: 'border-color .15s',
            }}
          />
          {phoneError && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>{phoneError}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 5 }}>
            Format: 05XX XXX XX XX
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--r)',
            padding: '14px 0', fontSize: 15, fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: '0.2s',
          }}
        >
          {saving ? 'Kaydediliyor...' : 'Devam Et →'}
        </button>
      </div>
    </div>
  )
}
