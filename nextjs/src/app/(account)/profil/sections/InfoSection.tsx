'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { authClientApi } from '@/lib/api'
import { PHONE_RE } from '@/lib/constants'
import { useIsMobile } from '@/hooks/useIsMobile'
import SectionHead from './SectionHead'
import PhoneInput from '@/components/common/PhoneInput'

interface Props {
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    pendingEmailChange: boolean
  }
}

export default function InfoSection({ user }: Props) {
  const { update: updateSession } = useSession()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [emailChangeOpen, setEmailChangeOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const validateName = (value: string, label: string) => {
    if (!value.trim()) return `${label} zorunludur`
    if (/\d/.test(value)) return `${label} rakam içeremez`
    if (value.trim().length > 20) return `${label} en fazla 20 karakter olabilir`
    return ''
  }
  const validatePhone = (v: string) => {
    if (!v) return 'Telefon numarası zorunludur'
    if (!PHONE_RE.test(v)) return '05XX XXX XX XX formatında girin'
    return ''
  }

  const handleFieldChange = (key: keyof typeof form, value: string) => {
    const sanitized = (key === 'firstName' || key === 'lastName')
      ? value.replace(/\d/g, '').slice(0, 20)
      : value
    setForm(p => ({ ...p, [key]: sanitized }))
    if (key === 'firstName' || key === 'lastName') {
      setFormErrors(p => ({ ...p, [key]: validateName(sanitized, key === 'firstName' ? 'Ad' : 'Soyad') }))
    } else {
      setFormErrors(p => ({ ...p, phone: '' }))
    }
  }

  const handleSave = async () => {
    const firstNameErr = validateName(form.firstName, 'Ad')
    const lastNameErr = validateName(form.lastName, 'Soyad')
    const phoneErr = validatePhone(form.phone)
    if (firstNameErr || lastNameErr || phoneErr) {
      setFormErrors({ firstName: firstNameErr, lastName: lastNameErr, phone: phoneErr })
      return
    }
    setSaving(true)
    try {
      await authClientApi.updateProfile(form.firstName.trim(), form.lastName.trim(), form.phone.replace(/\s/g, ''))
      // NextAuth session'ı güncelle (sidebar avatar/header anında refresh olsun)
      await updateSession()
      toast.success('Bilgiler güncellendi')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Güncelleme başarısız')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setSending(true)
    try {
      await authClientApi.requestEmailChange(newEmail.trim())
      setSent(true)
      setEmailChangeOpen(false)
      setNewEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'E-posta değiştirilemedi')
    } finally {
      setSending(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    height: 40, border: '1.5px solid var(--border)', borderRadius: 'var(--r)',
    background: 'var(--bg3)', color: 'var(--text)', fontSize: 13.5,
    padding: '0 12px', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <div>
      <SectionHead title="Bilgilerim" sub="Kişisel bilgilerinizi güncelleyin" />

      {user.pendingEmailChange && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 16px', marginBottom: 16,
          background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: 'var(--r)', fontSize: 13, color: '#92400e', lineHeight: 1.5,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <span>E-posta değişikliği talebiniz onay bekliyor. Yeni adresinize gönderilen bağlantıya <strong>24 saat</strong> içinde tıklamazsanız talep otomatik iptal edilir.</span>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 12 : 16, padding: isMobile ? 14 : 20,
        }}>
          {/* Ad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Ad</label>
            <input value={form.firstName} maxLength={20}
              onChange={e => handleFieldChange('firstName', e.target.value)}
              style={{ ...inputStyle, borderColor: formErrors.firstName ? '#dc2626' : undefined }} />
            {formErrors.firstName && <span style={{ fontSize: 11, color: '#dc2626' }}>{formErrors.firstName}</span>}
          </div>

          {/* Soyad */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Soyad</label>
            <input value={form.lastName} maxLength={20}
              onChange={e => handleFieldChange('lastName', e.target.value)}
              style={{ ...inputStyle, borderColor: formErrors.lastName ? '#dc2626' : undefined }} />
            {formErrors.lastName && <span style={{ fontSize: 11, color: '#dc2626' }}>{formErrors.lastName}</span>}
          </div>

          {/* E-posta (read-only + değiştir) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>E-posta</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={user.email} readOnly
                style={{ ...inputStyle, flex: 1, background: 'var(--bg)', color: 'var(--text3)', cursor: 'default' }} />
              <button onClick={() => { setEmailChangeOpen(v => !v); setSent(false) }}
                style={{ height: 40, padding: '0 14px', fontSize: 12, fontWeight: 700, background: 'var(--bg3)', color: 'var(--text2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Değiştir
              </button>
            </div>
          </div>

          {/* Telefon */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Telefon</label>
            <PhoneInput value={form.phone}
              onChange={v => handleFieldChange('phone', v)}
              style={{ ...inputStyle, borderColor: formErrors.phone ? '#dc2626' : undefined }} />
            {formErrors.phone && <span style={{ fontSize: 11, color: '#dc2626' }}>{formErrors.phone}</span>}
          </div>
        </div>

        {/* E-posta değiştirme formu */}
        {emailChangeOpen && (
          <div style={{ margin: '0 20px 16px', padding: 16, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r2)' }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              Yeni e-posta adresinize bir doğrulama bağlantısı gönderilecektir. Bağlantı <strong>24 saat</strong> geçerlidir.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input type="email" value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailChange()}
                placeholder="Yeni e-posta adresi"
                style={{ ...inputStyle, flex: 1, minWidth: 0, width: isMobile ? '100%' : undefined }} />
              <button onClick={handleEmailChange} disabled={sending || !newEmail.trim()}
                style={{ height: 40, padding: '0 16px', fontSize: 13, fontWeight: 700, background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
                {sending ? 'Gönderiliyor…' : 'Gönder'}
              </button>
              <button onClick={() => { setEmailChangeOpen(false); setNewEmail('') }}
                style={{ height: 40, padding: '0 14px', fontSize: 13, fontWeight: 600, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer' }}>
                İptal
              </button>
            </div>
          </div>
        )}

        {sent && (
          <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--r)', fontSize: 13, color: '#166534' }}>
            ✅ Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin — bağlantı 24 saat geçerlidir.
          </div>
        )}

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <button onClick={() => { setForm({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '' }); setFormErrors({}) }}
            disabled={saving}
            style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            İptal
          </button>
        </div>
      </div>
    </div>
  )
}
