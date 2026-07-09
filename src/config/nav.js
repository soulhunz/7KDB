// แหล่งข้อมูลเมนูเดียว (single source of truth) — ใช้ร่วมกันทั้ง Sidebar และ Router
// แต่ละ item: { path, name, icon, label, group, ready }
//   ready:true = ทำเป็น view จริงแล้ว, false = ยังเป็นหน้า placeholder

export const NAV_GROUPS = [
  {
    title: 'เมนูหลัก',
    items: [
      { path: '/', name: 'dashboard', icon: '🏠', label: 'ภาพรวม', ready: true },
      { path: '/preparation', name: 'preparation', icon: '🧠', label: 'วางแผน (AI)', ready: false },
      { path: '/hero-build', name: 'hero-build', icon: '🔨', label: 'บิ้วตัวละคร', ready: false },
      { path: '/team-builder-3v3', name: 'team-builder-3v3', icon: '⚔️', label: 'สร้างทีม 3v3', ready: false },
      { path: '/enemy-manager', name: 'enemy-manager', icon: '🎯', label: 'รูปแบบศัตรู', ready: false },
      { path: '/member-roster', name: 'member-roster', icon: '👥', label: 'ข้อมูลลูกกิล', ready: true },
      { path: '/gallery', name: 'gallery', icon: '🖼️', label: 'แกลเลอรี', ready: false },
    ],
  },
  {
    title: 'ฐานข้อมูล',
    items: [
      { path: '/hero-manager', name: 'hero-manager', icon: '🦸', label: 'ฮีโร่', ready: true },
      { path: '/pet-manager', name: 'pet-manager', icon: '🐾', label: 'สัตว์เลี้ยง', ready: true },
      { path: '/ring-manager', name: 'ring-manager', icon: '💍', label: 'แหวน', ready: true },
      { path: '/equip-manager', name: 'equip-manager', icon: '🛡️', label: 'เซ็ตอุปกรณ์', ready: true },
      { path: '/stat-glossary', name: 'stat-glossary', icon: '📖', label: 'อธิบายสเตตัส (AI)', ready: false },
      { path: '/skill-lib', name: 'skill-lib', icon: '📚', label: 'คลังสกิล (AI)', ready: true },
    ],
  },
  {
    title: 'สงคราม & กิลด์',
    items: [
      { path: '/battle-war', name: 'battle-war', icon: '⚔️', label: 'สงคราม', ready: false },
      { path: '/battle-history', name: 'battle-history', icon: '📜', label: 'ประวัติการต่อสู้', ready: false },
      { path: '/guild-manager', name: 'guild-manager', icon: '🏰', label: 'กิลด์ & พันธมิตร', ready: true },
      { path: '/survey-admin', name: 'survey-admin', icon: '📝', label: 'ฟอร์มรับสมัคร', ready: false },
    ],
  },
]

// แผ่ (flatten) ไว้ให้ router ใช้ง่าย
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)
