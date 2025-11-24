export function getStatus(req, res) {
  res.json({
    status: "ok",
    message: "WhatsApp service running",
  });
}
