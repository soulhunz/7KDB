// ช่องทางสนับสนุน (Donate) — ไม่ต้อง login
// 👉 แก้ค่าตรงนี้ให้เป็นของจริงของคุณ
export const DONATE = {
  // ข้อความเชิญชวน
  message: 'ถ้า 7KDB มีประโยชน์ ช่วยสนับสนุนค่าเซิร์ฟเวอร์/ค่ากาแฟได้นะครับ 🙏 ทุกการสนับสนุนช่วยให้เว็บอยู่ต่อได้',

  // พร้อมเพย์ — ใส่เบอร์/เลขพร้อมเพย์ (โชว์เป็นข้อความ + ปุ่มคัดลอก) เว้นว่างถ้าไม่ใช้
  promptpay: '',
  promptpayName: '',

  // รูป QR พร้อมเพย์ (วางไฟล์ใน public/ แล้วใส่ path เช่น '/promptpay-qr.png' หรือใส่ URL) เว้นว่างถ้าไม่มี
  qrImage: '',

  // ลิงก์ภายนอก (Ko-fi / Buy Me a Coffee / PayPal / อื่น ๆ) — เพิ่ม/ลบได้
  links: [
    // { label: 'Ko-fi', icon: 'local_cafe', url: 'https://ko-fi.com/yourname', color: 'red-6' },
    // { label: 'Buy Me a Coffee', icon: 'coffee', url: 'https://buymeacoffee.com/yourname', color: 'amber-8' },
    // { label: 'PayPal', icon: 'payments', url: 'https://paypal.me/yourname', color: 'blue-7' },
  ],
}
