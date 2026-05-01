'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { notificationClientApi } from '@/lib/api'
import type { NotificationResponse } from '@/types'
import SectionHead from './SectionHead'

export default function NotificationsSection() {
  const qc = useQueryClient()
  const [onlyUnread, setOnlyUnread] = useState(false)

  const { data: notifications, isLoading } = useQuery<NotificationResponse[]>({
    queryKey: ['notifications'],
    queryFn: () => notificationClientApi.listMy(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationClientApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationClientApi.markAllRead(),
    onSuccess: () => {
      toast.success('Tüm bildirimler okundu işaretlendi')
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('İşlem başarısız, tekrar deneyin'),
  })

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Yükleniyor...</div>

  const list = notifications ?? []
  const unreadCount = list.filter(n => !n.isRead).length
  const displayed = onlyUnread ? list.filter(n => !n.isRead) : list
  const typeIcon: Record<string, string> = { ORDER: '📦', SYSTEM: '⚙️' }
  const marking = markAllReadMutation.isPending

  return (
    <div>
      <SectionHead title="Bildirimler" sub={unreadCount > 0 ? `${unreadCount} okunmamış` : 'Tüm bildirimler okundu'} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', userSelect: 'none' }}
          onClick={() => setOnlyUnread(v => !v)}>
          <div style={{
            width: 36, height: 20, borderRadius: 10,
            background: onlyUnread ? 'var(--primary)' : 'var(--border2)',
            position: 'relative', transition: '0.25s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', width: 14, height: 14, borderRadius: '50%',
              background: '#fff', top: 3, left: onlyUnread ? 19 : 3, transition: '0.25s',
            }} />
          </div>
          Sadece okunmayanları göster
          {unreadCount > 0 && (
            <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>
              {unreadCount}
            </span>
          )}
        </label>
        {unreadCount > 0 && (
          <button onClick={() => markAllReadMutation.mutate()} disabled={marking}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '6px 13px', fontSize: 12, fontWeight: 600, color: 'var(--text2)', cursor: marking ? 'not-allowed' : 'pointer', opacity: marking ? 0.6 : 1 }}>
            {marking ? '...' : 'Tümünü Okundu İşaretle'}
          </button>
        )}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {displayed.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔔</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{onlyUnread ? 'Okunmamış bildirim yok' : 'Bildirim yok'}</div>
          </div>
        ) : displayed.map((n, i) => (
          <div key={n.id}
            onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id) }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '14px 20px',
              borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
              background: n.isRead ? 'transparent' : 'var(--primary-bg)',
              transition: '0.2s', cursor: n.isRead ? 'default' : 'pointer',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>{typeIcon[n.type] || '🔔'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, color: 'var(--text)', fontWeight: n.isRead ? 400 : 600, lineHeight: 1.45, marginBottom: 4 }}>
                {n.message}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!n.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 6 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
