import { io } from "socket.io-client";

console.log("=== Shadow AI Decision Test ===");

const socket = io("http://localhost:5000", { transports: ["websocket"] });

socket.on("connect", () => {
  console.log("✅ Connected");
  socket.emit("join-room", "test-room-999");
  
  // Simulate a conversation
  const messages = [
    { text: "i think we should use react instead of next", sender_name: "OD AUTOMATION" },
    { text: "well tbh i also think that", sender_name: "SIDDHARTH PUHAN" },
    { text: "because it has so many libraries", sender_name: "OD AUTOMATION" },
    { text: "ok then we will go with react", sender_name: "SIDDHARTH PUHAN" },
    { text: "i agree with you", sender_name: "OD AUTOMATION" }
  ];

  console.log("📤 Sending messages...");
  
  let delay = 0;
  for (const msg of messages) {
    setTimeout(() => {
      socket.emit("send_message", {
        roomId: "test-room-999",
        message: { ...msg, id: Date.now().toString() }
      });
      console.log(`Sent: ${msg.sender_name}: ${msg.text}`);
    }, delay);
    delay += 500;
  }
});

socket.on("document_created", (doc) => {
  console.log("\n🎉 DOCUMENT CREATED EVENT RECEIVED!");
  console.log(`   Type:     ${doc.type}`);
  console.log(`   Title:    ${doc.title}`);
  console.log(`   Summary:  ${doc.summary}`);
  console.log(`   Content:  ${doc.content}`);
  process.exit(0);
});

setTimeout(() => {
  console.log("⏳ Timeout waiting for decision pipeline. (It has an 8 second debounce)");
}, 15000);

setTimeout(() => {
  console.log("❌ Failed to receive document within 25 seconds");
  process.exit(1);
}, 25000);
