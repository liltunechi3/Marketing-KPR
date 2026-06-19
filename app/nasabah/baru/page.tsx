'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { KprStatus, STATUS_LABELS, STATUS_ORDER } from '@/lib/kpr-types'

const BANK_LIST = ['BTN', 'BRI', 'BNI', 'Mandiri', 'BSI', 'BCA', 'CIMB Niaga', 'Permata', 'Maybank', 'Lainnya']
const TIPE_PROPERTI = ['Rumah Tapak', 'Apartemen', 'Ruko', 'Tanah', 'Lainnya']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 5,
  border: '1px solid #E5E7EB', fontSize: 13, outline: 'none',
  color: '#111827', background: '#FFFFFF', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5,
}

type Field = { key: string; label: string; type?: string; options?: string[]; placeholder?: string; prefix?: string }

const SECTIONS: { title: string; fields: Field[] }[] = [
  {
    title: 'Data Diri',
    fields: [
      { key: 'nama', label: 'Nama Lengkap *', placeholder: 'Sesuai KTP' },
      { key: 'nik', label: 'NIK', placeholder: '16 digit' },
      { key: 'no_hp', label: 'No. HP / WA', placeholder: '08xxx' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com' },
    ],
  },
  {
    title: 'Data Pekerjaan',
    fields: [
      { key: 'pekerjaan', label: 'Pekerjaan', placeholder: 'Karyawan / Wiraswasta / PNS' },
      { key: 'nama_perusahaan', label: 'Nama Perusahaan', placeholder: 'PT. ...' },
      { key: 'penghasilan_bulanan', label: 'Penghasilan Bulanan', type: 'number', placeholder: '0', prefix: 'Rp' },
    ],
  },
  {
    title: 'Data Properti & KPR',
    fields: [
      { key: 'tipe_properti', label: 'Tipe Properti', options: TIPE_PROPERTI },
      { key: 'nama_proyek', label: 'Nama Proyek', placeholder: 'Perumahan ...' },
      { key: 'nama_developer', label: 'Developer', placeholder: 'PT. ...' },
      { key: 'nilai_properti', label: 'Harga Properti', type: 'number', placeholder: '0', prefix: 'Rp' },
      { key: 'nilai_kpr', label: 'Nilai KPR', type: 'number', placeholder: '0', prefix: 'Rp' },
      { key: 'bank_tujuan', label: 'Bank Tujuan', options: BANK_LIST },
    ],
  },
  {
    title: 'Info Marketing',
    fields: [
      { key: 'nama_marketing', label: 'Nama Marketing PIC', placeholder: 'Nama marketing' },
      { key: 'status', label: 'Status Awal', options: STATUS_ORDER.map(s => s) },
      { key: 'tanggal_masuk', label: 'Tanggal Masuk Berkas', type: 'date' },
    ],
  },
]

export default function NasabahBaruPage() {
  const router = useRouter()
  const [form, setForm] = useState<Record<string, string>>({
    status: 'berkas_masuk',
    tanggal_masuk: new Date().toISOString().split('T')[0],
  })
  const [background, setBackground] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

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
        {SECTIONS.map(section => (
          <div key={section.title} style={{
            background: '#FFFFFF', border: '1px solid #E5E7EB',
            borderRadius: 8, padding: '20px 24px', marginBottom: 12,
          }}>
            <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {section.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {section.fields.map(f => (
                <div key={f.key}>
                  <label style={labelStyle}>{f.label}</label>
                  {f.options ? (
                    <select value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} style={{ ...inputStyle }}>
                      <option value="">-- Pilih --</option>
                      {f.options.map(o => (
                        <option key={o} value={o}>{f.key === 'status' ? STATUS_LABELS[o as KprStatus] : o}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: 5, overflow: 'hidden', background: '#FFFFFF' }}>
                      {f.prefix && (
                        <span style={{ padding: '8px 10px', background: '#F9FAFB', fontSize: 12, color: '#9CA3AF', borderRight: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                          {f.prefix}
                        </span>
                      )}
                      <input
                        type={f.type || 'text'} value={form[f.key] || ''}
                        onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
                        style={{ flex: 1, padding: '8px 10px', border: 'none', fontSize: 13, outline: 'none', color: '#111827' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Background notes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Background & Catatan
          </h2>
          <textarea
            value={background} onChange={e => setBackground(e.target.value)} rows={4}
            placeholder="Riwayat kredit, karakteristik nasabah, dll..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
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
