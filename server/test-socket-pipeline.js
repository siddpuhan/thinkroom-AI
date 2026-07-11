// test-socket-pipeline.js — Tests the full socket pipeline end-to-end
// Simulates what the frontend does when a user sends a message
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const TEST_ROOM = '1234'; // Same room as in screenshot

console.log("=== Socket Pipeline Test ===\n");
console.log(`Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token: 'mock-development-token' } });

socket.on('connect', () => {
  console.log(`✅ Connected: ${socket.id}`);
  
  // Join the test room
  socket.emit('join-room', TEST_ROOM);
  console.log(`✅ Joined room: ${TEST_ROOM}`);

  // Listen for task_created events
  socket.on('task_created', (task) => {
    console.log('\n🎉 TASK_CREATED EVENT RECEIVED!');
    console.log(`   ID:          ${task.id}`);
    console.log(`   Title:       ${task.title}`);
    console.log(`   Assigned To: ${task.assignedToName || task.assigned_to_name}`);
    console.log(`   Priority:    ${task.priority}`);
    console.log(`   AI Generated: ${task.ai_generated}`);
    socket.disconnect();
    process.exit(0);
  });

  // Send a test message after 1 second
  setTimeout(() => {
    const testMessage = {
      id: 'test-' + Date.now(),
      text: 'Siddharth prepare the excel sheet',
      sender_name: 'TestScript',
      room_id: TEST_ROOM,
      status: 'sent',
    };
    
    console.log(`\n📤 Sending test message: "${testMessage.text}"`);
    socket.emit('send_message', {
      roomId: TEST_ROOM,
      message: testMessage
    });
    console.log('   Waiting for task extraction (up to 30s)...');
  }, 1000);

  // Timeout after 30 seconds
  setTimeout(() => {
    console.log('\n⏰ TIMEOUT: No task_created event received in 30 seconds');
    console.log('   Check server logs for pipeline debug output');
    socket.disconnect();
    process.exit(1);
  }, 30000);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});
