'use client'
import './globals.css'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
          width: sidebarOpen ? 220 : 0,
          background: '#111827',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid #1F2937',
          overflow: 'hidden',
          transition: 'width 0.25s ease',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1F2937', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Image src="/Logo SHAISTANAYA-01.png" alt="Shaistanaya City" width={140} height={110} style={{ objectFit: 'contain' }} priority />
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>CRM System</div>
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
        <main style={{ flex: 1, overflow: 'auto', background: '#F9FAFB', position: 'relative' }}>
          {/* Toggle button */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              position: 'fixed',
              left: sidebarOpen ? 220 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 100,
              width: 18,
              height: 48,
              background: '#1E40AF',
              border: 'none',
              borderRadius: sidebarOpen ? '0 6px 6px 0' : '0 6px 6px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 10,
              transition: 'left 0.25s ease',
              padding: 0,
            }}
            title={sidebarOpen ? 'Sembunyikan menu' : 'Tampilkan menu'}
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
          {children}
        </main>
      </body>
    </html>
  )
}
