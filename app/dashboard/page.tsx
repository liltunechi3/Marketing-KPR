'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { KprNasabah, KprStatus, STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, formatRupiah, formatTanggal } from '@/lib/kpr-types'

const PIPELINE: KprStatus[] = ['berkas_masuk', 'verifikasi_internal', 'pengajuan_bank', 'bi_checking', 'penilaian_agunan', 'approval', 'akad']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 5,
  border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
  color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
}

export default function DashboardPage() {
  const [nasabah, setNasabah] = useState<KprNasabah[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('kpr_nasabah').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setNasabah(data || []); setLoading(false) })
  }, [])

  const count = (s: KprStatus) => nasabah.filter(n => n.status === s).length
  const totalAktif = nasabah.filter(n => !['ditolak', 'batal'].includes(n.status)).length
  const totalAkad = count('akad')
  const totalDitolak = count('ditolak')
  const totalNilai = nasabah.filter(n => n.status === 'akad').reduce((s, n) => s + (n.nilai_kpr || 0), 0)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>Ringkasan pipeline KPR</p>
        </div>
        <Link href="/nasabah/baru" style={{
          padding: '8px 16px', background: '#111827', color: '#F9FAFB',
          borderRadius: 6, fontSize: 13, fontWeight: 500,
        }}>
          Tambah Nasabah
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Aktif', value: loading ? '—' : totalAktif },
          { label: 'Berhasil Akad', value: loading ? '—' : totalAkad },
          { label: 'Ditolak', value: loading ? '—' : totalDitolak },
          { label: 'Total Nilai KPR Akad', value: loading ? '—' : formatRupiah(totalNilai), small: true },
        ].map(c => (
          <div key={c.label} style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '20px',
          }}>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{c.label}</p>
            <p style={{ fontSize: c.small ? 16 : 28, fontWeight: 600, color: '#111827' }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pipeline Status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {PIPELINE.map(s => {
            const c = STATUS_COLORS[s]
            const n = count(s)
            return (
              <Link key={s} href={`/nasabah?status=${s}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  border: `1px solid ${c.border}`, borderRadius: 6,
                  padding: '14px 10px', textAlign: 'center',
                  background: c.bg, cursor: 'pointer',
                }}>
                  <div style={{ fontSize: 22, fontWeight: 600, color: c.text }}>{loading ? '—' : n}</div>
                  <div style={{ fontSize: 10, color: c.text, marginTop: 4, lineHeight: 1.3, fontWeight: 500 }}>
                    {STATUS_LABELS[s]}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {(['ditolak', 'batal'] as KprStatus[]).map(s => {
            const c = STATUS_COLORS[s]
            return (
              <Link key={s} href={`/nasabah?status=${s}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  border: `1px solid ${c.border}`, borderRadius: 6, padding: '7px 14px',
                  display: 'flex', gap: 8, alignItems: 'center', background: c.bg,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{loading ? '—' : count(s)}</span>
                  <span style={{ fontSize: 11, color: c.text }}>{STATUS_LABELS[s]}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Nasabah Terbaru</span>
          <Link href="/nasabah" style={{ fontSize: 12, color: '#6B7280' }}>Lihat semua</Link>
        </div>
        {loading ? (
          <p style={{ padding: '24px', color: '#9CA3AF', fontSize: 13 }}>Memuat...</p>
        ) : nasabah.length === 0 ? (
          <p style={{ padding: '24px', color: '#9CA3AF', fontSize: 13 }}>Belum ada data.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Nama', 'Bank', 'Nilai KPR', 'Marketing', 'Tgl Masuk', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #F3F4F6' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nasabah.slice(0, 5).map(n => {
                const c = STATUS_COLORS[n.status]
                return (
                  <tr key={n.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                    <td style={{ padding: '11px 16px' }}>
                      <Link href={`/nasabah/${n.id}`} style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{n.nama}</Link>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#6B7280' }}>{n.bank_tujuan || '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#374151' }}>{formatRupiah(n.nilai_kpr)}</td>
                    <td style={{ padding: '11px 16px', fontSize: 13, color: '#6B7280' }}>{n.nama_marketing || '—'}</td>
                    <td style={{ padding: '11px 16px', fontSize: 12, color: '#9CA3AF' }}>{formatTanggal(n.tanggal_masuk)}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                      }}>
                        {STATUS_LABELS[n.status]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
