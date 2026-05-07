-- ================================================================
-- 水林紅蘋果長照中心 · 案務管理系統
-- Supabase 資料庫 Schema + 初始資料
-- 請在 Supabase Dashboard > SQL Editor 貼上此檔案並執行
-- ================================================================

-- ── 1. 建立資料表 ────────────────────────────────────────────

-- 照服員
create table if not exists caregivers (
  id          text primary key,
  name        text not null,
  avatar      text,
  color       text default '#A53838',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 長者
create table if not exists recipients (
  id                  text primary key,
  code                text not null,
  name                text not null,
  gender              text not null default '女',
  age                 integer,
  cms                 integer not null default 5,
  primary_caregiver   text references caregivers(id) on delete set null,
  conditions          jsonb default '[]',
  emergency_contact   text,
  phone               text,
  address             text,
  bath_days           jsonb default '[]',
  notes               text,
  level               text default '一般戶',
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 出缺席紀錄 (date = 'YYYY/MM/DD')
create table if not exists attendance (
  id            bigserial primary key,
  date          text not null,
  recipient_id  text not null references recipients(id) on delete cascade,
  status        text not null default 'present',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(date, recipient_id)
);

-- 照服員每日配對
create table if not exists assignments (
  id            bigserial primary key,
  date          text not null,
  recipient_id  text not null references recipients(id) on delete cascade,
  caregiver_id  text not null references caregivers(id) on delete cascade,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(date, recipient_id)
);

-- 健康紀錄
create table if not exists health_records (
  id            bigserial primary key,
  recipient_id  text not null references recipients(id) on delete cascade,
  full_date     text not null,
  date          text not null,
  time          text,
  temp          numeric(4,1),
  pulse         integer,
  systolic      integer,
  diastolic     integer,
  weight        integer,
  notes         text default '',
  recorder      text default '魏寶玫',
  created_at    timestamptz default now()
);

-- ── 2. 開啟 RLS 並設定公開存取政策 ────────────────────────────
-- (待加入登入系統後可收緊此政策)

alter table caregivers    enable row level security;
alter table recipients    enable row level security;
alter table attendance    enable row level security;
alter table assignments   enable row level security;
alter table health_records enable row level security;

create policy "public_all" on caregivers     for all to anon using (true) with check (true);
create policy "public_all" on recipients     for all to anon using (true) with check (true);
create policy "public_all" on attendance     for all to anon using (true) with check (true);
create policy "public_all" on assignments    for all to anon using (true) with check (true);
create policy "public_all" on health_records for all to anon using (true) with check (true);

-- ── 3. 植入初始資料 ───────────────────────────────────────────

-- 照服員
insert into caregivers (id, name, avatar, color) values
  ('c1', '魏寶玫', '魏', '#B8543A'),
  ('c2', '黃美蓉', '黃', '#7A9474'),
  ('c3', '鳳麗粉', '鳳', '#C68B4F'),
  ('c4', '王紫菁', '王', '#8E6BA8'),
  ('c5', '侯天祥', '侯', '#5B7B8C')
on conflict (id) do nothing;

-- 長者
insert into recipients (id, code, name, gender, age, cms, primary_caregiver, conditions, emergency_contact, phone, address, bath_days, notes, level) values
  ('r1',  '108I01011', '黃淑',     '女', 82, 5, 'c1', '["高血壓","糖尿病"]',     '黃大哥', '0912-345-678', '雲林縣水林鄉信義路 12 號', '["二","四","五"]', '飯後須服藥',       '一般戶'),
  ('r2',  '112I00846', '許王折',   '女', 88, 7, 'c1', '["失智症","高血壓"]',     '許小妹', '0922-111-222', '雲林縣水林鄉新光街 45 號', '["二","四","五"]', '行動需輔助',       '一般戶'),
  ('r3',  '113I04298', '楊漸有',   '女', 79, 6, 'c1', '["關節炎","心律不整"]',   '楊大哥', '0933-444-555', '雲林縣水林鄉中山路 88 號', '["二","四","五"]', '近有低燒觀察',     '一般戶'),
  ('r4',  '111I09380', '陳楊挽',   '女', 75, 4, 'c1', '["輕度失智"]',           '陳太太', '0955-666-777', '雲林縣水林鄉自由路 23 號', '["二","四","五"]', '喜歡唱歌活動',     '一般戶'),
  ('r5',  '111I04824', '陳金昆',   '男', 80, 5, 'c1', '["中風後遺症"]',         '陳大哥', '0966-888-999', '雲林縣水林鄉建和路 56 號', '["二","四","五"]', '需輔助步行',       '一般戶'),
  ('r6',  '114I07561', '林陳雪琴', '女', 84, 5, 'c1', '["糖尿病","腎臟病"]',     '林小妹', '0911-222-333', '雲林縣水林鄉復興路 78 號', '["二","四","五"]', '飲食需管控',       '中低戶'),
  ('r7',  '112I05354', '李陳英',   '女', 86, 5, 'c1', '["骨質疏鬆"]',           '李大哥', '0918-555-666', '雲林縣水林鄉仁愛路 11 號', '["二","四","五"]', '預防跌倒',         '一般戶'),
  ('r8',  '109I05620', '吳萬福',   '男', 81, 6, 'c5', '["帕金森氏症"]',         '吳太太', '0925-777-888', '雲林縣水林鄉三興路 67 號', '["五","一"]',     '需隨行攙扶',       '一般戶'),
  ('r9',  '112I04485', '曾燥局',   '男', 76, 4, 'c5', '["輕度中風"]',           '曾大哥', '0936-999-000', '雲林縣水林鄉忠孝路 34 號', '["五","一"]',     '能自行如廁',       '一般戶'),
  ('r10', '114I00709', '陳鴻楠',   '男', 78, 5, 'c4', '["高血壓","糖尿病"]',     '陳小妹', '0944-111-555', '雲林縣水林鄉信義路 99 號', '["二","四","五"]', '活動度佳',         '一般戶'),
  ('r11', '114I00749', '鄭双飛',   '男', 73, 4, 'c3', '["關節炎"]',             '鄭大哥', '0987-333-444', '雲林縣水林鄉平和路 22 號', '["五","一"]',     '喜歡戶外活動',     '一般戶'),
  ('r12', '110I04605', '黃振發',   '男', 79, 4, 'c2', '["輕度失智"]',           '黃太太', '0911-666-777', '雲林縣水林鄉路中路  5 號', '["二","四","五"]', '情緒穩定',         '一般戶'),
  ('r13', '115I01905', '許鐘圓嬌', '女', 72, 2, 'c3', '["輕度認知障礙"]',       '許大哥', '0928-444-555', '雲林縣水林鄉公正路 18 號', '["五","一"]',     '自費為主',         '一般戶'),
  ('r20', '115I01863', '李洪秀玉', '女', 78, 4, 'c4', '["高血壓"]',             '李大哥', '0912-001-863', '雲林縣水林鄉光明路  3 號', '["二","四"]',     '',                 '一般戶'),
  ('r14', '108T00106', '許莊綱',   '女', 85, 6, 'c2', '["失智症"]',             '許大哥', '0939-222-111', '雲林縣水林鄉中和路 41 號', '["二","四","五"]', '獨居需陪伴',       '中低戶'),
  ('r15', '108I01547', '王陳緞',   '女', 83, 5, 'c2', '["高血壓"]',             '王小妹', '0966-333-222', '雲林縣水林鄉松梅街  7 號', '["二","四","五"]', '血壓需追蹤',       '一般戶'),
  ('r16', '108I01875', '許曾緞',   '女', 87, 6, 'c2', '["心臟病","高血壓"]',     '許太太', '0918-777-666', '雲林縣水林鄉新梅路 29 號', '["二","四","五"]', '近有低燒中',       '一般戶'),
  ('r17', '111I10791', '鄭王彩英', '女', 81, 5, 'c2', '["關節炎"]',             '鄭大哥', '0922-888-555', '雲林縣水林鄉西平路 14 號', '["五","一"]',     '喜歡手工藝',       '一般戶'),
  ('r18', '112I05090', '李清池',   '男', 77, 4, 'c1', '["糖尿病"]',             '李太太', '0933-111-888', '雲林縣水林鄉永安街 36 號', '["五","一"]',     '飲食管控',         '一般戶'),
  ('r19', '114I01008', '程金絲',   '女', 74, 3, 'c3', '["輕度失智"]',           '程小妹', '0955-444-333', '雲林縣水林鄉松森路 52 號', '["五","一"]',     '記憶活動參與佳',   '一般戶'),
  ('r21', '114I07602', '郭亨',     '女', 71, 3, 'c4', '["輕度失智"]',           '郭大哥', '0912-760-200', '雲林縣水林鄉大安路  9 號', '["二","五"]',     '',                 '一般戶'),
  ('r22', '114J09290', '侯巽秀雲', '女', 75, 4, 'c5', '["高血壓"]',             '侯大哥', '0912-929-000', '嘉義市東區忠孝路  5 號',   '["一","三"]',     '嘉義往返',         '一般戶'),
  ('r23', '112I01976', '陳金海',   '男', 79, 5, 'c3', '["糖尿病","高血壓"]',     '陳太太', '0912-197-600', '雲林縣水林鄉海埔路  2 號', '["二","四"]',     '',                 '一般戶'),
  ('r24', '112I02241', '李陳玉梅', '女', 76, 4, 'c2', '["關節炎"]',             '李大哥', '0912-224-100', '雲林縣水林鄉仁德路  7 號', '["三","五"]',     '',                 '一般戶')
on conflict (id) do nothing;
