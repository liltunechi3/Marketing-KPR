'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  KprNasabah, KprNote, KprDokumen, KprStatusLog, KprStatus, KprBankProgress,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER, formatRupiah, formatTanggal,
} from '@/lib/kpr-types'

const TABS = ['Info', 'Bank', 'Dokumen', 'Catatan', 'Riwayat']
const TIPE_PROPERTI = ['Rumah Tapak', 'Apartemen', 'Ruko', 'Tanah', 'Lainnya']

const HASIL_OPTIONS = [
  'Proses', 'ACC Full Plafon', 'ACC TUM', 'Banding', 'REJECT', 'REJECT Kol 5',
  'REJECT RPC', 'REJECT Usia', 'PIP', 'On Hold', 'Lainnya',
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', borderRadius: 5,
  border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
  color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#6B7280', marginBottom: 4,
}

const HASIL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  'ACC Full Plafon': { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  'ACC TUM': { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  'Banding': { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
  'REJECT': { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  'REJECT Kol 5': { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  'REJECT RPC': { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  'REJECT Usia': { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  'PIP': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'On Hold': { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
  'Proses': { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' },
}

function hasilStyle(hasil?: string) {
  if (!hasil) return {}
  const key = Object.keys(HASIL_COLORS).find(k => hasil.toUpperCase().includes(k.toUpperCase().replace('REJECT', 'REJECT'))) || hasil
  const c = HASIL_COLORS[key] || { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB' }
  return { background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }
}

export default function NasabahDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [nasabah, setNasabah] = useState<KprNasabah | null>(null)
  const [dokumen, setDokumen] = useState<KprDokumen[]>([])
  const [notes, setNotes] = useState<KprNote[]>([])
  const [logs, setLogs] = useState<KprStatusLog[]>([])
  const [bankProgress, setBankProgress] = useState<KprBankProgress[]>([])
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
  const [editingDokId, setEditingDokId] = useState<string | null>(null)
  const [dokNotes, setDokNotes] = useState('')
  const [pendingDokStatus, setPendingDokStatus] = useState<'belum' | 'sudah' | 'tidak_perlu' | null>(null)

  // Bank progress state
  const [addingBank, setAddingBank] = useState(false)
  const [editingBankId, setEditingBankId] = useState<string | null>(null)
  const [bankForm, setBankForm] = useState<Partial<KprBankProgress>>({ nama_bank: '', nama_pic: '', timeline: '', hasil: '', urutan: 1 })
  const [savingBank, setSavingBank] = useState(false)

  // SLIK / catatan umum inline edit
  const [editingSlik, setEditingSlik] = useState(false)
  const [slikDraft, setSlikDraft] = useState('')
  const [editingCatatan, setEditingCatatan] = useState(false)
  const [catatanDraft, setCatatanDraft] = useState('')

  const fetchAll = useCallback(async () => {
    const [n, d, no, l, bp, sess] = await Promise.all([
      supabase.from('kpr_nasabah').select('*').eq('id', id).single(),
      supabase.from('kpr_dokumen').select('*').eq('nasabah_id', id).order('nama_dokumen'),
      supabase.from('kpr_notes').select('*').eq('nasabah_id', id).order('created_at', { ascending: false }),
      supabase.from('kpr_status_log').select('*').eq('nasabah_id', id).order('created_at', { ascending: false }),
      supabase.from('kpr_bank_progress').select('*').eq('nasabah_id', id).order('urutan').order('created_at'),
      supabase.auth.getSession(),
    ])
    setNasabah(n.data); setEditForm(n.data || {})
    setDokumen(d.data || []); setNotes(no.data || []); setLogs(l.data || [])
    setBankProgress(bp.data || [])
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

  function handleDokumenClickStatus(dok: KprDokumen) {
    const next = dok.status === 'belum' ? 'sudah' : dok.status === 'sudah' ? 'tidak_perlu' : 'belum'
    setEditingDokId(dok.id); setPendingDokStatus(next); setDokNotes('')
  }

  async function handleDokumenSaveStatus() {
    if (!editingDokId || !pendingDokStatus || !dokNotes.trim()) return
    await supabase.from('kpr_dokumen').update({
      status: pendingDokStatus, keterangan: dokNotes.trim(), updated_at: new Date().toISOString(),
    }).eq('id', editingDokId)
    setDokumen(d => d.map(x => x.id === editingDokId ? { ...x, status: pendingDokStatus, keterangan: dokNotes.trim() } : x))
    setEditingDokId(null); setPendingDokStatus(null); setDokNotes('')
  }

  async function handleDokumenDelete(dokId: string) {
    if (!confirm('Hapus berkas ini?')) return
    await supabase.from('kpr_dokumen').delete().eq('id', dokId)
    setDokumen(d => d.filter(x => x.id !== dokId))
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
    const today = new Date().toISOString().split('T')[0]
    const autoDate: Partial<KprNasabah> = {
      status: newStatus,
      ...(newStatus === 'pengajuan_bank' && !nasabah.tanggal_pengajuan_bank ? { tanggal_pengajuan_bank: today } : {}),
      ...(newStatus === 'approval' && !nasabah.tanggal_approval ? { tanggal_approval: today } : {}),
      ...(newStatus === 'akad' && !nasabah.tanggal_akad ? { tanggal_akad: today } : {}),
      ...(newStatus === 'ditolak' && !nasabah.tanggal_ditolak ? { tanggal_ditolak: today } : {}),
    }
    await supabase.from('kpr_nasabah').update(autoDate).eq('id', id)
    await supabase.from('kpr_status_log').insert({
      nasabah_id: id, status_lama: nasabah.status, status_baru: newStatus,
      catatan: statusNote, nama_user: userEmail,
    })
    setNewStatus(''); setStatusNote(''); setChangingStatus(false)
    fetchAll()
  }

  async function handleSaveSlik() {
    await supabase.from('kpr_nasabah').update({ slik_notes: slikDraft }).eq('id', id)
    setNasabah(n => n ? { ...n, slik_notes: slikDraft } : n)
    setEditingSlik(false)
  }

  async function handleSaveCatatan() {
    await supabase.from('kpr_nasabah').update({ catatan_umum: catatanDraft }).eq('id', id)
    setNasabah(n => n ? { ...n, catatan_umum: catatanDraft } : n)
    setEditingCatatan(false)
  }

  async function handleSaveBank() {
    if (!bankForm.nama_bank?.trim()) return
    setSavingBank(true)
    if (editingBankId) {
      await supabase.from('kpr_bank_progress').update({
        nama_bank: bankForm.nama_bank, nama_pic: bankForm.nama_pic || null,
        timeline: bankForm.timeline || null, hasil: bankForm.hasil || null,
        urutan: bankForm.urutan || 1, updated_at: new Date().toISOString(),
      }).eq('id', editingBankId)
    } else {
      await supabase.from('kpr_bank_progress').insert({
        nasabah_id: id, nama_bank: bankForm.nama_bank, nama_pic: bankForm.nama_pic || null,
        timeline: bankForm.timeline || null, hasil: bankForm.hasil || null,
        urutan: bankForm.urutan || bankProgress.length + 1,
      })
    }
    setAddingBank(false); setEditingBankId(null)
    setBankForm({ nama_bank: '', nama_pic: '', timeline: '', hasil: '', urutan: 1 })
    setSavingBank(false)
    const { data } = await supabase.from('kpr_bank_progress').select('*').eq('nasabah_id', id).order('urutan').order('created_at')
    setBankProgress(data || [])
  }

  async function handleDeleteBank(bankId: string) {
    if (!confirm('Hapus data bank ini?')) return
    await supabase.from('kpr_bank_progress').delete().eq('id', bankId)
    setBankProgress(b => b.filter(x => x.id !== bankId))
  }

  function startEditBank(b: KprBankProgress) {
    setEditingBankId(b.id)
    setBankForm({ nama_bank: b.nama_bank, nama_pic: b.nama_pic || '', timeline: b.timeline || '', hasil: b.hasil || '', urutan: b.urutan })
    setAddingBank(false)
  }

  if (loading) return <div style={{ padding: 40, color: '#9CA3AF', fontSize: 13 }}>Memuat...</div>
  if (!nasabah) return <div style={{ padding: 40, color: '#991B1B', fontSize: 13 }}>Data tidak ditemukan.</div>

  const col = STATUS_COLORS[nasabah.status]
  const ef = editForm

  const BankForm = () => (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 18px', marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        {editingBankId ? 'Edit Bank' : 'Tambah Bank'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Nama Bank *</label>
          <input value={bankForm.nama_bank || ''} onChange={e => setBankForm(f => ({ ...f, nama_bank: e.target.value }))}
            placeholder="cth: BRI Sidoarjo" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Nama PIC</label>
          <input value={bankForm.nama_pic || ''} onChange={e => setBankForm(f => ({ ...f, nama_pic: e.target.value }))}
            placeholder="cth: Jody" style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={labelStyle}>Timeline Proses (satu baris = satu langkah)</label>
        <textarea value={bankForm.timeline || ''} onChange={e => setBankForm(f => ({ ...f, timeline: e.target.value }))}
          rows={4} placeholder={'Berkas Masuk (18 Mei)\nOTS (19 Mei)\nAnalis (26 Mei)\nACC Full Plafon (17 Juni)'}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Hasil Akhir</label>
          <select value={bankForm.hasil || ''} onChange={e => setBankForm(f => ({ ...f, hasil: e.target.value }))} style={inputStyle}>
            <option value="">-- Pilih --</option>
            {HASIL_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Urutan Tampil</label>
          <input type="number" value={bankForm.urutan || 1} onChange={e => setBankForm(f => ({ ...f, urutan: parseInt(e.target.value) || 1 }))}
            style={inputStyle} min={1} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSaveBank} disabled={savingBank || !bankForm.nama_bank?.trim()}
          style={{
            padding: '7px 16px', border: 'none', borderRadius: 5, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            background: bankForm.nama_bank?.trim() ? '#111827' : '#E5E7EB',
            color: bankForm.nama_bank?.trim() ? '#F9FAFB' : '#9CA3AF',
          }}>
          {savingBank ? 'Menyimpan...' : 'Simpan'}
        </button>
        <button onClick={() => { setAddingBank(false); setEditingBankId(null); setBankForm({ nama_bank: '', nama_pic: '', timeline: '', hasil: '', urutan: 1 }) }}
          style={{ padding: '7px 14px', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 5, fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
          Batal
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', maxWidth: 920 }}>
      <button onClick={() => router.push('/nasabah')} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 12 }}>
        Kembali ke Daftar
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>{nasabah.nama}</h1>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <span style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}`, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
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
            placeholder="Catatan (opsional)" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
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
            {t}{t === 'Bank' && bankProgress.length > 0 ? ` (${bankProgress.length})` : ''}
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
                { key: 'tipe_properti', label: 'Unit / Blok' },
                { key: 'nilai_properti', label: 'Nilai Properti', type: 'number' },
                { key: 'nilai_kpr', label: 'Nilai KPR', type: 'number' },
                { key: 'bank_tujuan', label: 'Bank Tujuan' },
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
              {(['tanggal_pengajuan_bank', 'tanggal_approval', 'tanggal_akad', 'tanggal_ditolak'] as (keyof KprNasabah)[]).map(k => (
                <div key={k as string}>
                  <label style={labelStyle}>
                    {k === 'tanggal_pengajuan_bank' ? 'Tgl Pengajuan Bank' : k === 'tanggal_approval' ? 'Tgl Approval' : k === 'tanggal_akad' ? 'Tgl Akad' : 'Tgl Ditolak'}
                  </label>
                  <input type="date" value={(ef[k] as string) || ''}
                    onChange={e => setEditForm(x => ({ ...x, [k]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
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
                  ['Unit / Blok', nasabah.tipe_properti], ['Proyek', nasabah.nama_proyek],
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
          </div>
        )
      )}

      {/* TAB: Bank */}
      {tab === 'Bank' && (
        <div>
          {/* SLIK */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLIK / BI Checking</p>
              {!editingSlik && (
                <button onClick={() => { setEditingSlik(true); setSlikDraft(nasabah.slik_notes || '') }}
                  style={{ fontSize: 11, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </div>
            {editingSlik ? (
              <div>
                <textarea value={slikDraft} onChange={e => setSlikDraft(e.target.value)} rows={4}
                  placeholder="Suami: kol 1 semua lancar, OS 4jt&#10;Istri: kol 1 lancar aktif, OS 7jt"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveSlik} style={{ padding: '6px 14px', background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Simpan</button>
                  <button onClick={() => setEditingSlik(false)} style={{ padding: '6px 12px', border: '1px solid #E5E7EB', background: '#FFFFFF', borderRadius: 5, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Batal</button>
                </div>
              </div>
            ) : nasabah.slik_notes ? (
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{nasabah.slik_notes}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>Belum diisi.</p>
            )}
          </div>

          {/* Bank Progress Cards */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Progress Per Bank
            </p>
            {!addingBank && !editingBankId && (
              <button onClick={() => { setAddingBank(true); setBankForm({ nama_bank: '', nama_pic: '', timeline: '', hasil: '', urutan: bankProgress.length + 1 }) }}
                style={{ padding: '5px 12px', background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                + Tambah Bank
              </button>
            )}
          </div>

          {addingBank && !editingBankId && <BankForm />}

          {bankProgress.length === 0 && !addingBank && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '24px 20px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              Belum ada data bank. Klik "+ Tambah Bank" untuk mulai.
            </div>
          )}

          {bankProgress.map(b => (
            <div key={b.id}>
              {editingBankId === b.id ? (
                <BankForm />
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: b.timeline ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{b.nama_bank}</span>
                      {b.nama_pic && <span style={{ fontSize: 12, color: '#9CA3AF' }}>PIC: {b.nama_pic}</span>}
                      {b.hasil && <span style={hasilStyle(b.hasil)}>{b.hasil}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => startEditBank(b)}
                        style={{ fontSize: 11, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteBank(b.id)}
                        style={{ fontSize: 11, color: '#991B1B', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                  {b.timeline && (
                    <div style={{ borderLeft: '2px solid #F3F4F6', paddingLeft: 14 }}>
                      {b.timeline.split('\n').filter(Boolean).map((step, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                            background: i === arr.length - 1 ? '#111827' : '#D1D5DB',
                          }} />
                          <span style={{
                            fontSize: 12, color: i === arr.length - 1 ? '#374151' : '#6B7280',
                            fontWeight: i === arr.length - 1 ? 500 : 400,
                          }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Catatan Umum */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catatan Umum</p>
              {!editingCatatan && (
                <button onClick={() => { setEditingCatatan(true); setCatatanDraft(nasabah.catatan_umum || '') }}
                  style={{ fontSize: 11, color: '#6B7280', background: 'none', border: '1px solid #E5E7EB', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                  Edit
                </button>
              )}
            </div>
            {editingCatatan ? (
              <div>
                <textarea value={catatanDraft} onChange={e => setCatatanDraft(e.target.value)} rows={4}
                  placeholder="Catatan umum, kendala, info penting..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7, marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSaveCatatan} style={{ padding: '6px 14px', background: '#111827', color: '#F9FAFB', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>Simpan</button>
                  <button onClick={() => setEditingCatatan(false)} style={{ padding: '6px 12px', border: '1px solid #E5E7EB', background: '#FFFFFF', borderRadius: 5, fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>Batal</button>
                </div>
              </div>
            ) : nasabah.catatan_umum ? (
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{nasabah.catatan_umum}</p>
            ) : (
              <p style={{ fontSize: 13, color: '#D1D5DB', margin: 0 }}>Belum diisi.</p>
            )}
          </div>
        </div>
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
          {dokumen.length === 0 && <p style={{ padding: 20, color: '#9CA3AF', fontSize: 13 }}>Belum ada dokumen.</p>}
          {dokumen.map(dok => (
            <div key={dok.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', gap: 10 }}>
                <button onClick={() => handleDokumenClickStatus(dok)} style={{
                  width: 22, height: 22, borderRadius: 4, border: '1px solid #D1D5DB',
                  cursor: 'pointer', flexShrink: 0, fontSize: 12,
                  background: dok.status === 'sudah' ? '#111827' : dok.status === 'tidak_perlu' ? '#F3F4F6' : '#FFFFFF',
                  color: dok.status === 'sudah' ? '#F9FAFB' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {dok.status === 'sudah' ? '✓' : dok.status === 'tidak_perlu' ? '−' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: 13,
                    color: dok.status === 'sudah' ? '#111827' : dok.status === 'tidak_perlu' ? '#D1D5DB' : '#374151',
                    textDecoration: dok.status === 'tidak_perlu' ? 'line-through' : 'none',
                  }}>
                    {dok.nama_dokumen}
                  </span>
                  {dok.keterangan && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{dok.keterangan}</div>}
                </div>
                <button onClick={() => handleDokumenDelete(dok.id)}
                  style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B', fontSize: 11, cursor: 'pointer' }}>
                  Hapus
                </button>
              </div>
              {editingDokId === dok.id && (
                <div style={{ padding: '0 20px 12px 52px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    Ubah ke: <strong>{pendingDokStatus === 'sudah' ? 'Sudah' : pendingDokStatus === 'tidak_perlu' ? 'Tdk Perlu' : 'Belum'}</strong>
                  </div>
                  <input autoFocus value={dokNotes} onChange={e => setDokNotes(e.target.value)}
                    placeholder="Catatan wajib diisi..."
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 5, border: '1px solid #E5E7EB', fontSize: 12, outline: 'none' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleDokumenSaveStatus() }}
                  />
                  <button onClick={handleDokumenSaveStatus} disabled={!dokNotes.trim()}
                    style={{
                      padding: '6px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      background: dokNotes.trim() ? '#111827' : '#E5E7EB',
                      color: dokNotes.trim() ? '#F9FAFB' : '#9CA3AF',
                    }}>
                    Simpan
                  </button>
                  <button onClick={() => { setEditingDokId(null); setPendingDokStatus(null); setDokNotes('') }}
                    style={{ padding: '6px 10px', borderRadius: 5, border: '1px solid #E5E7EB', background: '#FFFFFF', fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>
                    Batal
                  </button>
                </div>
              )}
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
              placeholder="Nama Anda" style={{ ...inputStyle, marginBottom: 8 }} />
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
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>Ringkasan Perjalanan Pipeline</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {STATUS_ORDER.map((s, i) => {
                const reached = [...logs].reverse().find(l => l.status_baru === s)
                const isCurrent = nasabah.status === s
                const c = STATUS_COLORS[s]
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%', flexShrink: 0, marginTop: 10,
                        background: reached ? (isCurrent ? '#111827' : '#6B7280') : '#E5E7EB',
                        border: isCurrent ? '2px solid #111827' : '2px solid transparent',
                        boxSizing: 'border-box',
                      }} />
                      {i < STATUS_ORDER.length - 1 && (
                        <div style={{ width: 2, flex: 1, background: reached ? '#D1D5DB' : '#F3F4F6', minHeight: 8 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: i < STATUS_ORDER.length - 1 ? 8 : 0, paddingTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: reached ? (isCurrent ? '#111827' : '#374151') : '#D1D5DB' }}>
                          {STATUS_LABELS[s]}
                        </span>
                        {isCurrent && (
                          <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '1px 7px', borderRadius: 3, fontSize: 10, fontWeight: 600 }}>
                            SEKARANG
                          </span>
                        )}
                        {reached && (
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>
                            {new Date(reached.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Log Perubahan</p>
          {logs.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada riwayat.</p>
          ) : [...logs].reverse().map((log, i, arr) => {
            const c = STATUS_COLORS[log.status_baru]
            return (
              <div key={log.id} style={{ display: 'flex', gap: 14, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === arr.length - 1 ? '#111827' : '#D1D5DB', flexShrink: 0 }} />
                  {i < arr.length - 1 && <div style={{ flex: 1, width: 1, background: '#E5E7EB', marginTop: 2, minHeight: 16 }} />}
                </div>
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 14px', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: log.catatan ? 5 : 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {log.status_lama && (
                        <>
                          <span style={{ color: '#9CA3AF', fontSize: 12 }}>{STATUS_LABELS[log.status_lama]}</span>
                          <span style={{ color: '#D1D5DB', fontSize: 12 }}>→</span>
                        </>
                      )}
                      <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>
                        {STATUS_LABELS[log.status_baru]}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
                      {new Date(log.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {log.catatan && <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>{log.catatan}</p>}
                  {log.nama_user && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>oleh {log.nama_user}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
