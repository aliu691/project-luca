import { startWhatsapp } from "./services/whatsapp.service.js";
import { logger } from "./core/config/logger.js";
import { PORT } from "./core/config/env.js";
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
