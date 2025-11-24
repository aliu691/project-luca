export default function messageHandler(client, message) {
  console.log("📩 New message:", {
    from: message.from,
    text: message.body,
  });

  // REMOVE AUTO REPLY
  // If you want replies later, you control them manually
}
