import { Fragment } from 'react'
import { Typography, Table, Anchor, Grid } from 'antd'
import {
  BookOutlined,
  LoginOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  PhoneOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { useBreakpoint } = Grid

const roleColors: Record<string, { color: string; bg: string; border: string }> = {
  customer: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  coach: { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  owner: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  guest: { color: '#475569', bg: '#F8FAFC', border: '#CBD5E1' },
  trial: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA' },
}

function RoleChip({ role, children }: { role: keyof typeof roleColors; children: React.ReactNode }) {
  const c = roleColors[role]
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 100,
        padding: '1px 12px',
        fontSize: 12.5,
        fontWeight: 700,
        border: `1px solid ${c.border}`,
        color: c.color,
        background: c.bg,
        verticalAlign: 2,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function Note({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: React.ReactNode }) {
  const isWarn = tone === 'warn'
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        borderRadius: 12,
        padding: '13px 18px',
        margin: '16px 0',
        fontSize: 14,
        border: `1px solid ${isWarn ? '#FED7AA' : '#A7F3D0'}`,
        background: isWarn ? '#FFF7ED' : '#ECFDF5',
        color: '#334155',
        lineHeight: 1.8,
      }}
    >
      {isWarn ? (
        <ExclamationCircleFilled style={{ color: '#EA580C', flexShrink: 0, marginTop: 3 }} />
      ) : (
        <InfoCircleOutlined style={{ color: '#059669', flexShrink: 0, marginTop: 3 }} />
      )}
      <div>{children}</div>
    </div>
  )
}

function Flow({ steps }: { steps: { label: string; tone?: 'hl' | 'tr' }[] }) {
  const toneStyle = (tone?: 'hl' | 'tr') => {
    if (tone === 'hl') return { borderColor: '#059669', color: '#059669', background: '#ECFDF5' }
    if (tone === 'tr') return { borderColor: '#FED7AA', color: '#EA580C', background: '#FFF7ED' }
    return { borderColor: '#E2E8F0', color: '#0F172A', background: 'white' }
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, margin: '14px 0 18px' }}>
      {steps.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && <span style={{ color: '#94A3B8', fontWeight: 600 }}>→</span>}
          <span
            style={{
              borderRadius: 9,
              padding: '5px 13px',
              fontSize: 13.5,
              fontWeight: 600,
              border: '1.5px solid',
              ...toneStyle(s.tone),
            }}
          >
            {s.label}
          </span>
        </Fragment>
      ))}
    </div>
  )
}

function SectionCard({ children, accent = '#059669' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 14,
        padding: '22px 26px',
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  )
}

const statusRows = {
  booking: [
    { status: '已確認', meaning: '預約成立，等待上課' },
    { status: '申請取消中', meaning: '學員或教練已申請取消，等待店長審核' },
    { status: '已取消', meaning: '店長已同意取消' },
    { status: '已完成', meaning: '課程已完成' },
  ],
  trial: [
    { status: '待審核', meaning: '申請已送出，等待店長核准' },
    { status: '已核准', meaning: '試教成立，時段已保留' },
    { status: '已拒絕', meaning: '店長未核准此申請' },
    { status: '申請取消中', meaning: '教練申請取消，等待店長審核' },
    { status: '已取消', meaning: '已取消' },
  ],
  order: [
    { status: '待處理', meaning: '訂單成立，等待店家聯繫確認' },
    { status: '已付款', meaning: '店家已確認收款' },
    { status: '已完成', meaning: '商品已交付' },
    { status: '已取消', meaning: '訂單取消' },
  ],
}

