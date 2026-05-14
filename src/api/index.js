/**
 * Supabase API 服務層
 * 統一處理所有資料庫操作，並在 Supabase 不可用時降回 localStorage
 */
import { supabase, isOnline } from '../lib/supabase.js'
import { RECIPIENTS as DEFAULT_R } from '../data/recipients.js'
import { CAREGIVERS as DEFAULT_C } from '../data/caregivers.js'

// ── camelCase ↔ snake_case 轉換 ─────────────────────────────

const toRow = (r) => ({
  id: r.id,
  code: r.code,
  name: r.name,
  gender: r.gender,
  age: r.age,
  cms: r.cms,
  primary_caregiver: r.primaryCaregiver,
  conditions: r.conditions ?? [],
  emergency_contact: r.emergencyContact,
  phone: r.phone,
  address: r.address,
  bath_days: r.bathDays ?? [],
  notes: r.notes,
  level: r.level,
})

const fromRow = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  gender: row.gender,
  age: row.age,
  cms: row.cms,
  primaryCaregiver: row.primary_caregiver,
  conditions: row.conditions ?? [],
  emergencyContact: row.emergency_contact,
  phone: row.phone,
  address: row.address,
  bathDays: row.bath_days ?? [],
  notes: row.notes,
  level: row.level,
})

const cgFromRow = (row) => ({
  id: row.id,
  name: row.name,
  avatar: row.avatar,
  color: row.color,
})

const hrToRow = (recipientId, rec) => ({
  recipient_id: recipientId,
  full_date: rec.fullDate,
  date: rec.date,
  time: rec.time,
  temp: rec.temp,
  pulse: rec.pulse,
  systolic: rec.systolic,
  diastolic: rec.diastolic,
  weight: rec.weight ?? null,
  notes: rec.notes ?? '',
  recorder: rec.recorder ?? '魏寶玫',
})

const hrFromRow = (row) => ({
  fullDate: row.full_date,
  date: row.date,
  time: row.time,
  temp: parseFloat(row.temp),
  pulse: row.pulse,
  systolic: row.systolic,
  diastolic: row.diastolic,
  weight: row.weight,
  notes: row.notes ?? '',
  recorder: row.recorder,
})

// ════════════════════════════════════════════════════════════
// RECIPIENTS
// ════════════════════════════════════════════════════════════

export async function fetchRecipients() {
  if (!isOnline) return DEFAULT_R
  const { data, error } = await supabase.from('recipients').select('*').order('id')
  if (error) { console.error('[API] fetchRecipients:', error); return DEFAULT_R }
  return data.map(fromRow)
}

export async function upsertRecipient(r) {
  if (!isOnline) return r
  const { data, error } = await supabase
    .from('recipients')
    .upsert(toRow(r), { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return fromRow(data)
}

export async function deleteRecipient(id) {
  if (!isOnline) return
  const { error } = await supabase.from('recipients').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// CAREGIVERS
// ════════════════════════════════════════════════════════════

export async function fetchCaregivers() {
  if (!isOnline) return DEFAULT_C
  const { data, error } = await supabase.from('caregivers').select('*').order('id')
  if (error) { console.error('[API] fetchCaregivers:', error); return DEFAULT_C }
  return data.map(cgFromRow)
}

export async function upsertCaregiver(c) {
  if (!isOnline) return c
  const { data, error } = await supabase
    .from('caregivers')
    .upsert({ id: c.id, name: c.name, avatar: c.avatar, color: c.color }, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return cgFromRow(data)
}

export async function deleteCaregiver(id) {
  if (!isOnline) return
  const { error } = await supabase.from('caregivers').delete().eq('id', id)
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// ATTENDANCE  (date = 'YYYY/MM/DD')
// ════════════════════════════════════════════════════════════

export async function fetchAttendanceForMonth(year, month) {
  if (!isOnline) return {}
  const prefix = `${year}/${String(month).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('attendance')
    .select('date, recipient_id, status')
    .like('date', `${prefix}%`)
  if (error) { console.error('[API] fetchAttendanceForMonth:', error); return {} }
  const result = {}
  data.forEach(row => {
    if (!result[row.date]) result[row.date] = {}
    result[row.date][row.recipient_id] = row.status
  })
  return result
}

export async function upsertAttendance(date, recipientId, status) {
  if (!isOnline) return
  const { error } = await supabase
    .from('attendance')
    .upsert({ date, recipient_id: recipientId, status }, { onConflict: 'date,recipient_id' })
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ════════════════════════════════════════════════════════════

export async function fetchAssignmentsForDate(date) {
  if (!isOnline) return null
  const { data, error } = await supabase
    .from('assignments')
    .select('recipient_id, caregiver_id')
    .eq('date', date)
  if (error) { console.error('[API] fetchAssignmentsForDate:', error); return null }
  if (!data.length) return null
  const result = {}
  data.forEach(row => { result[row.recipient_id] = row.caregiver_id })
  return result
}

export async function upsertAssignment(date, recipientId, caregiverId) {
  if (!isOnline) return
  const { error } = await supabase
    .from('assignments')
    .upsert({ date, recipient_id: recipientId, caregiver_id: caregiverId }, { onConflict: 'date,recipient_id' })
  if (error) throw error
}

// ════════════════════════════════════════════════════════════
// HEALTH RECORDS
// ════════════════════════════════════════════════════════════

export async function fetchHealthRecords(recipientId) {
  if (!isOnline) return []
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('recipient_id', recipientId)
    .order('full_date', { ascending: true })
  if (error) { console.error('[API] fetchHealthRecords:', error); return [] }
  return data.map(hrFromRow)
}

export async function insertHealthRecord(recipientId, record) {
  if (!isOnline) return record
  const { data, error } = await supabase
    .from('health_records')
    .insert(hrToRow(recipientId, record))
    .select()
    .single()
  if (error) throw error
  return hrFromRow(data)
}

// 按日期 upsert（若同日已有資料則先刪再插入）
export async function upsertHealthRecordByDate(recipientId, record) {
  if (!isOnline) return record
  // 先刪除同一天的舊紀錄
  await supabase
    .from('health_records')
    .delete()
    .eq('recipient_id', recipientId)
    .eq('full_date', record.fullDate)
  // 再插入新的
  const { data, error } = await supabase
    .from('health_records')
    .insert(hrToRow(recipientId, record))
    .select()
    .single()
  if (error) throw error
  return hrFromRow(data)
}

// 取得特定月份的健康紀錄
export async function fetchHealthRecordsForMonth(recipientId, year, month) {
  if (!isOnline) return []
  const prefix = `${year}/${String(month).padStart(2, '0')}`
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('recipient_id', recipientId)
    .like('full_date', `${prefix}%`)
    .order('full_date', { ascending: true })
  if (error) { console.error('[API] fetchHealthRecordsForMonth:', error); return [] }
  return data.map(hrFromRow)
}
