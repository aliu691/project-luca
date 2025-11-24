import app from "./app.js";
import { startWhatsapp } from "./services/whatsapp.service.js";
import { PORT } from "./config/env.js";

async function bootstrap() {
  await startWhatsapp();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
