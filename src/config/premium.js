// ข้อมูลแพ็กเกจ Premium — 👉 แก้ให้เป็นของจริง
export const PREMIUM = {
  priceLabel: '฿99 / เดือน',

  benefits: [
    { icon: 'public', text: 'แชร์บิ้วขึ้นรายการสาธารณะให้คนอื่นเห็น' },
    { icon: 'workspace_premium', text: 'ป้ายสมาชิก Premium' },
    { icon: 'favorite', text: 'สนับสนุนให้เว็บอยู่ต่อได้ 🙏' },
  ],

  // ช่องทางชำระเงิน (ยังไม่มีระบบจ่ายอัตโนมัติ → ชำระแล้วแจ้งแอดมินเปิดสิทธิ์ให้)
  promptpay: '', // เบอร์/เลขพร้อมเพย์
  promptpayName: '',
  qrImage: '', // วางไฟล์ QR ใน public/ แล้วใส่ path เช่น '/premium-qr.png'

  // ช่องทางติดต่อแจ้งสลิป (LINE / Facebook / อีเมล)
  contact: '',

  note: 'หลังชำระเงิน ส่งสลิป + อีเมล Google ที่ใช้ล็อกอิน มาให้แอดมิน จะเปิด Premium ให้ภายใน 24 ชม.',
}
