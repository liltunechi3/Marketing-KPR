'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  KprNasabah, KprNote, KprDokumen, KprStatusLog, KprStatus,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, formatRupiah, formatTanggal,
} from '@/lib/kpr-types'

const TABS = ['Info', 'Dokumen', 'Catatan', 'Riwayat']
const BANK_LIST = ['BTN', 'BRI', 'BNI', 'Mandiri', 'BSI', 'BCA', 'CIMB Niaga', 'Permata', 'Maybank', 'Lainnya']
const TIPE_PROPERTI = ['Rumah Tapak', 'Apartemen', 'Ruko', 'Tanah', 'Lainnya']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 5,
  border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
  color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 4,
}

export default function NasabahDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [nasabah, setNasabah] = useState<KprNasabah | null>(null)
  const [dokumen, setDokumen] = useState<KprDokumen[]>([])
  const [notes, setNotes] = useState<KprNote[]>([])
  const [logs, setLogs] = useState<KprStatusLog[]>([])
  const [tab, setTab] = useState('Info')
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState<Partial<KprNasabah>>({})
  const [noteText, setNoteText] = useState('')
  const [noteAuthor, setNoteAuthor] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [newStatus, setNewStatus] = useState<KprStatus | ''>('')
  const [statusNote, setStatusNote] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const fetchAll = useCallback(async () => {
    const [n, d, no, l, sess] = await Promise.all([
      supabase.from('kpr_nasabah').select('*').eq('id', id).single(),
      supabase.from('kpr_dokumen').select('*').eq('nasabah_id', id).order('nama_dokumen'),
      supabase.from('kpr_notes').select('*').eq('nasabah_id', id).order('created_at', { ascending: false }),
      supabase.from('kpr_status_log').select('*').eq('nasabah_id', id).order('created_at', { ascending: false }),
      supabase.auth.getSession(),
    ])
    setNasabah(n.data); setEditForm(n.data || {})
    setDokumen(d.data || []); setNotes(no.data || []); setLogs(l.data || [])
    setUserEmail(sess.data?.session?.user?.email || '')
    setLoading(false)
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleSaveNote() {
    if (!noteText.trim() || !noteAuthor.trim()) return
    setSavingNote(true)
    await supabase.from('kpr_notes').insert({ nasabah_id: id, isi: noteText, nama_penulis: noteAuthor })
    setNoteText(''); setSavingNote(false)
    const { data } = await supabase.from('kpr_notes').select('*').eq('nasabah_id', id).order('created_at', { ascending: false })
    setNotes(data || [])
  }

  async function handleDokumenToggle(dok: KprDokumen) {
    const next = dok.status === 'belum' ? 'sudah' : dok.status === 'sudah' ? 'tidak_perlu' : 'belum'
    await supabase.from('kpr_dokumen').update({ status: next, updated_at: new Date().toISOString() }).eq('id', dok.id)
    setDokumen(d => d.map(x => x.id === dok.id ? { ...x, status: next } : x))
  }

  async function handleSaveEdit() {
    if (!nasabah) return
    const payload: Partial<KprNasabah> = {
      nama: editForm.nama, nik: editForm.nik, no_hp: editForm.no_hp, email: editForm.email,
      pekerjaan: editForm.pekerjaan, nama_perusahaan: editForm.nama_perusahaan,
      penghasilan_bulanan: editForm.penghasilan_bulanan, nama_marketing: editForm.nama_marketing,
      tipe_properti: editForm.tipe_properti, nilai_properti: editForm.nilai_properti,
      nilai_kpr: editForm.nilai_kpr, nama_developer: editForm.nama_developer,
      nama_proyek: editForm.nama_proyek, bank_tujuan: editForm.bank_tujuan,
      background_notes: editForm.background_notes,
      tanggal_pengajuan_bank: editForm.tanggal_pengajuan_bank,
      tanggal_approval: editForm.tanggal_approval, tanggal_akad: editForm.tanggal_akad,
      tanggal_ditolak: editForm.tanggal_ditolak, alasan_ditolak: editForm.alasan_ditolak,
    }
    await supabase.from('kpr_nasabah').update(payload).eq('id', id)
    setEditMode(false); fetchAll()
  }

  async function handleChangeStatus() {
    if (!newStatus || !nasabah) return
    setChangingStatus(true)
    await supabase.from('kpr_nasabah').update({ status: newStatus }).eq('id', id)
    await supabase.from('kpr_status_log').insert({
      nasabah_id: id, status_lama: nasabah.status, status_baru: newStatus,
      catatan: statusNote, nama_user: userEmail,
    })
    setNewStatus(''); setStatusNote(''); setChangingStatus(false)
    fetchAll()
  }

  if (loading) return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
  if (!nasabah) return <div style={{ padding: 40, color: '#991B1B', fontSize: 13 }}>Data tidak ditemukan.</div>

  const col = STATUS_COLORS[nasabah.status]
  const ef = editForm

  return (
    <div style={{ padding: '32px 36px', maxWidth: 920 }}>
      {/* Back */}
      <button onClick={() => router.push('/nasabah')} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 12 }}>
        Kembali ke Daftar
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>{nasabah.nama}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <span style={{
              background: col.bg, color: col.text, border: `1px solid ${col.border}`,
              padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500,
            }}>
              {STATUS_LABELS[nasabah.status]}
            </span>
            {nasabah.nama_marketing && <span style={{ color: '#9CA3AF', fontSize: 12 }}>{nasabah.nama_marketing}</span>}
            <span style={{ color: '#D1D5DB', fontSize: 12 }}>·</span>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Masuk {formatTanggal(nasabah.tanggal_masuk)}</span>
          </div>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={{
          padding: '7px 14px', background: editMode ? '#F3F4F6' : '#FFFFFF',
          border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#374151', fontWeight: 500,
        }}>
          {editMode ? 'Batal' : 'Edit Data'}
        </button>
      </div>

      {/* Status change */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Pindah Status Pipeline
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value as KprStatus)}
            style={{ ...inputStyle, width: 'auto', minWidth: 180 }}>
            <option value="">Pilih status baru</option>
            {STATUS_ORDER.filter(s => s !== nasabah.status).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input value={statusNote} onChange={e => setStatusNote(e.target.value)}
            placeholder="Catatan (opsional)"
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
          <button onClick={handleChangeStatus} disabled={!newStatus || changingStatus}
            style={{
              padding: '7px 16px', background: newStatus ? '#111827' : '#E5E7EB',
              color: newStatus ? '#F9FAFB' : '#9CA3AF', border: 'none', borderRadius: 5,
              fontSize: 13, fontWeight: 500, cursor: newStatus ? 'pointer' : 'not-allowed',
            }}>
            {changingStatus ? 'Menyimpan...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '9px 16px', border: 'none', background: 'none', fontSize: 13,
            color: tab === t ? '#111827' : '#6B7280', cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? '2px solid #111827' : '2px solid transparent', marginBottom: -1,
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* TAB: Info */}
      {tab === 'Info' && (
        editMode ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'nama', label: 'Nama *' }, { key: 'nik', label: 'NIK' },
                { key: 'no_hp', label: 'No HP' }, { key: 'email', label: 'Email', type: 'email' },
                { key: 'pekerjaan', label: 'Pekerjaan' }, { key: 'nama_perusahaan', label: 'Perusahaan' },
                { key: 'penghasilan_bulanan', label: 'Penghasilan Bulanan', type: 'number' },
                { key: 'nama_marketing', label: 'Marketing' },
                { key: 'nama_proyek', label: 'Nama Proyek' }, { key: 'nama_developer', label: 'Developer' },
                { key: 'nilai_properti', label: 'Nilai Properti', type: 'number' },
                { key: 'nilai_kpr', label: 'Nilai KPR', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  <input type={f.type || 'text'}
                    value={(ef as Record<string, string | number | undefined>)[f.key] as string || ''}
                    onChange={e => setEditForm(x => ({ ...x, [f.key]: f.type === 'number' ? parseInt(e.target.value) || undefined : e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              ))}
              <div>
                <label style={labelStyle}>Bank Tujuan</label>
                <select value={ef.bank_tujuan || ''} onChange={e => setEditForm(x => ({ ...x, bank_tujuan: e.target.value }))} style={inputStyle}>
                  <option value="">-- Pilih --</option>
                  {BANK_LIST.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tipe Properti</label>
                <select value={ef.tipe_properti || ''} onChange={e => setEditForm(x => ({ ...x, tipe_properti: e.target.value }))} style={inputStyle}>
                  <option value="">-- Pilih --</option>
                  {TIPE_PROPERTI.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {(['tanggal_pengajuan_bank', 'tanggal_approval', 'tanggal_akad', 'tanggal_ditolak'] as (keyof KprNasabah)[]).map(k => (
                <div key={k as string}>
                  <label style={labelStyle}>
                    {k === 'tanggal_pengajuan_bank' ? 'Tgl Pengajuan Bank' : k === 'tanggal_approval' ? 'Tgl Approval' : k === 'tanggal_akad' ? 'Tgl Akad' : 'Tgl Ditolak'}
                  </label>
                  <input type="date" value={(ef[k] as string) || ''}
                    onChange={e => setEditForm(x => ({ ...x, [k]: e.target.value }))} style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Background Notes</label>
              <textarea value={ef.background_notes || ''} rows={4}
                onChange={e => setEditForm(x => ({ ...x, background_notes: e.target.value }))}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
            </div>
            {nasabah.status === 'ditolak' && (
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Alasan Ditolak</label>
                <input value={ef.alasan_ditolak || ''} onChange={e => setEditForm(x => ({ ...x, alasan_ditolak: e.target.value }))} style={inputStyle} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={handleSaveEdit} style={{ padding: '8px 18px', background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 6, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
                Simpan
              </button>
              <button onClick={() => setEditMode(false)} style={{ padding: '8px 14px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              {
                title: 'Data Diri', rows: [
                  ['NIK', nasabah.nik], ['No. HP', nasabah.no_hp], ['Email', nasabah.email],
                  ['Pekerjaan', nasabah.pekerjaan], ['Perusahaan', nasabah.nama_perusahaan],
                  ['Penghasilan', formatRupiah(nasabah.penghasilan_bulanan)],
                ]
              },
              {
                title: 'Properti & KPR', rows: [
                  ['Tipe', nasabah.tipe_properti], ['Proyek', nasabah.nama_proyek],
                  ['Developer', nasabah.nama_developer], ['Harga Properti', formatRupiah(nasabah.nilai_properti)],
                  ['Nilai KPR', formatRupiah(nasabah.nilai_kpr)], ['Bank', nasabah.bank_tujuan],
                ]
              },
              {
                title: 'Timeline', rows: [
                  ['Tgl Masuk', formatTanggal(nasabah.tanggal_masuk)],
                  ['Tgl Pengajuan Bank', formatTanggal(nasabah.tanggal_pengajuan_bank)],
                  ['Tgl Approval', formatTanggal(nasabah.tanggal_approval)],
                  ['Tgl Akad', formatTanggal(nasabah.tanggal_akad)],
                  ['Tgl Ditolak', formatTanggal(nasabah.tanggal_ditolak)],
                  ['Alasan Ditolak', nasabah.alasan_ditolak],
                ]
              },
            ].map(card => (
              <div key={card.title} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>{card.title}</p>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {card.rows.map(([lbl, val]) => (
                      <tr key={lbl as string} style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <td style={{ padding: '6px 0', fontSize: 12, color: '#9CA3AF', width: 140 }}>{lbl}</td>
                        <td style={{ padding: '6px 0', fontSize: 13, color: '#111827' }}>{val || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            {nasabah.background_notes && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', gridColumn: 'span 2' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Background</p>
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{nasabah.background_notes}</p>
              </div>
            )}
          </div>
        )
      )}

      {/* TAB: Dokumen */}
      {tab === 'Dokumen' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
              Checklist Dokumen — {dokumen.filter(d => d.status === 'sudah').length}/{dokumen.filter(d => d.status !== 'tidak_perlu').length} lengkap
            </span>
            <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
              {[['Belum', '#F3F4F6', '#374151'], ['Sudah', '#111827', '#F9FAFB'], ['Tdk Perlu', '#F9FAFB', '#9CA3AF']].map(([lbl, bg, c]) => (
                <span key={lbl} style={{ background: bg, color: c, padding: '2px 8px', borderRadius: 3, border: '1px solid #E5E7EB', fontWeight: 500 }}>{lbl}</span>
              ))}
            </div>
          </div>
          {dokumen.length === 0 && (
            <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Belum ada dokumen.</p>
          )}
          {dokumen.map(dok => (
            <div key={dok.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #F9FAFB', gap: 10 }}>
              <button onClick={() => handleDokumenToggle(dok)} style={{
                width: 22, height: 22, borderRadius: 4, border: '1px solid #D1D5DB',
                cursor: 'pointer', flexShrink: 0, fontSize: 12,
                background: dok.status === 'sudah' ? '#111827' : dok.status === 'tidak_perlu' ? '#F3F4F6' : '#FFFFFF',
                color: dok.status === 'sudah' ? '#F9FAFB' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {dok.status === 'sudah' ? '✓' : dok.status === 'tidak_perlu' ? '−' : ''}
              </button>
              <span style={{
                flex: 1, fontSize: 13,
                color: dok.status === 'sudah' ? '#111827' : dok.status === 'tidak_perlu' ? '#D1D5DB' : '#374151',
                textDecoration: dok.status === 'tidak_perlu' ? 'line-through' : 'none',
              }}>
                {dok.nama_dokumen}
              </span>
              <span style={{ fontSize: 11, color: '#D1D5DB' }}>
                {dok.status === 'belum' ? 'klik untuk update' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Catatan */}
      {tab === 'Catatan' && (
        <div>
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Tambah Catatan</p>
            <input value={noteAuthor} onChange={e => setNoteAuthor(e.target.value)}
              placeholder="Nama Anda"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
              placeholder="Tulis catatan: hasil komunikasi, update terbaru..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, marginBottom: 10 }}
            />
            <button onClick={handleSaveNote} disabled={savingNote || !noteText.trim() || !noteAuthor.trim()}
              style={{
                padding: '7px 16px', background: noteText.trim() && noteAuthor.trim() ? '#111827' : '#E5E7EB',
                color: noteText.trim() && noteAuthor.trim() ? '#F9FAFB' : '#9CA3AF',
                border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>
              {savingNote ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>

          {notes.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada catatan.</p>
          ) : notes.map(n => (
            <div key={n.id} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '14px 18px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{n.nama_penulis}</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                  {new Date(n.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{n.isi}</p>
            </div>
          ))}
        </div>
      )}

      {/* TAB: Riwayat */}
      {tab === 'Riwayat' && (
        <div>
          {logs.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada riwayat.</p>
          ) : logs.map((log, i) => {
            const c = STATUS_COLORS[log.status_baru]
            return (
              <div key={log.id} style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
                  {i < logs.length - 1 && <div style={{ flex: 1, width: 1, background: '#E5E7EB', marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '12px 16px', marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: log.catatan ? 6 : 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}>
                      {log.status_lama && (
                        <>
                          <span style={{ color: '#9CA3AF' }}>{STATUS_LABELS[log.status_lama]}</span>
                          <span style={{ color: '#D1D5DB' }}>→</span>
                        </>
                      )}
                      <span style={{
                        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                        padding: '2px 8px', borderRadius: 4, fontWeight: 500, fontSize: 11,
                      }}>
                        {STATUS_LABELS[log.status_baru]}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                      {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.catatan && <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>{log.catatan}</p>}
                  {log.nama_user && <p style={{ margin: '3px 0 0', fontSize: 11, color: '#9CA3AF' }}>oleh {log.nama_user}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
