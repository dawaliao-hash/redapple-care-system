// 水林紅蘋果長照中心 — 115年現役個案（共37人）
// serviceCategory: 'elderly'=65歲以上老人, 'disabled_65up'=65歲以上身障,
//   'disabled_64down'=64歲以下身障, 'indigenous'=55-64歲原住民, 'dementia'=50歲以上失智
const R = (o) => ({ isActive: true, closedAt: null, closeReason: '',
  disabilities: { categories: [], level: '輕度' }, ...o })

export const RECIPIENTS = [

  // ── 郭桂蘭（c1）── 7人 ───────────────────────────────
  R({ id: 'r1',  code: '108I01011', name: '黃淑',     gender: '女', cms: 5, age: 77, primaryCaregiver: 'c1',
    conditions: ['糖尿病','躁鬱症','帕金森氏症及右膝骨裂術後'],
    emergencyContact: '李明遠', phone: '0929-062178', address: '雲林縣水林鄉松中村頂厝32號',
    bathDays: ['二','四','五'], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r2',  code: '112I00846', name: '許王折',   gender: '女', cms: 7, age: 92, primaryCaregiver: 'c1',
    conditions: ['年長虛弱'],
    emergencyContact: '許信義', phone: '0987-825838', address: '雲林縣水林鄉後寮村後埔25號',
    bathDays: ['二','四','五'], notes: '行動需輔助', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r3',  code: '113I04298', name: '楊漸有',   gender: '女', cms: 6, age: 73, primaryCaregiver: 'c1',
    conditions: ['憂鬱症'],
    emergencyContact: '黃秀方', phone: '0981-070818', address: '雲林縣水林鄉松北村松北18-5號',
    bathDays: ['二','四','五'], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r4',  code: '111I09380', name: '陳楊挽',   gender: '女', cms: 4, age: 95, primaryCaregiver: 'c1',
    conditions: ['高血脂','雙眼白內障術後'],
    emergencyContact: '陳培木', phone: '0958-510560', address: '雲林縣水林鄉水南村東陽街54號',
    bathDays: ['二','四','五'], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r5',  code: '111I04824', name: '陳金昆',   gender: '男', cms: 5, age: 62, primaryCaregiver: 'c1',
    conditions: ['高血壓','糖尿病','巴金森氏症'],
    emergencyContact: '陳梓緯', phone: '0980-363990', address: '雲林縣水林鄉萬興村萬興126號',
    bathDays: ['二','四','五'], notes: '', level: '第三類', serviceCategory: 'disabled_64down' }),

  R({ id: 'r6',  code: '114I07561', name: '林陳雪琴', gender: '女', cms: 5, age: 76, primaryCaregiver: 'c1',
    conditions: ['雙眼白內障術後','曾C肝(打過干擾素)','長期肝指數異常過高','肝臟腫瘤'],
    emergencyContact: '林濬順', phone: '0980-234175', address: '雲林縣口湖鄉臺子村台興路120巷20號',
    bathDays: ['二','四','五'], notes: '飲食需管控', level: '第二類', serviceCategory: 'elderly' }),

  R({ id: 'r7',  code: '112I05354', name: '李陳英',   gender: '女', cms: 5, age: 85, primaryCaregiver: 'c1',
    conditions: ['高血壓','脊椎術後'],
    emergencyContact: '郭秋惠', phone: '0928-852975', address: '雲林縣水林鄉順興村順興路55號',
    bathDays: ['二','四','五'], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  // ── 侯天祥（c2）── 7人 ───────────────────────────────
  R({ id: 'r8',  code: '109I05620', name: '吳萬福',   gender: '男', cms: 6, age: 69, primaryCaregiver: 'c2',
    conditions: ['高血壓','糖尿病','腦中風','左肢體偏癱'],
    emergencyContact: '吳妻許惠珠', phone: '0968-773608', address: '雲林縣北港鎮華勝里仁愛路107號',
    bathDays: ['五','一'], notes: '輪椅使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r9',  code: '112I04485', name: '曾煥局',   gender: '男', cms: 4, age: 67, primaryCaregiver: 'c2',
    conditions: ['高血壓','中風'],
    emergencyContact: '曾前妻鄭婷妮', phone: '0952-695936', address: '雲林縣水林鄉水北村店前路72巷17號',
    bathDays: ['五','一'], notes: '輪椅使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r10', code: '114I00709', name: '陳鴻楠',   gender: '男', cms: 5, age: 53, primaryCaregiver: 'c2',
    conditions: ['高血壓','脊椎壓迫神經術後'],
    emergencyContact: '陳妻', phone: '0930-649552', address: '雲林縣水林鄉水南村東陽街81號',
    bathDays: ['二','四','五'], notes: '輪椅使用', level: '第三類', serviceCategory: 'disabled_64down' }),

  R({ id: 'r11', code: '114I00749', name: '鄭双飛',   gender: '男', cms: 3, age: 96, primaryCaregiver: 'c2',
    conditions: ['攝護腺肥大術後','貧血'],
    emergencyContact: '鄭惠惠', phone: '0928-852975', address: '雲林縣水林鄉大溝村大溝路85號',
    bathDays: ['五','一'], notes: '單獨居住', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r12', code: '110I04605', name: '黃振發',   gender: '男', cms: 4, age: 97, primaryCaregiver: 'c2',
    conditions: ['高血壓','腦中風','雙眼白內障術後'],
    emergencyContact: '黃慶勇', phone: '0921-559112', address: '雲林縣水林鄉松中村蔦松路221號',
    bathDays: ['二','四','五'], notes: '單獨居住', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r13', code: '115I01905', name: '李鍾圓嬌', gender: '女', cms: 2, age: 74, primaryCaregiver: 'c2',
    conditions: ['高血壓','脊椎壓迫術後','右肩骨折術後','雙眼白內障術後','左眼視網膜剝離術後'],
    emergencyContact: '李國廉', phone: '0989-006296', address: '雲林縣水林鄉大溝村大溝路120號',
    bathDays: ['五','一'], notes: '單獨居住', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r20', code: '115I01863', name: '李洪秀玉', gender: '女', cms: 2, age: 80, primaryCaregiver: 'c2',
    conditions: ['小中風','失智症','雙眼白內障','青光眼術後'],
    emergencyContact: '李時鐸', phone: '0929-996999', address: '雲林縣水林鄉大山村大山128之10號',
    bathDays: ['二','四'], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  // ── 黃景怡（c3）── 7人 ───────────────────────────────
  R({ id: 'r14', code: '108T00106', name: '許莊綢',   gender: '女', cms: 6, age: 97, primaryCaregiver: 'c3',
    conditions: ['良性肺腫瘤','過敏性腸躁症','雙膝退化性關節炎','雙股骨人工關節置換術後'],
    emergencyContact: '許金鑫', phone: '0970-518120', address: '雲林縣水林鄉海埔村海埔21號',
    bathDays: ['二','四','五'], notes: '助行器使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r15', code: '108I01547', name: '王陳緞',   gender: '女', cms: 5, age: 87, primaryCaregiver: 'c3',
    conditions: ['高血壓','腰椎退化至神經壓迫','心臟病','帕金森氏症','帶狀皰疹'],
    emergencyContact: '王議城', phone: '0933-422773', address: '雲林縣水林鄉順興村順興17號',
    bathDays: ['二','四','五'], notes: '四肢癱', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r16', code: '108I01875', name: '許曾緞',   gender: '女', cms: 6, age: 88, primaryCaregiver: 'c3',
    conditions: ['高血壓','糖尿病','雙膝退化性關節炎','左大腿骨折行內固定術後','雙眼白內障術後','胃潰瘍'],
    emergencyContact: '許金城', phone: '0932-588818', address: '雲林縣水林鄉海埔村海埔96-1號',
    bathDays: ['二','四','五'], notes: '助行器使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r17', code: '111I10791', name: '鄭王彩英', gender: '女', cms: 5, age: 93, primaryCaregiver: 'c3',
    conditions: ['高血壓','糖尿病','左側小中風','慢性B型肝炎'],
    emergencyContact: '鄭勝傑', phone: '0911-899029', address: '雲林縣水林鄉溪墘村湖子內29號',
    bathDays: ['五','一'], notes: '助行器使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r18', code: '112I05090', name: '李清池',   gender: '男', cms: 6, age: 90, primaryCaregiver: 'c3',
    conditions: ['失智症','小中風'],
    emergencyContact: '李位鎔', phone: '0911-750660', address: '雲林縣水林鄉山腳村尖山路7號',
    bathDays: ['五','一'], notes: '輪椅使用', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r19', code: '114I01008', name: '程金絲',   gender: '女', cms: 6, age: 84, primaryCaregiver: 'c3',
    conditions: ['高血壓','失智症'],
    emergencyContact: '黃明光', phone: '0935-600755', address: '雲林縣水林鄉松北村松北路15之1號',
    bathDays: ['五','一'], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r21', code: '114I07602', name: '郭亨',     gender: '女', cms: 6, age: 81, primaryCaregiver: 'c3',
    conditions: ['帕金森氏症','失智症','雙眼白內障術後','眼翳病術後'],
    emergencyContact: '黃明淑', phone: '0956-917572', address: '雲林縣水林鄉松北村松東路27號',
    bathDays: ['二','五'], notes: '單獨居住', level: '第三類', serviceCategory: 'dementia' }),

  // ── 丁素惠（c4）── 8人 ───────────────────────────────
  R({ id: 'r22', code: '114J09290', name: '侯龔秀雲', gender: '女', cms: 3, age: 78, primaryCaregiver: 'c4',
    conditions: ['雙眼白內障術後','高血壓','高血脂','腦中風'],
    emergencyContact: '侯天敏', phone: '0917-172571', address: '嘉義縣六腳鄉永和里菜埔156之37號',
    bathDays: ['一','三'], notes: '嘉義往返', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r23', code: '112I01976', name: '陳金海',   gender: '男', cms: 4, age: 73, primaryCaregiver: 'c4',
    conditions: ['高血壓','失智症','糖尿病'],
    emergencyContact: '陳明龍', phone: '0982-081763', address: '雲林縣水林鄉土厝村大庄25-1號',
    bathDays: ['二','四'], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r24', code: '112I02241', name: '李陳玉梅', gender: '女', cms: 5, age: 93, primaryCaregiver: 'c4',
    conditions: ['高血壓','糖尿病'],
    emergencyContact: '李清淡', phone: '0909-631692', address: '雲林縣水林鄉大溝村78號',
    bathDays: ['三','五'], notes: '助行器使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r25', code: '112I07191', name: '王主',     gender: '男', cms: 5, age: 90, primaryCaregiver: 'c4',
    conditions: ['高血壓','小中風','腦中風','攝護腺肥大'],
    emergencyContact: '王阿菊', phone: '0958-494536', address: '雲林縣水林鄉水北村北中路59號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r26', code: '113I07705', name: '蘇姚雪',   gender: '女', cms: 4, age: 81, primaryCaregiver: 'c4',
    conditions: ['高血壓','雙眼白內障術後','失智症'],
    emergencyContact: '蘇崇候', phone: '0909-325253', address: '雲林縣水林鄉北港鎮扶朝里124號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r27', code: '114I00893', name: '楊李秀琴', gender: '女', cms: 4, age: 87, primaryCaregiver: 'c4',
    conditions: ['高血壓','脊椎側彎','腰椎間盤突出','失智症','雙膝退化性關節炎','雙眼白內障'],
    emergencyContact: '楊文男', phone: '0928-291922', address: '雲林縣水林鄉尖山村中尖山16號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r28', code: '114I07321', name: '陳何艷紅', gender: '女', cms: 4, age: 82, primaryCaregiver: 'c4',
    conditions: ['高血壓','糖尿病','雙膝退化性關節炎','雙眼白內障術後','心臟瓣膜退化','失智症'],
    emergencyContact: '李淑靜', phone: '0912-746390', address: '雲林縣水林鄉後寮村後寮72號',
    bathDays: [], notes: '單獨居住', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r29', code: '114I04126', name: '黃陳戍',   gender: '女', cms: 4, age: 88, primaryCaregiver: 'c4',
    conditions: ['骨質疏鬆症','疑似失智症','左眼黃斑部病變','右眼白內障術後','腦栓塞'],
    emergencyContact: '黃桓松', phone: '0937-352589', address: '雲林縣水林鄉水北村廟前路39號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  // ── 陳美玲（c5）── 8人 ───────────────────────────────
  R({ id: 'r30', code: '109I02739', name: '黃蔡月娥', gender: '女', cms: 6, age: 91, primaryCaregiver: 'c5',
    conditions: ['憂鬱症','失智症','巴金森氏症'],
    emergencyContact: '黃振茂', phone: '0928-369531', address: '雲林縣水林鄉灣東村宏仁路46-1號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r31', code: '112I06863', name: '蔡吳瓦',   gender: '女', cms: 6, age: 93, primaryCaregiver: 'c5',
    conditions: ['糖尿病','失智症'],
    emergencyContact: '蔡文清', phone: '0983-615599', address: '雲林縣水林鄉水北村顏厝寮56號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'dementia' }),

  R({ id: 'r32', code: '109I07286', name: '王蔡環',   gender: '女', cms: 2, age: 59, primaryCaregiver: 'c5',
    conditions: ['高血壓','糖尿病','認知功能退化'],
    emergencyContact: '郭麗香', phone: '0911-248349', address: '雲林縣水林鄉山腳村蕃東路83號',
    bathDays: [], notes: '', level: '第二類', serviceCategory: 'disabled_64down' }),

  R({ id: 'r33', code: '112I08727', name: '李壬子',   gender: '男', cms: 5, age: 74, primaryCaregiver: 'c5',
    conditions: ['高血壓','中風右側偏癱'],
    emergencyContact: '李佳欣', phone: '0979-106950', address: '雲林縣水林鄉大溝村大溝路123號',
    bathDays: [], notes: '輪椅使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r34', code: '114I04480', name: '王仁田',   gender: '男', cms: 4, age: 78, primaryCaregiver: 'c5',
    conditions: ['高血壓','心臟病','痛風','腎功能不全','失眠症','重聽'],
    emergencyContact: '王陳淑花', phone: '0925-918399', address: '雲林縣水林鄉後寮村後寮44號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r35', code: '110I07781', name: '王李桂鳳', gender: '女', cms: 4, age: 92, primaryCaregiver: 'c5',
    conditions: ['腦循環障礙','骨質疏鬆','心律不整'],
    emergencyContact: '王婉馨', phone: '0916-736519', address: '雲林縣水林鄉後寮村後埔30之1號',
    bathDays: [], notes: '', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r36', code: '114I06257', name: '余仁誥',   gender: '男', cms: 7, age: 86, primaryCaregiver: 'c5',
    conditions: ['高血壓','痛風','膽囊炎','腎炎'],
    emergencyContact: '余兆敦', phone: '0989-711743', address: '雲林縣水林鄉萬興村26號',
    bathDays: [], notes: '輪椅使用', level: '第三類', serviceCategory: 'elderly' }),

  R({ id: 'r37', code: '112I07988', name: '陳張淑女', gender: '女', cms: 6, age: 85, primaryCaregiver: 'c5',
    conditions: ['高血壓','高血脂','腦中風','左側偏癱','右腎摘除'],
    emergencyContact: '陳祐禎', phone: '0975-678311', address: '雲林縣水林鄉水南村水林路283巷23號',
    bathDays: [], notes: '輪椅使用', level: '第三類', serviceCategory: 'elderly' }),
]
