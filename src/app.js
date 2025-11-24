import express from "express";
import whatsappRoutes from "./routes/whatsapp.routes.js";

const app = express();

app.use(express.json());

// Routes
app.use("/api/whatsapp", whatsappRoutes);

export default app;
