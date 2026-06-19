export type KprStatus =
  | 'berkas_masuk'
  | 'verifikasi_internal'
  | 'pengajuan_bank'
  | 'bi_checking'
  | 'penilaian_agunan'
  | 'approval'
  | 'akad'
  | 'ditolak'
  | 'batal'

export const STATUS_LABELS: Record<KprStatus, string> = {
  berkas_masuk: 'Berkas Masuk',
  verifikasi_internal: 'Verifikasi Internal',
  pengajuan_bank: 'Pengajuan Bank',
  bi_checking: 'BI/SLIK Checking',
  penilaian_agunan: 'Penilaian Agunan',
  approval: 'Approval',
  akad: 'Akad',
  ditolak: 'Ditolak',
  batal: 'Batal',
}

export const STATUS_COLORS: Record<KprStatus, { bg: string; text: string; border: string }> = {
  berkas_masuk:        { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  verifikasi_internal: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  pengajuan_bank:      { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  bi_checking:         { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  penilaian_agunan:    { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  approval:            { bg: '#111827', text: '#F9FAFB', border: '#111827' },
  akad:                { bg: '#111827', text: '#F9FAFB', border: '#111827' },
  ditolak:             { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  batal:               { bg: '#F9FAFB', text: '#9CA3AF', border: '#E5E7EB' },
}

export const STATUS_ORDER: KprStatus[] = [
  'berkas_masuk',
  'verifikasi_internal',
  'pengajuan_bank',
  'bi_checking',
  'penilaian_agunan',
  'approval',
  'akad',
  'ditolak',
  'batal',
]

export interface KprNasabah {
  id: string
  nama: string
  nik?: string
  no_hp?: string
  email?: string
  pekerjaan?: string
  nama_perusahaan?: string
  penghasilan_bulanan?: number
  status: KprStatus
  nama_marketing?: string
  user_id?: string
  tipe_properti?: string
  nilai_properti?: number
  nilai_kpr?: number
  nama_developer?: string
  nama_proyek?: string
  bank_tujuan?: string
  tanggal_masuk: string
  tanggal_pengajuan_bank?: string
  tanggal_approval?: string
  tanggal_akad?: string
  tanggal_ditolak?: string
  alasan_ditolak?: string
  background_notes?: string
  created_at: string
  updated_at: string
}

export interface KprNote {
  id: string
  nasabah_id: string
  user_id?: string
  nama_penulis: string
  isi: string
  created_at: string
}

export interface KprDokumen {
  id: string
  nasabah_id: string
  nama_dokumen: string
  status: 'belum' | 'sudah' | 'tidak_perlu'
  keterangan?: string
  updated_at: string
}

export interface KprStatusLog {
  id: string
  nasabah_id: string
  status_lama?: KprStatus
  status_baru: KprStatus
  catatan?: string
  nama_user?: string
  created_at: string
}

export function formatRupiah(value?: number | null): string {
  if (!value) return '-'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

export function formatTanggal(dateStr?: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
