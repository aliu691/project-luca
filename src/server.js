// import app from "./app.js";
// import { startWhatsapp } from "./services/whatsapp.service.js";
// import { PORT } from "./config/env.js";

// async function bootstrap() {
//   await startWhatsapp();

//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//   });
// }

// bootstrap();

import { startWhatsapp } from "./services/whatsapp.service.js";
import { logger } from "./config/logger.js";
import { PORT } from "./config/env.js";
import app from "./app.js";

// Global safety nets
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION: " + err.stack);
});

process.on("unhandledRejection", (reason) => {
  logger.error("UNHANDLED PROMISE REJECTION: " + reason);
});

async function bootstrap() {
  logger.info("🔥 Starting LUCA WhatsApp bot...");

  await startWhatsapp();

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
