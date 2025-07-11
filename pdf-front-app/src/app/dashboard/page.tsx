"use client";

import { UserButton, SignOutButton } from "@clerk/nextjs";
import { Button, Card, CardBody, Input } from "@heroui/react";
import { useRef } from "react";
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

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
  return (
    <header className="w-full h-16 bg-white border-b flex items-center justify-between px-8">
      <div className="font-bold text-lg">ダッシュボード</div>
      <div className="flex items-center gap-4">
        <UserButton />
        <SignOutButton signOutCallback={() => router.push("/")}>
          <Button color="danger" variant="flat">
            ログアウト
          </Button>
        </SignOutButton>
      </div>
    </header>
  );
}

function PdfUploadForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // アップロード処理は今後実装
  return (
    <Card className="max-w-xl mx-auto mb-8">
      <CardBody>
        <form className="flex flex-col gap-4">
          <label className="font-semibold">PDFファイルをアップロード</label>
          <Input type="file" accept="application/pdf" ref={fileInputRef} />
          <Button
            color="primary"
            startContent={<CloudArrowUpIcon className="h-5 w-5" />}
          >
            アップロード
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

function PdfList() {
  // PDFリスト取得・表示は今後実装
  return (
    <Card className="max-w-xl mx-auto">
      <CardBody>
        <div className="font-semibold mb-2">アップロード済みPDF</div>
        <div className="text-gray-400 text-sm">
          （ここにアップロード済みPDFのリストが表示されます）
        </div>
      </CardBody>
    </Card>
  );
}

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <PdfUploadForm />
          <PdfList />
        </main>
      </div>
    </div>
  );
}
