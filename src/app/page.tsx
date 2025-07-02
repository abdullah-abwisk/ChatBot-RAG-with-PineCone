import Chat from "../components/chat";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">RAG Chatbot</h1>
        <Chat />
      </div>
    </main>
  );
}
