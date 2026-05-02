'use client'
import { useEffect, useState } from 'react'
import { saasApi, type CompanyUserDto } from '@/lib/api/saas'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<CompanyUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    setLoading(true)
    saasApi.listUsers().then(setUsers).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await saasApi.inviteUser({ email, password })
      toast.success('Kullanıcı eklendi')
      setEmail(''); setPassword(''); setShowInvite(false)
      load()
    } catch (err) {
      const e = err as Error & { code?: string }
      if (e.code === 'PLAN_FEATURE_LOCKED') {
        toast.error('Çoklu kullanıcı PRO planı gerektirir.', { duration: 5000 })
      } else {
        toast.error(e.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async (id: number, mail: string) => {
    if (!confirm(`${mail} kullanıcısını pasifleştir?`)) return
    try {
      await saasApi.deactivateUser(id)
      toast.success('Pasifleştirildi')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kullanıcılar</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          {showInvite ? 'İptal' : '+ Kullanıcı Ekle'}
        </button>
      </div>

      {showInvite && (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <input type="email" placeholder="E-posta" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          <input type="password" placeholder="Geçici şifre" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
          <button type="submit" disabled={busy} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </form>
      )}

      {loading ? <p className="text-gray-500">Yükleniyor…</p> :
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3">E-posta</th>
                <th className="px-4 py-3">Ad</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-4 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs">{u.role}</span></td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                      {u.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.isActive && <button onClick={() => handleDeactivate(u.id, u.email)} className="text-sm text-red-600 hover:underline">Pasifleştir</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  )
}
