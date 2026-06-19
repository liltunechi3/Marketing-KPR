import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

// Simple in-process rate limiter: max 60 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return false
  }
  if (entry.count >= 60) return true
  entry.count++
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // Public routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check session cookie locally — no network call needed
  const hasSession = request.cookies.getAll().some(c =>
    c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.ico).*)'],
}
