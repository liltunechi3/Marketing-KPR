'use client'
import './globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/nasabah', label: 'Data Nasabah' },
  { href: '/nasabah/baru', label: 'Tambah Nasabah' },
  { href: '/admin', label: 'Manajemen User' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && pathname !== '/login') {
        router.replace('/login')
      } else if (data.session) {
        setUserEmail(data.session.user.email ?? null)
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
        <body style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F9FAFB' }}>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>Memuat...</span>
        </body>
      </html>
    )
  }

  return (
    <html lang="id">
      <body style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220,
          background: '#111827',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid #1F2937',
        }}>
          {/* Logo */}
          <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1F2937' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F9FAFB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              KPR Marketing
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>CRM System</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 0' }}>
            {NAV.map(item => {
              const active =
                pathname === item.href ||
                (item.href === '/nasabah' && pathname.startsWith('/nasabah') && pathname !== '/nasabah/baru') ||
                (item.href !== '/nasabah' && item.href !== '/dashboard' && pathname.startsWith(item.href))
              const isDashed = item.href === '/nasabah/baru'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '8px 20px',
                    fontSize: 13,
                    color: active ? '#F9FAFB' : '#9CA3AF',
                    background: active ? '#1F2937' : 'transparent',
                    borderLeft: active ? '2px solid #E5E7EB' : '2px solid transparent',
                    fontWeight: active ? 500 : 400,
                    marginTop: isDashed ? 8 : 0,
                    borderTop: isDashed ? '1px solid #1F2937' : 'none',
                    paddingTop: isDashed ? 16 : 8,
                    transition: 'color 0.1s',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid #1F2937' }}>
            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '7px 12px', background: 'transparent',
                border: '1px solid #374151', borderRadius: 4,
                color: '#9CA3AF', fontSize: 12, cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.1s',
              }}
            >
              Keluar
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflow: 'auto', background: '#F9FAFB' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
