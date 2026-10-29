export const STATUS_TYPES = {
  present:  { label: '出席',   short: '8',  bg: '#E8DCC4', text: '#5C3A1E', dot: '#7A9474', days: 1.0 },
  am:       { label: '上午',   short: '上午',bg: '#E4F2E4', text: '#2D6B2D', dot: '#4CAF50', days: 0.5 },
  pm:       { label: '下午',   short: '下午',bg: '#E0EDF8', text: '#1A4D6B', dot: '#4A90C4', days: 0.5 },
  rest:     { label: '休假',   short: '休', bg: '#F5E6D3', text: '#A0541E', dot: '#D4A574', days: 0 },
  hospital: { label: '住院',   short: '住', bg: '#F0D5D0', text: '#8B2C20', dot: '#A53838', days: 1.0 },
  clinic:   { label: '回診',   short: '診', bg: '#D8E2EA', text: '#2D4F6A', dot: '#5B7B8C', days: 1.0 },
  blood:    { label: '抽血',   short: '抽', bg: '#EDD8DC', text: '#8B3A4A', dot: '#B8546A', days: 1.0 },
  respite:  { label: '喘息',   short: '喘', bg: '#E2D5E8', text: '#5C2D6A', dot: '#8E6BA8', days: 1.0 },
  // 自費：代表有來；上午/下午自費算半天，交通自費算全天（selfpay 沿用舊 key = 全日照顧自費）
  selfpay:    { label: '全日照顧自費',             short: '全自', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 1.0, selfpay: true },
  sp_full_t:  { label: '全日照顧和交通自費',       short: '全交', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 1.0, selfpay: true },
  sp_full_bt: { label: '全日照顧、洗澡及交通自費', short: '全洗', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 1.0, selfpay: true },
  sp_am:      { label: '上午照顧自費',             short: '上自', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_am_t:    { label: '上午照顧和交通自費',       short: '上交', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_am_bt:   { label: '上午照顧、洗澡及交通自費', short: '上洗', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_pm:      { label: '下午照顧自費',             short: '下自', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_pm_t:    { label: '下午照顧和交通自費',       short: '下交', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_pm_bt:   { label: '下午照顧、洗澡及交通自費', short: '下洗', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 0.5, selfpay: true },
  sp_tr_rt:   { label: '交通來回自費',             short: '交來', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 1.0, selfpay: true },
  sp_tr_ow:   { label: '交通單趟自費',             short: '交單', bg: '#FFF1C2', text: '#7A5B00', dot: '#D4A017', days: 1.0, selfpay: true },
  rotate:   { label: '輪住',   short: '輪', bg: '#DCE8E4', text: '#2F5D50', dot: '#5E9484', days: 0 },
  holiday:  { label: '國定假', short: '假', bg: '#F0EBF8', text: '#6A3D8E', dot: '#9B6CC8', days: 0 },
  absent:   { label: '未到',   short: '✕', bg: '#EAE5DA', text: '#6B5D4A', dot: '#A09684', days: 0 },
  closed:   { label: '結案',   short: '結', bg: '#3F3A36', text: '#FFFFFF', dot: '#3F3A36', days: 0 },
}

// 自費類狀態（今日點名以下拉選單呈現）
export const SELFPAY_KEYS = Object.keys(STATUS_TYPES).filter(k => STATUS_TYPES[k].selfpay)
export const isSelfpay = (k) => !!STATUS_TYPES[k]?.selfpay

// 視為「出席（有服務）」的狀態集合
export const PRESENT_STATUSES = new Set(['present','am','pm','clinic','hospital','blood','respite', ...SELFPAY_KEYS])
// 視為「缺席」的狀態集合
export const ABSENT_STATUSES  = new Set(['absent','rest','holiday','closed','rotate'])
