'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KprStatus, STATUS_LABELS, STATUS_ORDER } from '@/lib/kpr-types'

const BANK_LIST = ['BTN', 'BRI', 'BNI', 'Mandiri', 'BSI', 'BCA', 'CIMB Niaga', 'Permata', 'Maybank', 'Lainnya']

const CLUSTERS: Record<string, { nama: string; lb: number; lt: number }[]> = {
  Montana: [
    { nama: 'Gwen',                lb: 38, lt: 72  },
    { nama: 'Gwen Hook',           lb: 38, lt: 72  },
    { nama: 'Gwen Double Facade',  lb: 38, lt: 106 },
    { nama: 'Darlene',             lb: 45, lt: 91  },
    { nama: 'Angeline',            lb: 45, lt: 90  },
    { nama: 'Angeline Hook',       lb: 45, lt: 133 },
  ],
  Sierra: [
    { nama: 'Bianca Garden',       lb: 55, lt: 72   },
    { nama: 'Bianca Garden',       lb: 55, lt: 95.7 },
    { nama: 'Bianca Deluxe',       lb: 65, lt: 72   },
    { nama: 'Bianca Deluxe',       lb: 65, lt: 95.7 },
    { nama: 'Arnica Garden',       lb: 70, lt: 90   },
    { nama: 'Arnica Garden',       lb: 70, lt: 160  },
    { nama: 'Arnica Private Pool', lb: 91, lt: 90   },
    { nama: 'Arnica Private Pool', lb: 91, lt: 160  },
  ],
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 5,
  border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
  color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5,
}

