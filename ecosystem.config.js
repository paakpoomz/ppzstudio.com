// pm2 — ท่าเดียวกับแอป Next.js ตัวอื่นบนเครื่องนี้
// เริ่มครั้งแรก:  pm2 start ecosystem.config.js && pm2 save
// deploy รอบถัดไป: pm2 reload ppzweb --update-env
module.exports = {
  apps: [
    {
      name: "ppzweb",
      cwd: "/home/ppzstudio.com/ppzweb",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3004",
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "600M",
      env: {
        NODE_ENV: "production",
        PORT: 3004,
      },
      error_file: "/home/ppzstudio.com/logs/ppzweb.err.log",
      out_file: "/home/ppzstudio.com/logs/ppzweb.out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
