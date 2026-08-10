import { AdminSidebar } from '@/components/layout/admin-sidebar'

/**
 * 견적서 관리 라우트(/invoice, /invoice/[id])를 감싸는 공통 레이아웃입니다.
 * 인증 기능은 제외하기로 결정되어 별도 접근 제어 없이 공개 라우트로 운영합니다.
 */
export default function QuotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AdminSidebar>{children}</AdminSidebar>
}
