import ChatPage from '../../components/ChatPage';

// Route protection is handled exclusively by the middleware (the single guard).
// By the time this server-rendered page is reached, the session is already
// validated, so the client does not need to re-check authentication.
export default function Chat() {
  return <ChatPage />;
}
