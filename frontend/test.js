const WebSocket = require("ws");
const ws = new WebSocket(`wss://localhost:8001/ws/chat/1/`, {
  rejectUnauthorized: false, // For self-signed certs
});

ws.on("open", () => {
  console.log("Connection established");
});

ws.on("message", (data) => {
  const parsed = JSON.parse(data);
  console.log("Status update:", parsed.user_id, parsed.is_online);
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("Connection closed");
});

// const WebSocket = require("ws");

// const ws = new WebSocket(`wss://localhost:8001/ws/chat/?user_id=${1}`, {
//   rejectUnauthorized: false, // For self-signed certs
// });

// // Wait for connection to open before sending
// ws.on("open", () => {
//   console.log("Connection established");

//   // Now it's safe to send messages
//   // ws.send(
//   //   JSON.stringify({
//   //     type: "message",
//   //     message: "Hello!",
//   //     recipient_id: "123",
//   //   })
//   // );
// });

// // Handle responses
// ws.on("message", (data) => {
//   try {
//     const parsed = JSON.parse(data);
//     switch (parsed.type) {
//       case "message":
//         console.log("New message:", parsed.message);
//         break;
//       case "status":
//         console.log("Status update:", parsed.user_id, parsed.is_online);
//         break;
//       case "message_sent":
//         console.log("Message confirmed:", parsed.message_id, parsed.status);
//         break;
//       default:
//         console.log("Unknown message type:", parsed.type);
//     }
//   } catch (e) {
//     console.error("Error parsing message:", e);
//   }
// });

// // Handle errors
// ws.on("error", (error) => {
//   console.error("WebSocket error:", error);
// });

// // Handle connection close
// ws.on("close", () => {
//   console.log("Connection closed");
// });
