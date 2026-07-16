// การตั้งค่า Login ผ่าน Google
//
// วิธีสร้าง GOOGLE_CLIENT_ID:
// 1) ไปที่ https://console.cloud.google.com/apis/credentials
// 2) Create Credentials → OAuth client ID → Application type: "Web application"
// 3) Authorized JavaScript origins: ใส่ origin ที่ใช้งาน เช่น
//      http://localhost:5173  (dev)
//      http://localhost:4173  (preview)
//      https://your-domain.com  (production)
// 4) คัดลอก Client ID (…apps.googleusercontent.com) มาใส่ที่นี่ หรือใส่ในไฟล์ .env: VITE_GOOGLE_CLIENT_ID=...
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '283694564248-l7dnvfnelos7vl1utre3cfmfsjspi7ao.apps.googleusercontent.com'

// รายชื่ออีเมลที่เป็น Premium (ชั่วคราว — ภายหลังย้ายไปเช็คจาก backend)
// ใครอยู่ในนี้จะแชร์บิ้วขึ้นรายการได้
export const PREMIUM_EMAILS = []

// อีเมลแอดมิน (ถือเป็น premium + เห็นปุ่ม admin)
export const ADMIN_EMAILS = ['metrorefire@gmail.com']

// [ทดสอบเฉพาะตอน dev เท่านั้น] บังคับระดับผู้ใช้เพื่อลองมุมมอง
//   'free'    = เป็น user ธรรมดา (ทดสอบระบบสมัคร Premium)
//   'premium' = พรีเมียม
//   null      = ใช้ตามอีเมลจริง (ค่าปกติ)
// ⚠️ มีผลเฉพาะ npm run dev — ตอน build/deploy จะถูกเมิน ไม่กระทบผู้ใช้จริง
export const DEV_TIER_OVERRIDE = 'free'
