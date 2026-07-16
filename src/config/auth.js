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
  import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// รายชื่ออีเมลที่เป็น Premium (ชั่วคราว — ภายหลังย้ายไปเช็คจาก backend)
// ใครอยู่ในนี้จะแชร์บิ้วขึ้นรายการได้
export const PREMIUM_EMAILS = []

// อีเมลแอดมิน (ถือเป็น premium + เห็นปุ่ม admin)
export const ADMIN_EMAILS = []
