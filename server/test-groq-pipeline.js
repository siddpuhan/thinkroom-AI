// test-groq-pipeline.js — Tests the unified debounced Groq worker pipeline
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';
const TEST_ROOM = '1234';

console.log("=== Groq Burst Socket Pipeline Test ===\n");
console.log(`Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  auth: { token: 'mock-development-token' }
});

let taskCreated = false;
let noteCreated = false;
let summaryUpdated = false;

socket.on('connect', () => {
  console.log(`✅ Connected: ${socket.id}`);
  socket.emit('join-room', TEST_ROOM);
  console.log(`✅ Joined room: ${TEST_ROOM}`);

  socket.on('task_created', (task) => {
    console.log('\n🎉 [SOCKET EVENT] task_created:');
    console.log(`   Title:       ${task.title}`);
    console.log(`   Assigned:    ${task.assignedToName || task.assigned_to_name}`);
    taskCreated = true;
    checkExit();
  });

  socket.on('note_created', (note) => {
    console.log('\n🎉 [SOCKET EVENT] note_created:');
    console.log(`   Type:        ${note.type}`);
    console.log(`   Content:     ${note.content}`);
    noteCreated = true;
    checkExit();
  });

  socket.on('summary_updated', (summary) => {
    console.log('\n🎉 [SOCKET EVENT] summary_updated:');
    console.log(`   Summary:     ${summary.summary}`);
    summaryUpdated = true;
    checkExit();
  });

  // Send a burst of 3 messages to test debouncing (only 1 Groq call should trigger)
  setTimeout(() => {
    console.log('\n📤 Sending conversation burst (3 messages rapidly)...');
    
    socket.emit('send_message', {
      roomId: TEST_ROOM,
      message: {
        id: 'test-1-' + Date.now(),
        text: 'Hi team, let\'s update our infrastructure.',
        sender_name: 'Rahul',
        room_id: TEST_ROOM,
        status: 'sent'
      }
    });

    setTimeout(() => {
      socket.emit('send_message', {
        roomId: TEST_ROOM,
        message: {
          id: 'test-2-' + Date.now(),
          text: 'We decided that Supabase is easier than Auth0 for authentication.',
          sender_name: 'Siddharth',
          room_id: TEST_ROOM,
          status: 'sent'
        }
      });
    }, 200);

    setTimeout(() => {
      socket.emit('send_message', {
        roomId: TEST_ROOM,
        message: {
          id: 'test-3-' + Date.now(),
          text: 'Anshika please deploy the new backend today.',
          sender_name: 'Rahul',
          room_id: TEST_ROOM,
          status: 'sent'
        }
      });
      console.log('   Burst sent. Debounce timer (10s) started. Waiting for Groq analysis (up to 45s)...');
    }, 400);

  }, 1000);

  // Timeout after 45 seconds
  setTimeout(() => {
    console.log('\n⏰ TIMEOUT: Pipeline test finished.');
    console.log(`   Results: task=${taskCreated}, note=${noteCreated}, summary=${summaryUpdated}`);
    socket.disconnect();
    process.exit(0);
  }, 45000);
});

function checkExit() {
  if (taskCreated && noteCreated && summaryUpdated) {
    console.log('\n✅ ALL EVENTS RECEIVED SUCCESSFULLY! Test passed!');
    socket.disconnect();
    process.exit(0);
  }
}

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});