const permissionRows: { feature: string; guest: string; customer: string; coach: string; owner: string }[] = [
  { feature: '瀏覽官網／教練陣容／商品', guest: '✓', customer: '✓', coach: '✓', owner: '✓' },
  { feature: '自助註冊', guest: '✓', customer: '—', coach: '—', owner: '—' },
  { feature: '申請 30 分鐘試教（需試教密碼）', guest: '✓', customer: '—', coach: '—', owner: '✓（代客）' },
  { feature: '預約教練課程', guest: '—', customer: '✓', coach: '—', owner: '✓' },
  { feature: '申請取消預約', guest: '—', customer: '✓（自己的）', coach: '✓（收到的）', owner: '審核' },
  { feature: '加入購物車', guest: '✓', customer: '✓', coach: '✓', owner: '✓' },
  { feature: '結帳下單', guest: '—', customer: '✓', coach: '✓', owner: '✓' },
  { feature: '查看自己的預約／訂單', guest: '—', customer: '✓', coach: '✓（收到的預約）', owner: '✓（全部）' },
  { feature: '填寫個人資料空白欄位', guest: '—', customer: '✓', coach: '✓', owner: '✓' },
  { feature: '編輯教練形象檔案（照片／簡介／頭銜）', guest: '—', customer: '—', coach: '✓（自己）', owner: '—' },
  { feature: '開放／刪除可授課時段', guest: '—', customer: '—', coach: '✓（自己）', owner: '✓（所有教練）' },
  { feature: '薪資試算', guest: '—', customer: '—', coach: '✓（自己）', owner: '✓（所有教練）' },
  { feature: '商品上下架／圖片／編輯／刪除', guest: '—', customer: '—', coach: '—', owner: '✓' },
  { feature: '訂單管理（更新狀態）', guest: '—', customer: '—', coach: '—', owner: '✓' },
  { feature: '帳號管理（建立帳號／指派角色／改會員資料）', guest: '—', customer: '—', coach: '—', owner: '✓' },
  { feature: '預約總覽（改期／審核取消／刪除）', guest: '—', customer: '—', coach: '—', owner: '✓' },
  { feature: '試教管理（密碼設定／審核）', guest: '—', customer: '—', coach: '—', owner: '✓' },
  { feature: '官網獲獎榮譽維護', guest: '—', customer: '—', coach: '—', owner: '✓' },
]

const faqs = [
  { q: '忘記註冊時填的姓名或電話，登入不了怎麼辦？', a: '請至「帳號管理」查詢並修正該會員的資料。' },
  { q: '會員想改姓名／手機／Email，但系統不給改？', a: '會員只能「填寫」尚未填過的欄位，修改既有資料請在「帳號管理」代為處理。' },
  { q: '預約後多久成立？', a: '一般預約點選時段後立即成立，不需教練確認。試教申請則需店長審核。' },
  { q: '預約可以直接取消嗎？', a: '不行，取消採申請制。學員或教練送出「申請取消」後，需在「預約總覽」點同意或拒絕才會生效。' },
  { q: '下單後怎麼付款？', a: '系統不提供線上付款。訂單成立後，請依顧客留的手機號碼主動聯繫，確認付款與取貨方式。' },
  { q: '試教密碼從哪裡設定？', a: '「試教管理」分頁最上方可設定與查看目前密碼；未設定密碼時，訪客端的試教功能會顯示尚未開放。' },
]

