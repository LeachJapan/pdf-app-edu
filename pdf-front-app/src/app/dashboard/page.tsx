"use client";

import { UserButton, SignOutButton } from "@clerk/nextjs";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useStoreUserEffect } from "../useStoreUserEffect";

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
  const router = useRouter();
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

function PdfList({ refreshKey }: { refreshKey: number }) {
  const pdfs = useQuery(api.tasks.listPdfs, {});

  // 署名付きURLをwindow.openで開くだけ
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
              <li key={pdf._id} className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <span className="flex-1">{pdf.fileName}</span>
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
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { isLoading, isAuthenticated } = useStoreUserEffect();

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
          <PdfUploadForm onUploaded={() => setRefreshKey((k) => k + 1)} />
          <PdfList refreshKey={refreshKey} />
        </main>
      </div>
    </div>
  );
}
