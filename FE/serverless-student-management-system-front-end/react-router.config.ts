import type { Config } from '@react-router/dev/config'

export default {
    // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: false,
  // nếu là true thì sẽ render phía server, false thì là SPA
  //server thì sẽ cần môi trường nodejs để chạy server render, ko cần môi trường nodejs nếu SPA
  //server ko thể deploy lên github page đc vì github page chỉ hỗ trợ SPA
  appDirectory: 'app'
} satisfies Config
