import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// Your verify token (must match Meta dashboard)
const VERIFY_TOKEN = "luca_webhook_token";

// ============= WEBHOOK VERIFICATION (GET) =============
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ============= WEBHOOK RECEIVER (POST) =============
app.post("/webhook", (req, res) => {
  const body = req.body;

  console.log("Incoming webhook:", JSON.stringify(body, null, 2));

  if (body.object === "whatsapp_business_account") {
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

    if (messages && messages.length > 0) {
      const msg = messages[0];
      const from = msg.from; // user's phone number
      const text = msg.text?.body; // message text

      console.log("New message from:", from, "->", text);

      // TODO: You will handle:
      // - User onboarding
      // - Expense extraction
      // - Saving to DB
      // - Replies
    }
  }

  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Webhook running on port ${PORT}`));
