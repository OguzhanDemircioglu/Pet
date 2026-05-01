'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { addressClientApi, authClientApi } from '@/lib/api'
import { useIsMobile } from '@/hooks/useIsMobile'
import { TURKEY_DISTRICTS } from '@/data/turkeyDistricts'
import { PHONE_RE } from '@/lib/constants'
import type { Address, AddressRequest } from '@/types'
import SectionHead from './SectionHead'
import PhoneInput from '@/components/common/PhoneInput'

const EMPTY_FORM: AddressRequest = {
  title: '', fullName: '', phone: '', city: '', district: '', addressLine: '', isDefault: false,
}

interface Props {
  userPhone: string | null
  onPhoneSaved: (phone: string) => void
}

export default function AddressesSection({ userPhone, onPhoneSaved }: Props) {
  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const phoneRequired = !userPhone

  const [defaultPhone, setDefaultPhone] = useState('')
  const [defaultPhoneErr, setDefaultPhoneErr] = useState('')
  const [savingDefaultPhone, setSavingDefaultPhone] = useState(false)

  const handleSaveDefaultPhone = async () => {
    if (!PHONE_RE.test(defaultPhone)) {
      setDefaultPhoneErr('05XX XXX XX XX formatında girin')
      return
    }
    setSavingDefaultPhone(true)
    try {
      const cleaned = defaultPhone.replace(/\s/g, '')
      await authClientApi.updatePhone(cleaned)
      onPhoneSaved(cleaned)
      toast.success('Varsayılan telefon kaydedildi')
      setDefaultPhone('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kaydedilemedi')
    } finally {
      setSavingDefaultPhone(false)
    }
  }

  const { data: addresses, isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => addressClientApi.list(),
    // Sekme her açılışında yeni fetch atmasın; mutation'lar zaten invalidate ediyor.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AddressRequest>({ ...EMPTY_FORM })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses'] })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, phone: form.phone.replace(/\s/g, '') }
      return editingId !== null
        ? addressClientApi.update(editingId, payload)
        : addressClientApi.create(payload)
    },
    onSuccess: () => {
      toast.success(editingId !== null ? 'Adres güncellendi' : 'Adres eklendi')
      setFormOpen(false)
      invalidate()
    },
    onError: (err: Error) => toast.error(err.message ?? 'Kayıt başarısız'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => addressClientApi.remove(id),
    onSuccess: () => { toast.success('Adres silindi'); invalidate() },
    onError: () => toast.error('Silme başarısız'),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => addressClientApi.setDefault(id),
    onSuccess: invalidate,
    onError: () => toast.error('İşlem başarısız'),
  })

  const openNew = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setFormOpen(true)
  }
  const openEdit = (a: Address) => {
    setEditingId(a.id)
    setForm({
      title: a.title, fullName: a.fullName, phone: a.phone,
      city: a.city, district: a.district, addressLine: a.addressLine, isDefault: a.isDefault,
    })
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.fullName.trim() || !form.phone.trim() ||
        !form.city || !form.district || !form.addressLine.trim()) {
      toast.error('Tüm alanları doldurun')
      return
    }
    saveMutation.mutate()
  }

  const handleDelete = (id: number) => {
    if (!window.confirm('Bu adresi silmek istediğinize emin misiniz?')) return
    deleteMutation.mutate(id)
  }

  const cities = Object.keys(TURKEY_DISTRICTS).sort()
  const list = addresses ?? []
  const saving = saveMutation.isPending

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>

  const inputBase: React.CSSProperties = {
    width: '100%', height: 40, border: '1.5px solid var(--border)',
    borderRadius: 'var(--r)', background: 'var(--bg3)', color: 'var(--text)',
    fontSize: 13.5, padding: '0 12px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div>
      <SectionHead title="Adreslerim" sub={`${list.length} kayıtlı adres`}
        action={!formOpen && list.length < 10 ? (
          <button onClick={openNew} disabled={phoneRequired}
            title={phoneRequired ? 'Önce varsayılan telefon numaranızı girin' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: phoneRequired ? 'var(--bg3)' : 'var(--primary)',
              color: phoneRequired ? 'var(--text3)' : '#fff', border: 'none',
              borderRadius: 'var(--r)', padding: '8px 16px',
              fontSize: 13, fontWeight: 700,
              cursor: phoneRequired ? 'not-allowed' : 'pointer',
            }}>+ Yeni Adres</button>
        ) : undefined}
      />

      {phoneRequired && (
        <div style={{
          background: 'var(--bg2)', border: '2px solid var(--primary)',
          borderRadius: 'var(--r2)', padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>📱</span>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
              Varsayılan Telefon Numarası
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Adres ekleyebilmek ve sipariş verebilmek için varsayılan telefon numaranızı girmelisiniz.
            Bu numara sipariş bildirimlerinde kullanılacaktır.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <PhoneInput
              value={defaultPhone}
              onChange={v => { setDefaultPhone(v); setDefaultPhoneErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleSaveDefaultPhone()}
              style={{
                flex: 1, minWidth: 200, height: 44,
                border: `1.5px solid ${defaultPhoneErr ? '#dc2626' : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                background: defaultPhoneErr ? '#fef2f2' : 'var(--bg3)',
                color: 'var(--text)', fontSize: 14.5,
                padding: '0 14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <button onClick={handleSaveDefaultPhone} disabled={savingDefaultPhone}
              style={{
                height: 44, padding: '0 20px', fontSize: 14, fontWeight: 700,
                background: 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: 'var(--r)',
                cursor: savingDefaultPhone ? 'not-allowed' : 'pointer',
                opacity: savingDefaultPhone ? 0.7 : 1,
              }}>
              {savingDefaultPhone ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
          {defaultPhoneErr && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 6, fontWeight: 600 }}>
              {defaultPhoneErr}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {formOpen && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>
            {editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <Label>Adres Başlığı *</Label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Örn: Ev, İş, Depo" style={inputBase} />
            </div>
            <div>
              <Label>Ad Soyad *</Label>
              <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Ad Soyad" style={inputBase} />
            </div>
            <div>
              <Label>Telefon *</Label>
              <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))}
                style={inputBase} />
            </div>
            <div>
              <Label>İl *</Label>
              <select value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value, district: '' }))}
                style={{ ...inputBase, padding: '0 10px', color: form.city ? 'var(--text)' : 'var(--text3)' }}>
                <option value="">İl seçin</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>İlçe *</Label>
              <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                disabled={!form.city}
                style={{ ...inputBase, padding: '0 10px', color: form.district ? 'var(--text)' : 'var(--text3)', opacity: !form.city ? 0.5 : 1, cursor: !form.city ? 'not-allowed' : 'pointer' }}>
                <option value="">{form.city ? 'İlçe seçin' : 'Önce il seçin'}</option>
                {(TURKEY_DISTRICTS[form.city] ?? []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
              <Label>Adres *</Label>
              <textarea value={form.addressLine}
                onChange={e => setForm(p => ({ ...p, addressLine: e.target.value }))}
                placeholder="Mahalle, sokak, bina no, daire..." rows={3}
                style={{ ...inputBase, height: 'auto', padding: '10px 12px', resize: 'none' }} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginTop: 12, userSelect: 'none' }}
            onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))}>
            <div style={{
              width: 36, height: 20, borderRadius: 10,
              background: form.isDefault ? 'var(--primary)' : 'var(--border2)',
              position: 'relative', transition: '0.25s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', width: 14, height: 14, borderRadius: '50%',
                background: '#fff', top: 3, left: form.isDefault ? 19 : 3, transition: '0.25s',
              }} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Varsayılan adresim olarak kaydet</span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleSave} disabled={saving}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            <button onClick={() => setFormOpen(false)}
              style={{ background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </div>
      )}

      {/* Adres kartları */}
      {list.length === 0 && !formOpen ? (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📍</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Henüz kayıtlı adres yok</div>
          <button onClick={openNew} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--r)', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            İlk Adresi Ekle
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
          {list.map(addr => (
            <div key={addr.id} style={{
              background: 'var(--bg2)',
              border: `2px solid ${addr.isDefault ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--r2)', padding: '16px 18px', position: 'relative',
            }}>
              {addr.isDefault && (
                <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 800, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '2px 8px', borderRadius: 10 }}>
                  Varsayılan
                </span>
              )}
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{addr.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>{addr.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{addr.phone}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{addr.city} / {addr.district}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.4 }}>{addr.addressLine}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => openEdit(addr)}
                  style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>
                  ✏️ Düzenle
                </button>
                {!addr.isDefault && (
                  <button onClick={() => setDefaultMutation.mutate(addr.id)}
                    style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-bg)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>
                    ⭐ Varsayılan Yap
                  </button>
                )}
                <button onClick={() => handleDelete(addr.id)}
                  style={{ fontSize: 11.5, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--r)', padding: '4px 10px', cursor: 'pointer' }}>
                  🗑️ Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{children}</label>
}
