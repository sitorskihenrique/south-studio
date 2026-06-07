const { startServer } = require("next/dist/server/lib/start-server");

startServer({
  dir: process.cwd(),
  isDev: true,
  hostname: "0.0.0.0",
  port: Number(process.env.PORT || 3000),
  allowRetry: false,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
