'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserRole {
  id: string; user_id: string; role: 'admin' | 'marketing'; nama: string; created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/login'); return }
      const { data: myRole } = await supabase.from('kpr_user_roles').select('role').eq('user_id', session.session.user.id).single()
      if (myRole?.role !== 'admin') { router.push('/dashboard'); return }
      setIsAdmin(true)
      const { data } = await supabase.from('kpr_user_roles').select('*').order('created_at')
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function handleChangeRole(userId: string, newRole: 'admin' | 'marketing') {
    setSaving(userId)
    await supabase.from('kpr_user_roles').update({ role: newRole }).eq('user_id', userId)
    setUsers(u => u.map(x => x.user_id === userId ? { ...x, role: newRole } : x))
    setSaving(null)
  }

  if (!isAdmin || loading) return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Manajemen User</h1>
        <p style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Kelola role anggota tim.</p>
      </div>

      {/* Info */}
      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Hak Akses</p>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#6B7280', lineHeight: 2 }}>
          <li><strong>Admin</strong> — full access termasuk hapus data</li>
          <li><strong>Marketing</strong> — input & edit, tidak bisa hapus</li>
        </ul>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ display: 'flex', padding: '10px 20px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>User</span>
          <span style={{ width: 120, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Role</span>
          <span style={{ width: 100, fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aksi</span>
        </div>

        {users.length === 0 ? (
          <p style={{ padding: '20px', color: '#9CA3AF', fontSize: 13 }}>
            Belum ada user. Invite via Supabase Dashboard → Authentication → Users.
          </p>
        ) : users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #F9FAFB' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{u.nama || 'Tanpa nama'}</div>
              <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 2, fontFamily: 'monospace' }}>{u.user_id}</div>
            </div>
            <div style={{ width: 120 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                background: u.role === 'admin' ? '#111827' : '#F3F4F6',
                color: u.role === 'admin' ? '#F9FAFB' : '#374151',
                border: `1px solid ${u.role === 'admin' ? '#111827' : '#E5E7EB'}`,
              }}>
                {u.role === 'admin' ? 'Admin' : 'Marketing'}
              </span>
            </div>
            <div style={{ width: 100 }}>
              <button
                onClick={() => handleChangeRole(u.user_id, u.role === 'admin' ? 'marketing' : 'admin')}
                disabled={saving === u.user_id}
                style={{
                  padding: '5px 10px', borderRadius: 5, border: '1px solid #E5E7EB',
                  background: '#FFFFFF', fontSize: 11, cursor: 'pointer', color: '#374151',
                  opacity: saving === u.user_id ? 0.5 : 1,
                }}>
                {saving === u.user_id ? '...' : u.role === 'admin' ? 'Jadikan Marketing' : 'Jadikan Admin'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px' }}>
        <p style={{ fontSize: 12, color: '#6B7280' }}>
          Invite user baru lewat{' '}
          <a href="https://supabase.com/dashboard/project/xiwpbulblpovkekmgbnr/auth/users"
            target="_blank" rel="noreferrer" style={{ color: '#111827', textDecoration: 'underline' }}>
            Supabase Dashboard → Authentication → Users → Invite user
          </a>
        </p>
      </div>
    </div>
  )
}
