'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KprNasabah, KprStatus, STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, formatRupiah, formatTanggal } from '@/lib/kpr-types'

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 5, border: '1px solid #E5E7EB',
  fontSize: 13, outline: 'none', color: '#111827', background: '#FFFFFF',
}

function NasabahList() {
  const searchParams = useSearchParams()
  const [nasabah, setNasabah] = useState<KprNasabah[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<KprStatus | ''>((searchParams.get('status') as KprStatus) || '')
  const [filterMarketing, setFilterMarketing] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('kpr_nasabah').select('*').order('created_at', { ascending: false })
    if (filterStatus) q = q.eq('status', filterStatus)
    if (filterMarketing) q = q.ilike('nama_marketing', `%${filterMarketing}%`)
    const { data } = await q
    setNasabah(data || [])
    setLoading(false)
  }, [filterStatus, filterMarketing])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = nasabah.filter(n =>
    !search ||
    n.nama.toLowerCase().includes(search.toLowerCase()) ||
    (n.no_hp && n.no_hp.includes(search)) ||
    (n.nik && n.nik.includes(search))
  )

  const hasFilter = filterStatus || filterMarketing || search

  return (
    <div style={{ padding: '32px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Data Nasabah</h1>
          <p style={{ color: '#6B7280', fontSize: 13, marginTop: 2 }}>{nasabah.length} nasabah</p>
        </div>
        <Link href="/nasabah/baru" style={{
          padding: '8px 16px', background: '#111827', color: '#F9FAFB',
          borderRadius: 6, fontSize: 13, fontWeight: 500,
        }}>
          Tambah Nasabah
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, NIK, no HP..."
          style={{ ...inputStyle, width: 220 }}
        />
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as KprStatus | '')}
          style={{ ...inputStyle, background: '#FFFFFF', width: 180 }}
        >
          <option value="">Semua Status</option>
          {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <input
          value={filterMarketing} onChange={e => setFilterMarketing(e.target.value)}
          placeholder="Filter marketing..."
          style={{ ...inputStyle, width: 160 }}
        />
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterMarketing('') }}
            style={{ ...inputStyle, width: 'auto', cursor: 'pointer', color: '#6B7280' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {STATUS_ORDER.map(s => {
          const c = STATUS_COLORS[s]
          const active = filterStatus === s
          const n = nasabah.filter(x => x.status === s).length
          return (
            <button key={s} onClick={() => setFilterStatus(active ? '' : s)}
              style={{
                padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11,
                border: `1px solid ${active ? '#111827' : '#E5E7EB'}`,
                background: active ? '#111827' : '#FFFFFF',
                color: active ? '#F9FAFB' : '#374151',
                fontWeight: active ? 500 : 400,
              }}>
              {STATUS_LABELS[s]} ({n})
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '24px', color: '#9CA3AF', fontSize: 13 }}>Memuat...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '24px', color: '#9CA3AF', fontSize: 13 }}>Tidak ada data.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Nama Nasabah', 'Kontak', 'Proyek / Bank', 'Nilai KPR', 'Marketing', 'Tgl Masuk', 'Status', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => {
                const c = STATUS_COLORS[n.status]
                return (
                  <tr key={n.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <Link href={`/nasabah/${n.id}`} style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{n.nama}</Link>
                      {n.nik && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>NIK: {n.nik}</div>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>
                      <div>{n.no_hp || '—'}</div>
                      {n.email && <div style={{ fontSize: 11, marginTop: 1 }}>{n.email}</div>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#374151' }}>
                      {n.nama_proyek && <div style={{ fontWeight: 500 }}>{n.nama_proyek}</div>}
                      {n.bank_tujuan && <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 1 }}>{n.bank_tujuan}</div>}
                      {!n.nama_proyek && !n.bank_tujuan && '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#374151', fontWeight: 500 }}>{formatRupiah(n.nilai_kpr)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>{n.nama_marketing || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{formatTanggal(n.tanggal_masuk)}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                        padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                      }}>
                        {STATUS_LABELS[n.status]}
                      </span>
                      {n.background_notes && (
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, lineHeight: 1.5 }}>
                          {n.background_notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <Link href={`/nasabah/${n.id}`} style={{ fontSize: 12, color: '#6B7280' }}>Detail</Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`Hapus nasabah "${n.nama}"? Data tidak bisa dikembalikan.`)) return
                          await supabase.from('kpr_nasabah').delete().eq('id', n.id)
                          setNasabah(prev => prev.filter(x => x.id !== n.id))
                        }}
                        style={{
                          padding: '3px 8px', borderRadius: 4, border: '1px solid #FECACA',
                          background: '#FEF2F2', color: '#991B1B', fontSize: 11, cursor: 'pointer',
                        }}>
                        Hapus
                      </button>
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

export default function NasabahListPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>}>
      <NasabahList />
    </Suspense>
  )
}
