export const CAREGIVERS = [
  { id: 'c1', name: '魏寶玫', avatar: '魏', color: '#B8543A' },
  { id: 'c2', name: '黃美蓉', avatar: '黃', color: '#7A9474' },
  { id: 'c3', name: '鳳麗粉', avatar: '鳳', color: '#C68B4F' },
  { id: 'c4', name: '王紫菁', avatar: '王', color: '#8E6BA8' },
  { id: 'c5', name: '侯天祥', avatar: '侯', color: '#5B7B8C' },
]

export const RECIPIENTS = [
  { id: 'r1',  code: '108I01011', name: '黃淑',     gender: '女', cms: 5, age: 82, primaryCaregiver: 'c1', conditions: ['高血壓','糖尿病'],     emergencyContact: '黃大哥', phone: '0912-345-678', address: '雲林縣水林鄉信義路 12 號', bathDays: ['二','四','五'], notes: '飯後須服藥',       level: '一般戶' },
  { id: 'r2',  code: '112I00846', name: '許淑娥',   gender: '女', cms: 7, age: 88, primaryCaregiver: 'c1', conditions: ['失智症','高血壓'],     emergencyContact: '許小妹', phone: '0922-111-222', address: '雲林縣水林鄉新光街 45 號', bathDays: ['二','四','五'], notes: '行動需輔助',       level: '一般戶' },
  { id: 'r3',  code: '113I04298', name: '林漸源',   gender: '女', cms: 6, age: 79, primaryCaregiver: 'c1', conditions: ['關節炎','心律不整'],   emergencyContact: '林大哥', phone: '0933-444-555', address: '雲林縣水林鄉中山路 88 號', bathDays: ['二','四','五'], notes: '近有低燒觀察',     level: '一般戶' },
  { id: 'r4',  code: '111I09380', name: '吳林惠',   gender: '女', cms: 4, age: 75, primaryCaregiver: 'c1', conditions: ['輕度失智'],           emergencyContact: '吳太太', phone: '0955-666-777', address: '雲林縣水林鄉自由路 23 號', bathDays: ['二','四','五'], notes: '喜歡唱歌活動',     level: '一般戶' },
  { id: 'r5',  code: '111I04824', name: '吳週惠',   gender: '男', cms: 5, age: 80, primaryCaregiver: 'c1', conditions: ['中風後遺症'],         emergencyContact: '吳大哥', phone: '0966-888-999', address: '雲林縣水林鄉建和路 56 號', bathDays: ['二','四','五'], notes: '需輔助步行',       level: '一般戶' },
  { id: 'r6',  code: '114I07561', name: '高吳燕妹', gender: '女', cms: 5, age: 84, primaryCaregiver: 'c1', conditions: ['糖尿病','腎臟病'],     emergencyContact: '高小妹', phone: '0911-222-333', address: '雲林縣水林鄉復興路 78 號', bathDays: ['二','四','五'], notes: '飲食需管控',       level: '中低戶' },
  { id: 'r7',  code: '112I05354', name: '高吳花',   gender: '女', cms: 5, age: 86, primaryCaregiver: 'c1', conditions: ['骨質疏鬆'],           emergencyContact: '高大哥', phone: '0918-555-666', address: '雲林縣水林鄉仁愛路 11 號', bathDays: ['二','四','五'], notes: '預防跌倒',         level: '一般戶' },
  { id: 'r8',  code: '109I05620', name: '卓謙福',   gender: '男', cms: 6, age: 81, primaryCaregiver: 'c5', conditions: ['帕金森氏症'],         emergencyContact: '卓太太', phone: '0925-777-888', address: '雲林縣水林鄉三興路 67 號', bathDays: ['五','一'],     notes: '需隨行攙扶',     level: '一般戶' },
  { id: 'r9',  code: '112I04485', name: '楊祖居',   gender: '男', cms: 4, age: 76, primaryCaregiver: 'c5', conditions: ['輕度中風'],           emergencyContact: '楊大哥', phone: '0936-999-000', address: '雲林縣水林鄉忠孝路 34 號', bathDays: ['五','一'],     notes: '能自行如廁',     level: '一般戶' },
  { id: 'r10', code: '114I00709', name: '吳雴春',   gender: '男', cms: 5, age: 78, primaryCaregiver: 'c4', conditions: ['高血壓','糖尿病'],     emergencyContact: '吳小妹', phone: '0944-111-555', address: '雲林縣水林鄉信義路 99 號', bathDays: ['二','四','五'], notes: '活動度佳',         level: '一般戶' },
  { id: 'r11', code: '114I00749', name: '魏大連',   gender: '男', cms: 4, age: 73, primaryCaregiver: 'c3', conditions: ['關節炎'],             emergencyContact: '魏大哥', phone: '0987-333-444', address: '雲林縣水林鄉平和路 22 號', bathDays: ['五','一'],     notes: '喜歡戶外活動',   level: '一般戶' },
  { id: 'r12', code: '110I04605', name: '黃美發',   gender: '男', cms: 4, age: 79, primaryCaregiver: 'c2', conditions: ['輕度失智'],           emergencyContact: '黃太太', phone: '0911-666-777', address: '雲林縣水林鄉路中路  5 號', bathDays: ['二','四','五'], notes: '情緒穩定',         level: '一般戶' },
  { id: 'r13', code: '115I01905', name: '高鄭娟公', gender: '女', cms: 2, age: 72, primaryCaregiver: 'c3', conditions: ['輕度認知障礙'],       emergencyContact: '高大哥', phone: '0928-444-555', address: '雲林縣水林鄉公正路 18 號', bathDays: ['五','一'],     notes: '自費為主',         level: '一般戶' },
  { id: 'r14', code: '108T00106', name: '許連美',   gender: '女', cms: 6, age: 85, primaryCaregiver: 'c2', conditions: ['失智症'],             emergencyContact: '許大哥', phone: '0939-222-111', address: '雲林縣水林鄉中和路 41 號', bathDays: ['二','四','五'], notes: '獨居需陪伴',       level: '中低戶' },
  { id: 'r15', code: '108I01547', name: '沈吳柔',   gender: '女', cms: 5, age: 83, primaryCaregiver: 'c2', conditions: ['高血壓'],             emergencyContact: '沈小妹', phone: '0966-333-222', address: '雲林縣水林鄉松梅街  7 號', bathDays: ['二','四','五'], notes: '血壓需追蹤',       level: '一般戶' },
  { id: 'r16', code: '108I01875', name: '許松柔',   gender: '女', cms: 6, age: 87, primaryCaregiver: 'c2', conditions: ['心臟病','高血壓'],     emergencyContact: '許太太', phone: '0918-777-666', address: '雲林縣水林鄉新梅路 29 號', bathDays: ['二','四','五'], notes: '近有低燒中',       level: '一般戶' },
  { id: 'r17', code: '111I10791', name: '魏沈彩花', gender: '女', cms: 5, age: 81, primaryCaregiver: 'c2', conditions: ['關節炎'],             emergencyContact: '魏大哥', phone: '0922-888-555', address: '雲林縣水林鄉西平路 14 號', bathDays: ['五','一'],     notes: '喜歡手工藝',     level: '一般戶' },
  { id: 'r18', code: '112I05090', name: '林渠泉',   gender: '男', cms: 4, age: 77, primaryCaregiver: 'c1', conditions: ['糖尿病'],             emergencyContact: '林太太', phone: '0933-111-888', address: '雲林縣水林鄉永安街 36 號', bathDays: ['五','一'],     notes: '飲食管控',         level: '一般戶' },
  { id: 'r19', code: '114I01008', name: '鐘鄭絲',   gender: '女', cms: 3, age: 74, primaryCaregiver: 'c3', conditions: ['輕度失智'],           emergencyContact: '鐘小妹', phone: '0955-444-333', address: '雲林縣水林鄉松森路 52 號', bathDays: ['五','一'],     notes: '記憶活動參與佳', level: '一般戶' },
]

// 模擬出缺席狀態（實際應從資料庫讀取）
export const STATUS_TYPES = {
  present:  { label: '出席', bg: '#E8DCC4', text: '#5C3A1E', dot: '#7A9474' },
  rest:     { label: '休假', bg: '#F5E6D3', text: '#A0541E', dot: '#D4A574' },
  hospital: { label: '住院', bg: '#F0D5D0', text: '#8B2C20', dot: '#A53838' },
  clinic:   { label: '回診', bg: '#D8E2EA', text: '#2D4F6A', dot: '#5B7B8C' },
  blood:    { label: '抽血', bg: '#EDD8DC', text: '#8B3A4A', dot: '#B8546A' },
  respite:  { label: '喘息', bg: '#E2D5E8', text: '#5C2D6A', dot: '#8E6BA8' },
  absent:   { label: '未到', bg: '#EAE5DA', text: '#6B5D4A', dot: '#A09684' },
}
