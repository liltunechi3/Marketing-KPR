'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email atau password tidak valid.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleReset() {
    if (!email.trim()) { setError('Isi email dulu sebelum reset password.'); return }
    setResetLoading(true); setError('')
    await supabase.auth.resetPasswordForEmail(email)
    setResetSent(true); setResetLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #D1D5DB', fontSize: 13, outline: 'none',
    color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Image src="/Logo SHAISTANAYA-01.png" alt="Shaistanaya City" width={160} height={130} style={{ objectFit: 'contain', margin: '0 auto 8px' }} priority />
          <p style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>Masuk ke sistem CRM</p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '28px' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="nama@perusahaan.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••" style={inputStyle} />
            </div>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <button type="button" onClick={handleReset} disabled={resetLoading}
                style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                {resetLoading ? 'Mengirim...' : 'Lupa password?'}
              </button>
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '9px 12px', color: '#DC2626', fontSize: 12, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '10px', background: loading ? '#6B7280' : '#111827',
              color: '#F9FAFB', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>

        {resetSent && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '10px 14px', color: '#166534', fontSize: 12, marginTop: 12, textAlign: 'center' }}>
            Email reset password sudah dikirim ke {email}. Cek inbox kamu.
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: 20 }}>
          Butuh akses? Hubungi administrator.
        </p>
      </div>
    </div>
  )
}
