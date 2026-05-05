import { useState, useMemo } from 'react'
import { ChevronRight, Plus, AlertCircle, Activity, Heart, Droplets, Wind, FileText } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useData } from '../context/DataContext.jsx'
import VitalCard from '../components/VitalCard.jsx'
import LegendDot from '../components/LegendDot.jsx'

export default function HealthView({ healthRecords, onSelectRecipient }) {
  const { recipients: RECIPIENTS } = useData()
  const [pickedId, setPickedId] = useState(RECIPIENTS[0]?.id ?? '')
  const recipient = RECIPIENTS.find(r => r.id === pickedId)
  const records = healthRecords[pickedId] || []
  const recent = [...records].slice(-7).reverse()

  const avg = useMemo(() => {
    if (records.length === 0) return null
    const sum = records.reduce((acc, r) => ({
      temp: acc.temp + r.temp,
      pulse: acc.pulse + r.pulse,
      systolic: acc.systolic + r.systolic,
      diastolic: acc.diastolic + r.diastolic,
    }), { temp: 0, pulse: 0, systolic: 0, diastolic: 0 })
    return {
      temp: (sum.temp / records.length).toFixed(1),
      pulse: Math.round(sum.pulse / records.length),
      systolic: Math.round(sum.systolic / records.length),
      diastolic: Math.round(sum.diastolic / records.length),
    }
  }, [records])

  const lastRecord = records[records.length - 1]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
      {/* 左側長者列表 */}
      <div className="rounded-2xl p-3 border lg:col-span-1 scrollbar-thin"
        style={{ background: '#FFFAF0', borderColor: '#E5D5B7', maxHeight: 700, overflowY: 'auto' }}>
        <h3 className="font-display font-semibold px-2 py-2 mb-1" style={{ color: '#5C2828' }}>選擇長者</h3>
        <div className="space-y-1">
          {RECIPIENTS.map(r => (
            <button key={r.id} onClick={() => setPickedId(r.id)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center justify-between group"
              style={{ background: pickedId === r.id ? '#FBE8DC' : 'transparent' }}>
              <div>
                <div className="font-display font-medium" style={{ color: pickedId === r.id ? '#A53838' : '#5C2828' }}>{r.name}</div>
                <div className="text-xs font-mono" style={{ color: '#8B6F47' }}>{r.code}</div>
              </div>
              {pickedId === r.id && <ChevronRight size={16} style={{ color: '#A53838' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 主內容 */}
      <div className="lg:col-span-3 space-y-5">
        {/* 長者資訊卡 */}
        <div className="rounded-2xl p-5 border flex items-start justify-between flex-wrap gap-4"
          style={{ background: 'linear-gradient(135deg, #FFFAF0, #FBE8DC)', borderColor: '#E5D5B7' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold text-2xl"
              style={{ background: '#A53838', color: 'white' }}>
              {recipient.name[0]}
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold" style={{ color: '#5C2828' }}>{recipient.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: '#8B6F47' }}>
                <span>{recipient.gender} · {recipient.age} 歲</span>
                <span>·</span>
                <span className="font-mono">{recipient.code}</span>
                <span>·</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: '#EAE0CC', color: '#5C3A1E' }}>CMS {recipient.cms}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {recipient.conditions.map(c => (
                  <span key={c} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(165,56,56,0.1)', color: '#A53838' }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => onSelectRecipient(recipient)}
            className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition hover:shadow-md"
            style={{ background: '#A53838', color: 'white' }}>
            <FileText size={16} /> 完整資料
          </button>
        </div>

        {/* 最新量測 + 平均值 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <VitalCard icon={<Activity size={18} />} label="體溫" value={lastRecord?.temp ?? '–'} unit="°C" avg={avg?.temp} color="#C68B4F" />
          <VitalCard icon={<Heart size={18} />} label="脈搏" value={lastRecord?.pulse ?? '–'} unit="bpm" avg={avg?.pulse} color="#A53838" />
          <VitalCard icon={<Droplets size={18} />} label="收縮壓" value={lastRecord?.systolic ?? '–'} unit="mmHg" avg={avg?.systolic} color="#5B7B8C" />
          <VitalCard icon={<Wind size={18} />} label="舒張壓" value={lastRecord?.diastolic ?? '–'} unit="mmHg" avg={avg?.diastolic} color="#7A9474" />
        </div>

        {/* 趨勢圖 */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          <h3 className="font-display font-semibold mb-4" style={{ color: '#5C2828' }}>本月趨勢圖（近 30 日）</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={records} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CC" />
                <XAxis dataKey="date" tick={{ fill: '#8B6F47', fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fill: '#8B6F47', fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8B6F47', fontSize: 11 }} domain={[35, 38]} />
                <Tooltip contentStyle={{ background: '#FFFAF0', border: '1px solid #C4A87A', borderRadius: 8 }} labelStyle={{ color: '#5C2828', fontWeight: 600 }} />
                <Line yAxisId="left" type="monotone" dataKey="systolic" stroke="#5B7B8C" strokeWidth={2} dot={{ r: 3 }} name="收縮壓" />
                <Line yAxisId="left" type="monotone" dataKey="diastolic" stroke="#7A9474" strokeWidth={2} dot={{ r: 3 }} name="舒張壓" />
                <Line yAxisId="left" type="monotone" dataKey="pulse" stroke="#A53838" strokeWidth={2} dot={{ r: 3 }} name="脈搏" />
                <Line yAxisId="right" type="monotone" dataKey="temp" stroke="#C68B4F" strokeWidth={2} dot={{ r: 3 }} name="體溫" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs justify-center">
            <LegendDot color="#5B7B8C" label="收縮壓" />
            <LegendDot color="#7A9474" label="舒張壓" />
            <LegendDot color="#A53838" label="脈搏" />
            <LegendDot color="#C68B4F" label="體溫（右軸）" />
          </div>
        </div>

        {/* 近7日紀錄表 */}
        <div className="rounded-2xl p-5 border" style={{ background: '#FFFAF0', borderColor: '#E5D5B7' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold" style={{ color: '#5C2828' }}>近 7 日紀錄</h3>
            <button className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 font-medium transition hover:shadow-md"
              style={{ background: '#A53838', color: 'white' }}>
              <Plus size={14} /> 新增量測
            </button>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#FBF1DD' }}>
                  {['日期','時間','體溫 °C','脈搏','血壓','異常備記','紀錄者'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-display font-semibold" style={{ color: '#5C2828' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((rec, i) => {
                  const tempAbnormal = rec.temp > 37.5
                  const bpAbnormal = rec.systolic > 140 || rec.systolic < 90
                  return (
                    <tr key={i} className="border-t" style={{ borderColor: '#EAE0CC' }}>
                      <td className="px-3 py-2 font-mono" style={{ color: '#5C3A1E' }}>{rec.fullDate}</td>
                      <td className="px-3 py-2 font-mono text-xs" style={{ color: '#8B6F47' }}>{rec.time}</td>
                      <td className="px-3 py-2 text-center font-medium" style={{ color: tempAbnormal ? '#A53838' : '#5C2828' }}>
                        {rec.temp}{tempAbnormal && <AlertCircle size={12} className="inline ml-1" />}
                      </td>
                      <td className="px-3 py-2 text-center font-medium" style={{ color: '#5C2828' }}>{rec.pulse}</td>
                      <td className="px-3 py-2 text-center font-medium" style={{ color: bpAbnormal ? '#A53838' : '#5C2828' }}>
                        {rec.systolic}/{rec.diastolic}
                        {bpAbnormal && <AlertCircle size={12} className="inline ml-1" />}
                      </td>
                      <td className="px-3 py-2 text-xs" style={{ color: '#8B6F47' }}>{rec.notes || '–'}</td>
                      <td className="px-3 py-2 text-xs" style={{ color: '#8B6F47' }}>{rec.recorder}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