export default function GuidePage() {
  const screens = useBreakpoint()
  const isDesktop = screens.lg

  const anchorItems = [
    { key: 's1', href: '#s1', title: '系統簡介與網站導覽' },
    { key: 's2', href: '#s2', title: '註冊與登入' },
    { key: 's3', href: '#s3', title: '未登入訪客可以做什麼' },
    { key: 's4', href: '#s4', title: '顧客操作指南' },
    { key: 's5', href: '#s5', title: '教練操作指南' },
    { key: 's6', href: '#s6', title: '店長操作指南' },
    { key: 's7', href: '#s7', title: '狀態說明速查' },
    { key: 's8', href: '#s8', title: '權限總覽表' },
    { key: 's9', href: '#s9', title: '常見問題 FAQ' },
    { key: 's10', href: '#s10', title: '聯絡資訊' },
  ]

  const statusColumns = [
    { title: '狀態', dataIndex: 'status', key: 'status', width: 140 },
    { title: '意義', dataIndex: 'meaning', key: 'meaning' },
  ]

  const permCol = (title: string, key: 'guest' | 'customer' | 'coach' | 'owner') => ({
    title,
    dataIndex: key,
    key,
    align: 'center' as const,
    render: (v: string) => (
      <span style={{ fontWeight: 700, color: v.startsWith('✓') ? '#059669' : '#CBD5E1', whiteSpace: 'nowrap' }}>
        {v}
      </span>
    ),
  })

  return (
    <div>
      {/* Header banner */}
      <div
        style={{
          background: 'linear-gradient(140deg, #0F172A 0%, #1E3A5F 100%)',
          padding: '56px 32px 48px',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(5,150,105,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 100,
              padding: '6px 18px',
              marginBottom: 20,
            }}
          >
            <BookOutlined style={{ color: '#10B981', fontSize: 13 }} />
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600, letterSpacing: 0.3 }}>
              系統說明・USER GUIDE
            </Text>
          </div>
          <Title
            level={1}
            style={{
              color: 'white',
              fontWeight: 900,
              letterSpacing: '-1px',
              marginBottom: 12,
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
            }}
          >
            系統使用者操作手冊
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, margin: 0, maxWidth: 560 }}>
            教練預約・試教體驗・球具商城 —— 店長、教練、顧客與訪客的完整操作指南。此頁僅店長可見。
          </Paragraph>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, maxWidth: 880 }}>
          {/* 01 系統簡介 */}
          <section id="s1" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading no="01" title="系統簡介與網站導覽" icon={<InfoCircleOutlined />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>「小怪獸桌球」網站提供三大功能</Paragraph>

            <Table
              size="small"
              pagination={false}
              rowKey="feature"
              style={{ marginBottom: 24 }}
              columns={[
                { title: '功能', dataIndex: 'feature', key: 'feature', width: 120 },
                { title: '說明', dataIndex: 'desc', key: 'desc' },
              ]}
              dataSource={[
                { feature: '官方網站', desc: '課程介紹、最新優惠活動、教練陣容、獲獎榮耀、聯絡資訊' },
                { feature: '教練預約', desc: '線上查看教練可授課時段並直接預約；未加入會員也可申請 30 分鐘試教體驗' },
                { feature: '球具商城', desc: '瀏覽球具商品、加入購物車、線上下單（付款與取貨由專人聯繫確認）' },
              ]}
            />

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>網站導覽列</Title>
            <Paragraph style={{ color: '#334155' }}>
              頁面最上方的導覽列（手機版請點右上角 ☰ 選單）：
            </Paragraph>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li><Text strong>首頁</Text>：球館介紹、課程介紹、最新優惠活動、教練陣容、獲獎榮耀</li>
              <li><Text strong>預約教練</Text>：教練列表 → 點入教練頁面選時段預約</li>
              <li><Text strong>球具商城</Text>：商品列表與購物車</li>
              <li><Text strong>聯絡我們</Text>：地址、電話、官方 LINE、Facebook 粉絲專頁</li>
              <li><Text strong>系統說明</Text>：本頁，僅店長帳號登入後可見</li>
              <li><Text strong>右上角</Text>：未登入時顯示「登入／註冊」；登入後顯示姓名，點擊可進入「個人後台」或「登出」</li>
            </ul>
          </section>

          {/* 02 註冊與登入 */}
          <section id="s2" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading no="02" title="註冊與登入" icon={<LoginOutlined />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>本系統不使用密碼，以「姓名＋手機號碼」作為登入憑證</Paragraph>

            <Note tone="warn">
              請提醒會員務必牢記註冊時填寫的<Text strong>姓名與手機號碼</Text>，登入時兩者都必須完全正確。每支手機號碼只能註冊一個帳號。
            </Note>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>顧客註冊（自助）</Title>
            <Flow
              steps={[
                { label: '右上角「註冊」' },
                { label: '填寫姓名＋電話' },
                { label: '註冊成功，自動登入', tone: 'hl' },
              ]}
            />

            <Title level={5} style={{ fontWeight: 700 }}>登入</Title>
            <Paragraph style={{ color: '#334155' }}>
              輸入註冊時的「姓名」與「電話」→ 按「登入」；若顯示「姓名或電話錯誤」，需至帳號管理協助查詢或修正資料。
            </Paragraph>
            <Note>登入有效期為 <Text strong>24 小時</Text>，逾期需重新登入。</Note>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>角色說明</Title>
            <Table
              size="small"
              pagination={false}
              rowKey="role"
              columns={[
                { title: '角色', dataIndex: 'role', key: 'role', width: 120 },
                { title: '帳號來源', dataIndex: 'source', key: 'source' },
              ]}
              dataSource={[
                { role: <RoleChip role="customer">顧客</RoleChip>, source: '自行於網站註冊' },
                { role: <RoleChip role="coach">教練</RoleChip>, source: '由店長於後台建立，或由店長將既有帳號指派為教練' },
                { role: <RoleChip role="owner">店長</RoleChip>, source: '系統初始帳號，或由其他店長指派' },
              ]}
            />
          </section>

          {/* 03 未登入訪客 */}
          <section id="s3" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading
              no="03"
              title={<>未登入訪客可以做什麼 <RoleChip role="guest">訪客</RoleChip></>}
              icon={<UserOutlined />}
            />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>不需帳號也能瀏覽全站內容，並可申請試教體驗</Paragraph>

            <SectionCard accent="#475569">
              <Title level={5} style={{ fontWeight: 700, marginTop: 0 }}>不需登入即可</Title>
              <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20, marginBottom: 20 }}>
                <li>瀏覽首頁全部內容（課程介紹、優惠活動、教練陣容、獲獎榮耀）</li>
                <li>瀏覽「聯絡我們」聯絡資訊</li>
                <li>瀏覽教練列表與每位教練的可預約時段</li>
                <li>瀏覽商城全部上架商品與商品詳情，並可先將商品加入購物車</li>
                <li><Text strong>申請 30 分鐘試教體驗</Text>（見下方說明）</li>
              </ul>
              <Title level={5} style={{ fontWeight: 700 }}>需要登入才能</Title>
              <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20, marginBottom: 0 }}>
                <li>預約教練正式課程（點時段時會引導先登入）</li>
                <li>購物車結帳下單（點「確認結帳」會引導先登入）</li>
                <li>查看個人後台（我的資料／我的預約／我的訂單）</li>
              </ul>
            </SectionCard>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>
              訪客申請試教（30 分鐘體驗課）<RoleChip role="trial">試教</RoleChip>
            </Title>
            <Paragraph style={{ color: '#334155' }}>
              適合還沒加入會員、想先體驗課程的朋友。<Text strong>試教需要「試教密碼」，由店長口頭提供給客人。</Text>
            </Paragraph>
            <Flow
              steps={[
                { label: '預約教練 → 選教練' },
                { label: '橘色「申請試教」區塊選 30 分鐘時段', tone: 'tr' },
                { label: '填姓名／手機／試教密碼' },
                { label: '待審核', tone: 'tr' },
                { label: '店長核准後成立', tone: 'hl' },
              ]}
            />
            <Note tone="warn">
              試教申請送出後為「待審核」狀態，需經店長在「試教管理」核准後才正式成立。
            </Note>
          </section>

          {/* 04 顧客 */}
          <section id="s4" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading
              no="04"
              title={<>顧客操作指南 <RoleChip role="customer">顧客</RoleChip></>}
              icon={<UserOutlined />}
            />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>預約課程、管理預約、商城購物與個人資料</Paragraph>

            <Title level={5} style={{ fontWeight: 700 }}>4.1 預約教練課程</Title>
            <ol style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>導覽列點「預約教練」，瀏覽教練列表（可看到專長、年資、得獎頭銜）</li>
              <li>點選教練進入個人頁面，下方為「選擇上課時段」</li>
              <li>點擊綠色或藍色格子 → 確認時段 → <Text strong>預約即刻成立</Text>（狀態「已確認」），不需等教練回覆</li>
              <li>可至「個人後台 → 我的預約」查看所有預約</li>
            </ol>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '12px 0 16px' }}>
              <LegendSwatch color="#ECFDF5" border="#059669" label="綠色：可預約（1 小時）" />
              <LegendSwatch color="#EFF6FF" border="#0EA5E9" label="藍色：剩餘 30 分鐘短時段" />
              <LegendSwatch color="#F8FAFC" border="#CBD5E1" label="灰色：已被預約" />
            </div>
            <Note>只會顯示未來的時段，過期時段自動隱藏。</Note>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>4.2 取消預約</Title>
            <Paragraph style={{ color: '#334155' }}>取消預約採<Text strong>申請制</Text>，需經店長審核，並非立即取消：</Paragraph>
            <Flow
              steps={[
                { label: '我的預約 →「申請取消」' },
                { label: '狀態：申請取消中', tone: 'tr' },
                { label: '店長同意 → 已取消', tone: 'hl' },
              ]}
            />

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>4.3 球具商城購物</Title>
            <ol style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>導覽列點「球具商城」瀏覽商品，點入商品可看圖片、價格、庫存與描述</li>
              <li>選擇數量 → 「加入購物車」</li>
              <li>點右上角購物車圖示進入購物車，可調整數量或移除商品</li>
              <li>按「確認結帳」→ 訂單成立（狀態「待處理」）</li>
              <li><Text strong>本系統不做線上付款</Text>：下單後將有專人依顧客留的手機號碼主動聯繫，確認訂單細節、付款與取貨方式</li>
              <li>可至「個人後台 → 我的訂單」隨時查詢訂單狀態</li>
            </ol>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>4.4 我的資料</Title>
            <Paragraph style={{ color: '#334155', marginBottom: 8 }}>
              「個人後台 → 我的資料」可查看姓名、手機、Email、Line ID、生日、性別。
            </Paragraph>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>尚未填寫的欄位（Email／Line ID／生日／性別）可自行填寫一次並儲存</li>
              <li><Text strong>已填寫的資料無法自行修改</Text>（含姓名與手機）；如需更改，需由店長在「帳號管理」代為處理</li>
            </ul>
          </section>

          {/* 05 教練 */}
          <section id="s5" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading
              no="05"
              title={<>教練操作指南 <RoleChip role="coach">教練</RoleChip></>}
              icon={<TeamOutlined />}
            />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>形象檔案、開放時段、查看預約與薪資試算</Paragraph>

            <Title level={5} style={{ fontWeight: 700 }}>5.1 編輯個人資料（官網形象頁）</Title>
            <Paragraph style={{ color: '#334155' }}>
              後台左上角「編輯個人資料」按鈕，這裡的內容會顯示在官網首頁「教練陣容」與預約頁面：
            </Paragraph>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li><Text strong>上傳大頭照</Text></li>
              <li>填寫<Text strong>專長</Text>、<Text strong>年資</Text>、<Text strong>個人簡介</Text></li>
              <li><Text strong>獎項／頭銜</Text>：可新增、編輯、刪除、以 ▲▼ 調整顯示順序</li>
            </ul>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>5.2 我的時段（開放可授課時間）</Title>
            <ol style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>選擇「日期」、「開始時間」、「結束時間」（以 30 分鐘為間隔）→ 按「新增時段」</li>
              <li>開放後，顧客即可以 1 小時為單位預約</li>
              <li>尚未被預約的時段可直接刪除；<Text strong>已被預約的時段無法刪除</Text>（如需異動需由店長處理）</li>
            </ol>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>5.3 預約申請</Title>
            <SectionCard accent="#1D4ED8">
              <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20, marginBottom: 0 }}>
                <li><Text strong>一般預約</Text>：顯示顧客姓名、手機、時段、備註、狀態，成立後即為「已確認」</li>
                <li><Text strong>試教申請</Text>：顯示申請人姓名、手機、30 分鐘時段與審核狀態（試教由店長負責審核）</li>
                <li><Text strong>教練申請取消課程</Text>：對「已確認」的預約可點「申請取消」，需等店長審核才正式取消</li>
              </ul>
            </SectionCard>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>5.4 我的薪資（試算）</Title>
            <Paragraph style={{ color: '#334155' }}>
              選擇「計算區間」與「時薪」→ 系統依區間內的課堂（不含已取消）計算課堂數、總時數、應收薪資，並列出每堂明細。此為試算功能，實際薪資以與店長約定為準。
            </Paragraph>
          </section>

          {/* 06 店長 */}
          <section id="s6" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading
              no="06"
              title={<>店長操作指南 <RoleChip role="owner">店長</RoleChip></>}
              icon={<CrownOutlined />}
            />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>個人後台共 8 個管理分頁，涵蓋商城、預約與全店營運</Paragraph>

            <Title level={5} style={{ fontWeight: 700 }}>6.1 商品管理</Title>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>「新增商品」：填寫名稱、描述、價格、庫存</li>
              <li><Text strong>新增後商品預設為「已下架」</Text>，需點「上架」才會在商城顯示</li>
              <li>「圖片」：上傳商品圖片（重新上傳會取代原圖片）</li>
              <li>「上架／下架」一鍵切換；「刪除」永久刪除（無法復原）</li>
            </ul>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.2 訂單管理</Title>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>查看所有顧客訂單：顧客、金額、狀態、下單時間</li>
              <li>以下拉選單更新狀態：待處理 → 已付款 → 已完成（或已取消）</li>
              <li>顧客下單時系統已自動扣庫存</li>
            </ul>
            <Flow
              steps={[
                { label: '新訂單（待處理）' },
                { label: '電話聯繫確認付款／取貨' },
                { label: '已付款', tone: 'hl' },
                { label: '已完成', tone: 'hl' },
              ]}
            />

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.3 帳號管理</Title>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li>查看所有會員：姓名、電話、Email、Line ID、生日、性別、角色</li>
              <li>「新增帳號」：填姓名、電話並指定角色——<Text strong>教練與店長帳號皆由此建立</Text></li>
              <li><Text strong>變更角色</Text>：直接在列表的角色下拉選單切換</li>
              <li>「編輯」：可修改會員的<Text strong>全部</Text>基本資料，會員自己僅能填寫空白欄位</li>
            </ul>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.4 班表管理</Title>
            <Paragraph style={{ color: '#334155', marginBottom: 8 }}>替教練代管可授課時段：選擇教練 → 選日期與起訖時間 → 新增時段。</Paragraph>
            <Note tone="warn">刪除「已預約」的時段時，原預約記錄仍會保留，請記得於「預約總覽」一併處理並通知學員。</Note>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.5 預約總覽</Title>
            <SectionCard accent="#B45309">
              <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20, marginBottom: 0 }}>
                <li>查看所有預約：學員、教練、時段、狀態、申請時間</li>
                <li><Text strong>「修改」</Text>：替任何預約改期（重新指定日期與起訖時間）</li>
                <li><Text strong>「審核取消」</Text>：對「申請取消中」的預約點「同意取消」或「拒絕申請」</li>
                <li>下方另列出「已核准的試教預約」，方便對照當日課表</li>
              </ul>
            </SectionCard>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>
              6.6 試教管理 <RoleChip role="trial">試教</RoleChip>
            </Title>
            <ul style={{ color: '#334155', lineHeight: 1.9, paddingLeft: 20 }}>
              <li><Text strong>試教密碼設定</Text>：未設定密碼時，試教功能對外關閉；此密碼由店長口頭提供給客人</li>
              <li><Text strong>審核試教申請</Text>：對「待審核」的申請點「核准」或「拒絕」</li>
              <li><Text strong>審核試教取消</Text>：教練申請取消已核准的試教後，由店長同意或拒絕</li>
            </ul>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.7 獲獎榮譽</Title>
            <Paragraph style={{ color: '#334155' }}>輸入「年份」與「獎項名稱」新增，即時顯示於官網首頁「獲獎榮耀」區塊。</Paragraph>

            <Title level={5} style={{ fontWeight: 700, marginTop: 24 }}>6.8 教練薪資</Title>
            <Paragraph style={{ color: '#334155' }}>
              選擇教練、計算區間、時薪 → 顯示課堂數、總時數、應付薪資，以及每堂課明細（不含已取消的課）。
            </Paragraph>
          </section>

          {/* 07 狀態速查 */}
          <section id="s7" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading no="07" title="狀態說明速查" icon={<CheckCircleFilled />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>預約、試教與訂單各狀態的意義</Paragraph>

            <Title level={5} style={{ fontWeight: 700 }}>預約狀態</Title>
            <Table size="small" pagination={false} rowKey="status" style={{ marginBottom: 24 }} columns={statusColumns} dataSource={statusRows.booking} />

            <Title level={5} style={{ fontWeight: 700 }}>試教狀態</Title>
            <Table size="small" pagination={false} rowKey="status" style={{ marginBottom: 24 }} columns={statusColumns} dataSource={statusRows.trial} />

            <Title level={5} style={{ fontWeight: 700 }}>訂單狀態</Title>
            <Table size="small" pagination={false} rowKey="status" columns={statusColumns} dataSource={statusRows.order} />
          </section>

          {/* 08 權限總覽 */}
          <section id="s8" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading no="08" title="權限總覽表" icon={<TeamOutlined />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>各角色在系統中的操作範圍一覽</Paragraph>
            <div style={{ overflowX: 'auto' }}>
              <Table
                size="small"
                pagination={false}
                rowKey="feature"
                scroll={{ x: 720 }}
                columns={[
                  { title: '功能', dataIndex: 'feature', key: 'feature', width: 260 },
                  permCol('訪客', 'guest'),
                  permCol('顧客', 'customer'),
                  permCol('教練', 'coach'),
                  permCol('店長', 'owner'),
                ]}
                dataSource={permissionRows}
              />
            </div>
          </section>

          {/* 09 FAQ */}
          <section id="s9" style={{ marginBottom: 56, scrollMarginTop: 24 }}>
            <SectionHeading no="09" title="常見問題 FAQ" icon={<QuestionCircleOutlined />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>上線初期最常見的疑問</Paragraph>
            {faqs.map((f, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                  <span style={{ color: '#059669' }}>Q</span>
                  <span>{f.q}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, color: '#334155' }}>
                  <span style={{ color: '#94A3B8', fontWeight: 700 }}>A</span>
                  <span>{f.a}</span>
                </div>
              </div>
            ))}
          </section>

          {/* 10 聯絡資訊 */}
          <section id="s10" style={{ marginBottom: 24, scrollMarginTop: 24 }}>
            <SectionHeading no="10" title="聯絡資訊" icon={<PhoneOutlined />} />
            <Paragraph style={{ color: '#64748B', marginBottom: 22 }}>任何操作問題，歡迎直接與我們聯繫</Paragraph>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <ContactCard label="地址" value="桃園市桃園區正光路178號2樓" />
              <ContactCard label="電話" value="0919-012-851" />
              <ContactCard label="官方 LINE" value="@228qkyxd" />
              <ContactCard label="Facebook" value="小怪獸桌球 官方粉絲專頁" />
            </div>
          </section>
        </div>

        {/* Anchor nav (desktop only) */}
        {isDesktop && (
          <div style={{ width: 200, flexShrink: 0, position: 'sticky', top: 88 }}>
            <Anchor
              affix={false}
              items={anchorItems}
              style={{ background: 'transparent' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function SectionHeading({ no, title, icon }: { no: string; title: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div
        style={{
          width: 40,
          height: 40,
          background: '#ECFDF5',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#059669',
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', letterSpacing: '0.14em' }}>{no}</span>
        {title}
      </Title>
    </div>
  )
}

function LegendSwatch({ color, border, label }: { color: string; border: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#64748B' }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: color, border: `1.5px solid ${border}`, flexShrink: 0 }} />
      {label}
    </div>
  )
}

function ContactCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '16px 20px' }}>
      <div style={{ fontSize: 12, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>{value}</div>
    </div>
  )
}