export default function NasabahBaruPage() {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({
    status: 'berkas_masuk',
    tanggal_masuk: new Date().toISOString().split('T')[0],
    nama_developer: 'PT Neo Pudji Jaya',
    nama_proyek: 'Shaistanaya City',
  })
  const [cluster, setCluster] = useState('')
  const [tipeIdx, setTipeIdx] = useState('')
  const [background, setBackground] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const tipeOptions = cluster ? CLUSTERS[cluster] : []
  const selectedTipe = tipeIdx !== '' ? tipeOptions[parseInt(tipeIdx)] : null

  function handleClusterChange(val: string) {
    setCluster(val)
    setTipeIdx('')
    set('tipe_properti', '')
  }

  function handleTipeChange(idx: string) {
    setTipeIdx(idx)
    if (idx !== '' && cluster) {
      const t = CLUSTERS[cluster][parseInt(idx)]
      set('tipe_properti', `${cluster} - ${t.nama} (LB ${t.lb}/LT ${t.lt})`)
    } else {
      set('tipe_properti', '')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama?.trim()) { setError('Nama nasabah wajib diisi.'); return }
    setSaving(true); setError('')
    const { data: session } = await supabase.auth.getSession()
    const payload = {
      ...form, user_id: session?.session?.user?.id, background_notes: background,
      penghasilan_bulanan: form.penghasilan_bulanan ? parseInt(form.penghasilan_bulanan) : null,
      nilai_properti: form.nilai_properti ? parseInt(form.nilai_properti) : null,
      nilai_kpr: form.nilai_kpr ? parseInt(form.nilai_kpr) : null,
    }
    const { data, error: err } = await supabase.from('kpr_nasabah').insert(payload).select().single()
    if (err || !data) { setError('Gagal menyimpan.'); setSaving(false); return }
    await supabase.rpc('insert_default_dokumen', { p_nasabah_id: data.id })
    await supabase.from('kpr_status_log').insert({
      nasabah_id: data.id, status_baru: data.status,
      catatan: 'Berkas baru masuk', nama_user: form.nama_marketing || 'System',
    })
    router.push(`/nasabah/${data.id}`)
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 10 }}>
          Kembali
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>Tambah Nasabah Baru</h1>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Data Diri */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Diri</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'nama', label: 'Nama Lengkap *', placeholder: 'Sesuai KTP' },
              { key: 'nik', label: 'NIK', placeholder: '16 digit' },
              { key: 'no_hp', label: 'No. HP / WA', placeholder: '08xxx' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input type={f.type || 'text'} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* Data Pekerjaan */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Pekerjaan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'pekerjaan', label: 'Pekerjaan', placeholder: 'Karyawan / Wiraswasta / PNS' },
              { key: 'nama_perusahaan', label: 'Nama Perusahaan', placeholder: 'PT. ...' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>Penghasilan Bulanan</label>
              <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                <span style={{ padding: '8px 10px', background: '#F9FAFB', fontSize: 12, color: '#9CA3AF', borderRight: '1px solid #E5E7EB' }}>Rp</span>
                <input type="number" value={form.penghasilan_bulanan || ''} onChange={e => set('penghasilan_bulanan', e.target.value)}
                  placeholder="0" style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 13, outline: 'none', color: '#111827' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Properti */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Properti & KPR</h2>

          {/* Project info (read-only display) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Proyek</label>
              <input value={form.nama_proyek} onChange={e => set('nama_proyek', e.target.value)} style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280' }} />
            </div>
            <div>
              <label style={labelStyle}>Developer</label>
              <input value={form.nama_developer} onChange={e => set('nama_developer', e.target.value)} style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280' }} />
            </div>
          </div>

          {/* Cluster + Tipe */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Cluster</label>
              <select value={cluster} onChange={e => handleClusterChange(e.target.value)} style={inputStyle}>
                <option value="">-- Pilih Cluster --</option>
                <option value="Montana">Montana</option>
                <option value="Sierra">Sierra</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipe Unit</label>
              <select value={tipeIdx} onChange={e => handleTipeChange(e.target.value)} disabled={!cluster} style={{ ...inputStyle, background: cluster ? '#FFFFFF' : '#F9FAFB' }}>
                <option value="">-- Pilih Tipe --</option>
                {tipeOptions.map((t, i) => (
                  <option key={i} value={i}>{t.nama} — LB {t.lb}m² / LT {t.lt}m²</option>
                ))}
              </select>
            </div>
          </div>

          {/* LB LT info card */}
          {selectedTipe && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: '10px 16px', marginBottom: 14, display: 'flex', gap: 24, fontSize: 12 }}>
              <div><span style={{ color: '#9CA3AF' }}>Cluster</span> <strong style={{ color: '#111827', marginLeft: 6 }}>{cluster}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>Tipe</span> <strong style={{ color: '#111827', marginLeft: 6 }}>{selectedTipe.nama}</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>LB</span> <strong style={{ color: '#111827', marginLeft: 6 }}>{selectedTipe.lb} m²</strong></div>
              <div><span style={{ color: '#9CA3AF' }}>LT</span> <strong style={{ color: '#111827', marginLeft: 6 }}>{selectedTipe.lt} m²</strong></div>
            </div>
          )}

          {/* Nilai & Bank */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { key: 'nilai_properti', label: 'Harga Properti' },
              { key: 'nilai_kpr', label: 'Nilai KPR' },
            ].map(f => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                  <span style={{ padding: '8px 10px', background: '#F9FAFB', fontSize: 12, color: '#9CA3AF', borderRight: '1px solid #E5E7EB' }}>Rp</span>
                  <input type="number" value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                    placeholder="0" style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 13, outline: 'none', color: '#111827' }} />
                </div>
              </div>
            ))}
            <div>
              <label style={labelStyle}>Bank Tujuan</label>
              <select value={form.bank_tujuan || ''} onChange={e => set('bank_tujuan', e.target.value)} style={inputStyle}>
                <option value="">-- Pilih --</option>
                {BANK_LIST.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Info Marketing */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Info Marketing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Nama Marketing PIC</label>
              <input value={form.nama_marketing || ''} onChange={e => set('nama_marketing', e.target.value)} placeholder="Nama marketing" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status Awal</label>
              <select value={form.status || 'berkas_masuk'} onChange={e => set('status', e.target.value)} style={inputStyle}>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s as KprStatus]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tanggal Masuk Berkas</label>
              <input type="date" value={form.tanggal_masuk || ''} onChange={e => set('tanggal_masuk', e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Background notes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Background & Catatan
          </h2>
          <textarea value={background} onChange={e => setBackground(e.target.value)} rows={4}
            placeholder="Riwayat kredit, karakteristik nasabah, dll..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 14px', color: '#991B1B', fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving} style={{
            padding: '9px 20px', background: saving ? '#6B7280' : '#111827', color: '#F9FAFB',
            border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Menyimpan...' : 'Simpan Nasabah'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            padding: '9px 16px', background: '#FFFFFF', color: '#374151',
            border: '1px solid #E5E7EB', borderRadius: 6, fontSize: 13, cursor: 'pointer',
          }}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
