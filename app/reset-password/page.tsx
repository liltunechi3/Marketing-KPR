'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return }
    if (password !== confirm) { setError('Password tidak cocok.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError('Gagal update password. Link mungkin sudah expired.'); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #D1D5DB', fontSize: 13, outline: 'none',
    color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#F9FAFB' }}>Buat Password Baru</h1>
          <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>Masukkan password baru kamu</p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '28px' }}>
          {done ? (
            <div style={{ textAlign: 'center', color: '#166534', fontSize: 13 }}>
              Password berhasil diubah. Mengalihkan ke halaman login...
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password Baru</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter" required style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Konfirmasi Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Ulangi password" required style={inputStyle} />
              </div>
              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '9px 12px', color: '#DC2626', fontSize: 12, marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '10px', background: loading ? '#6B7280' : '#111827',
                color: '#F9FAFB', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
