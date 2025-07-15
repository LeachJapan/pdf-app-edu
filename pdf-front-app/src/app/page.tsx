"use client";

import { Button, Card, CardBody, Chip, Divider, Input } from "@heroui/react";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useStoreUserEffect } from "./useStoreUserEffect";
import { SignedIn, SignedOut, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const { isLoading } = useStoreUserEffect();
  const router = useRouter();

  if (isLoading) return <div>Loading...</div>;

  const features = [
    {
      icon: DocumentTextIcon,
      title: "PDF解析",
      description:
        "高度なAI技術でPDFドキュメントを瞬時に解析し、重要な情報を抽出します。",
    },
    {
      icon: MagnifyingGlassIcon,
      title: "スマート検索",
      description: "自然言語での検索が可能。複雑な質問にも正確に回答します。",
    },
    {
      icon: CloudArrowUpIcon,
      title: "クラウド同期",
      description:
        "すべてのデータがクラウドで安全に同期され、どこからでもアクセス可能。",
    },
    {
      icon: SparklesIcon,
      title: "AI支援",
      description:
        "最新のAI技術により、ドキュメントの理解と分析を自動化します。",
    },
  ];

  const testimonials = [
    {
      name: "田中 美咲",
      role: "法務部長",
      company: "株式会社テックソリューションズ",
      content:
        "契約書の確認作業が劇的に効率化されました。AIの精度の高さに驚いています。",
    },
    {
      name: "佐藤 健太",
      role: "研究開発マネージャー",
      company: "未来研究所",
      content:
        "研究論文の分析が格段に速くなりました。複雑な技術文書も正確に理解してくれます。",
    },
    {
      name: "山田 花子",
      role: "人事部長",
      company: "グローバル企業",
      content:
        "採用書類の処理時間が半分になりました。AIの提案により、より良い人材を見つけられています。",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">PDFMaster</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#features"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              機能
            </a>
            <a
              href="#pricing"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              料金
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              お客様の声
            </a>
            <SignedOut>
              <SignUpButton mode="modal">
                <Button color="primary" variant="flat">
                  無料で始める
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
              <Button
                color="primary"
                variant="flat"
                onClick={() => router.push("/dashboard")}
              >
                ダッシュボードへ
              </Button>
            </SignedIn>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Chip
            color="primary"
            variant="flat"
            startContent={<SparklesIcon className="h-4 w-4" />}
            className="mb-6"
          >
            AI搭載 PDF解析プラットフォーム
          </Chip>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            PDFを
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              賢く
            </span>
            解析
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            最新のAI技術により、PDFドキュメントを瞬時に解析し、重要な情報を抽出。
            複雑な文書も簡単に理解し、効率的なワークフローを実現します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignedOut>
              <SignUpButton mode="modal">
                <Button size="lg" color="primary" className="w-full sm:w-auto">
                  無料で試す
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button
                size="lg"
                color="primary"
                className="w-full sm:w-auto"
                onClick={() => router.push("/dashboard")}
              >
                ダッシュボードへ
              </Button>
            </SignedIn>
            <Button size="lg" variant="bordered" className="w-full sm:w-auto">
              デモを見る
            </Button>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            革新的な機能
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            PDFMasterの強力な機能で、ドキュメント処理を次のレベルへ
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center hover:shadow-lg transition-shadow"
            >
              <CardBody className="p-6">
                <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* 統計セクション */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">アクティブユーザー</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1,000,000+</div>
              <div className="text-blue-100">解析済みドキュメント</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">精度</div>
            </div>
          </div>
        </div>
      </section>

      {/* お客様の声 */}
      <section id="testimonials" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">お客様の声</h2>
          <p className="text-xl text-gray-600">
            実際にご利用いただいているお客様からの声をご紹介
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardBody className="p-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">
                  &quot;{testimonial.content}&quot;
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA セクション */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            今すぐ始めませんか？
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            無料でPDFMasterをお試しください。AIの力を実感していただけます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            <Input
              type="email"
              placeholder="メールアドレスを入力"
              className="flex-1"
            />
            <Button
              color="primary"
              variant="solid"
              className="w-full sm:w-auto"
            >
              無料で始める
            </Button>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">PDFMaster</span>
              </div>
              <p className="text-gray-400">
                AI搭載のPDF解析プラットフォームで、ドキュメント処理を革新します。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">製品</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    機能
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    料金
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">サポート</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ヘルプセンター
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    お問い合わせ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    ドキュメント
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">会社</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    会社概要
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    採用情報
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    プライバシー
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <Divider className="my-8" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 PDFMaster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
