import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify, Dark, Loading, Dialog } from 'quasar'

// ไอคอน + สไตล์ Quasar
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/src/css/index.sass'

// สไตล์ global ของแอป
import './styles/app.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: { Notify, Dark, Loading, Dialog },
  config: {
    dark: true, // เปิด dark mode เป็นค่าเริ่มต้น
  },
})

app.mount('#app')
