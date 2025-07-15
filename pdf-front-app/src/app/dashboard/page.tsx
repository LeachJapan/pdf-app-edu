"use client";

import { UserButton } from "@clerk/nextjs";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useStoreUserEffect } from "../useStoreUserEffect";
import { Id } from "../../../convex/_generated/dataModel";
import { addToast } from "@heroui/react";

function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-full flex flex-col p-6 gap-6">
      <div className="flex items-center gap-2 mb-8">
        <DocumentTextIcon className="h-7 w-7 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">PDFMaster</span>
      </div>
      <nav className="flex flex-col gap-4">
        <Button color="primary" variant="flat" className="justify-start">
          PDFアップロード
        </Button>
        <Button variant="light" className="justify-start">
          履歴
        </Button>
        <Button variant="light" className="justify-start">
          設定
        </Button>
      </nav>
    </aside>
  );
}

function Header() {
  const { signOut } = useClerk();
  return (
    <header className="w-full h-16 bg-white border-b flex items-center justify-between px-8">
      <div className="font-bold text-lg">ダッシュボード</div>
      <div className="flex items-center gap-4">
        <UserButton />
        <Button
          color="danger"
          variant="flat"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          ログアウト
        </Button>
      </div>
    </header>
  );
}

function PdfUploadForm({ onUploaded }: { onUploaded: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);
  const savePdf = useMutation(api.tasks.savePdf);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fileInputRef.current || !fileInputRef.current.files?.[0]) {
      setError("ファイルを選択してください");
      return;
    }
    const file = fileInputRef.current.files[0];
    setUploading(true);
    try {
      // 1. 一時アップロードURL取得
      const url = await generateUploadUrl({});
      // 2. PDFをアップロード
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      // 3. DBに保存
      await savePdf({ storageId, fileName: file.name });
      fileInputRef.current.value = "";
      onUploaded();
    } catch (err: any) {
      setError(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mb-8">
      <CardBody>
        <form className="flex flex-col gap-4" onSubmit={handleUpload}>
          <label className="font-semibold">PDFファイルをアップロード</label>
          <Input type="file" accept="application/pdf" ref={fileInputRef} />
          <Button
            color="primary"
            startContent={<CloudArrowUpIcon className="h-5 w-5" />}
            type="submit"
            isLoading={uploading}
          >
            アップロード
          </Button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </CardBody>
    </Card>
  );
}

