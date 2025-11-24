import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const WHATSAPP_SESSION_DIR =
  process.env.WHATSAPP_SESSION_DIR || "tokens";
