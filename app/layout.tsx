'use client'
import './globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/nasabah', label: 'Data Nasabah', icon: '👤' },
  { href: '/nasabah/baru', label: '+ Nasabah Baru', icon: null },
  { href: '/admin', label: 'Manajemen User', icon: '🔐' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && pathname !== '/login') {
        router.replace('/login')
      } else if (data.session) {
        setUser({ email: data.session.user.email })
      }
      setChecking(false)
    })
  }, [pathname, router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (pathname === '/login') {
    return (
      <html lang="id">
        <body>{children}</body>
      </html>
    )
  }

  if (checking) {
    return (
      <html lang="id">
        <body style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FF' }}>
          <p style={{ color: '#6B7280' }}>Memuat...</p>
        </body>
      </html>
    )
  }

  return (
    <html lang="id">
      <body style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#F8FAFC' }}>
        {/* Sidebar */}
        <aside style={{ width: 240, background: '#1E3A5F', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🏠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>KPR Tools</div>
                <div style={{ fontSize: 11, opacity: 0.6 }}>Marketing System</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: '16px 12px' }}>
            {NAV.map(item => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && item.href !== '/nasabah/baru' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 4,
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
                  border: item.icon === null ? '1.5px dashed rgba(255,255,255,0.3)' : 'none',
                }}>
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8, paddingLeft: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', textAlign: 'left',
            }}>
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