function PdfList({
  refreshKey,
  selectedPdfId,
  setSelectedPdfId,
}: {
  refreshKey: number;
  selectedPdfId: Id<"pdfs"> | null;
  setSelectedPdfId: (id: Id<"pdfs">) => void;
}) {
  const pdfs = useQuery(api.tasks.listPdfs, {});
  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };
  return (
    <Card className="max-w-xl mx-auto">
      <CardBody>
        <div className="font-semibold mb-2">アップロード済みPDF</div>
        {pdfs === undefined ? (
          <div>読み込み中...</div>
        ) : pdfs.length === 0 ? (
          <div className="text-gray-400 text-sm">
            （アップロード済みPDFはありません）
          </div>
        ) : (
          <ul className="space-y-2">
            {pdfs.map((pdf: any) => (
              <li
                key={pdf._id}
                className="flex flex-col gap-1 border-b pb-2 mb-2"
              >
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={selectedPdfId === pdf._id ? "solid" : "light"}
                    onClick={() => setSelectedPdfId(pdf._id as Id<"pdfs">)}
                    className="flex-1 justify-start"
                  >
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                    {pdf.fileName}
                  </Button>
                  <Button
                    size="sm"
                    variant="bordered"
                    onClick={() => handleDownload(pdf.url)}
                  >
                    ダウンロード
                  </Button>
                  <span className="text-gray-400 text-xs">
                    {new Date(pdf.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="ml-8 mt-1 text-xs text-gray-600">
                  <span className="font-semibold">要約:</span>{" "}
                  {pdf.ragSummary ? (
                    pdf.ragSummary
                  ) : (
                    <span className="text-gray-400">（解析中...）</span>
                  )}
                </div>
                <div className="ml-8 text-xs text-gray-600">
                  <span className="font-semibold">キーワード:</span>{" "}
                  {pdf.ragKeywords && pdf.ragKeywords.length > 0 ? (
                    pdf.ragKeywords.join(", ")
                  ) : (
                    <span className="text-gray-400">（解析中...）</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function ChatSection({
  pdfId,
  userId,
}: {
  pdfId: Id<"pdfs"> | null;
  userId: Id<"users"> | null;
}) {
  // pdfIdがnullでもuseQuery等のフックは必ず呼び出す
  const threads = useQuery(api.tasks.listThreads, pdfId ? { pdfId } : "skip");
  const createThread = useMutation(api.tasks.createThread);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const messages = useQuery(
    api.tasks.listMessages,
    selectedThread ? { threadId: selectedThread as Id<"threads"> } : "skip"
  );
  const sendMessage = useMutation(api.tasks.sendMessage);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiMessageBuffer, setAiMessageBuffer] = useState("");
  const chatListRef = useRef<HTMLDivElement>(null);

  // メッセージやAI応答が更新されたら自動スクロール
  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages, aiMessageBuffer, aiStreaming]);

  if (!pdfId) {
    return (
      <Card className="max-w-2xl mx-auto mt-12">
        <CardBody>
          <div className="text-gray-400 text-center py-12">
            PDFを選択してください
          </div>
        </CardBody>
      </Card>
    );
  }

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !userId) return;
    setCreating(true);
    try {
      const id = await createThread({ title: newThreadTitle, pdfId });
      setNewThreadTitle("");
      setSelectedThread(id);
    } finally {
      setCreating(false);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedThread) return;
    setSending(true);
    setAiStreaming(true);
    setAiMessageBuffer("");
    try {
      // 1. ユーザーメッセージをConvexに保存
      await sendMessage({
        threadId: selectedThread as Id<"threads">,
        text: message,
      });

      // 2. MastraチャットAPIをSSEで呼び出し
      const res = await fetch("/api/mastra-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          pdfId, // ChatSectionのprops
          threadId: selectedThread,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        let errorJson: any = {};
        try {
          errorJson = await res.json();
        } catch {}
        if (errorJson.checkoutUrl) {
          addToast({
            title: "有料プラン登録が必要です",
            description:
              errorJson.error ||
              "無料枠を超えました。引き続き使うにはクレジットカード登録が必要です。",
            color: "warning",
            endContent: (
              <Button
                size="sm"
                color="primary"
                onClick={() => {
                  window.location.href = errorJson.checkoutUrl;
                }}
              >
                クレカ登録
              </Button>
            ),
            timeout: 10000,
          });
          setSending(false);
          setAiStreaming(false);
          return;
        }
        addToast({
          title: "エラー",
          description: errorJson.error || "エラーが発生しました",
          color: "danger",
        });
        setSending(false);
        setAiStreaming(false);
        return;
      }
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE: data: ...\n\n で分割
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const chunk = part.replace(/^data: /, "");
            aiText += chunk;
            setAiMessageBuffer(aiText); // UIに即時反映
          }
        }
      }
      // 3. AI応答もConvexに保存（空でなければ）
      if (aiText && aiText.trim()) {
        await sendMessage({
          threadId: selectedThread as Id<"threads">,
          text: aiText,
          userId: "AI", // AI応答はuserId: "AI" で保存
        } as any); // 型エラー回避のためany（sendMessageの型がuserId未対応の場合）
      }
      setMessage("");
      messageInputRef.current?.focus();
    } finally {
      setSending(false);
      setAiStreaming(false);
    }
  };
  return (
    <Card className="max-w-2xl mx-auto mt-12">
      <CardBody>
        <div className="flex gap-8">
          {/* スレッド一覧 */}
          <div className="w-1/3 border-r pr-4">
            <div className="font-bold mb-2">スレッド</div>
            <form onSubmit={handleCreateThread} className="flex gap-2 mb-4">
              <Input
                size="sm"
                placeholder="新しいスレッド名"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
              />
              <Button size="sm" type="submit" isLoading={creating}>
                作成
              </Button>
            </form>
            <ul className="space-y-1">
              {threads === undefined ? (
                <li>読み込み中...</li>
              ) : threads.length === 0 ? (
                <li className="text-gray-400 text-sm">スレッドなし</li>
              ) : (
                threads.map((thread: any) => (
                  <li key={thread._id}>
                    <Button
                      size="sm"
                      variant={
                        selectedThread === thread._id ? "solid" : "light"
                      }
                      className="w-full justify-start"
                      onClick={() => setSelectedThread(thread._id)}
                    >
                      {thread.title}
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>
          {/* メッセージエリア */}
          <div className="flex-1 flex flex-col">
            <div className="font-bold mb-2">チャット</div>
            <div
              className="flex-1 overflow-y-auto mb-2 max-h-64 border rounded p-2 bg-gray-50"
              ref={chatListRef}
            >
              {selectedThread === null ? (
                <div className="text-gray-400 text-sm">
                  スレッドを選択してください
                </div>
              ) : messages === undefined ? (
                <div>読み込み中...</div>
              ) : messages.length === 0 ? (
                <div className="text-gray-400 text-sm">メッセージなし</div>
              ) : (
                <ul className="space-y-2">
                  {messages.map((msg: any) => (
                    <li key={msg._id} className="flex items-start gap-2">
                      {msg.userId === "AI" ? (
                        <>
                          <span className="font-bold text-purple-600">AI</span>
                          <span className="flex-1 whitespace-pre-line bg-purple-50 rounded px-2 py-1">
                            {msg.text}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-blue-600">
                            {msg.userId.slice(-4)}
                          </span>
                          <span className="flex-1">{msg.text}</span>
                          <span className="text-gray-400 text-xs">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </li>
                  ))}
                  {/* AI応答ストリーミング中は仮メッセージを表示 */}
                  {aiStreaming && aiMessageBuffer && (
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-purple-600">AI</span>
                      <span className="flex-1 whitespace-pre-line bg-purple-50 rounded px-2 py-1">
                        {aiMessageBuffer}
                      </span>
                      <span className="text-gray-400 text-xs">...</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
            {/* メッセージ送信フォーム */}
            <form onSubmit={handleSendMessage} className="flex gap-2 mt-2">
              <Input
                ref={messageInputRef}
                size="sm"
                placeholder="メッセージを入力"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={!selectedThread}
              />
              <Button
                size="sm"
                type="submit"
                isLoading={sending}
                disabled={!selectedThread}
              >
                送信
              </Button>
            </form>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const [selectedPdfId, setSelectedPdfId] = useState<Id<"pdfs"> | null>(null);
  const { isLoading, isAuthenticated, userId } = useStoreUserEffect();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <div>認証が必要です。サインインしてください。</div>;
  }
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <PdfUploadForm onUploaded={() => {}} />
          <PdfList
            refreshKey={0}
            selectedPdfId={selectedPdfId}
            setSelectedPdfId={setSelectedPdfId}
          />
          <ChatSection pdfId={selectedPdfId} userId={userId} />
        </main>
      </div>
    </div>
  );
}
