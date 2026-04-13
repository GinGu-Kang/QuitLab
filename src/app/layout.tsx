import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import { Providers } from '@/components/providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: '퇴사하면 나는 어떤 가게 사장님? | 창업 적합도 진단',
  description:
    '12개 역량 × 129개 업종 매칭으로 나에게 딱 맞는 창업 아이템을 찾아보세요. 현실 수익, 투자비, 창업 가이드까지.',
  openGraph: {
    title: '퇴사하면 나는 어떤 가게 사장님?',
    description: '나만의 창업 아이템 찾기 - 3분 무료 창업 진단',
    type: 'website',
    locale: 'ko_KR'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0E1A'
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '퇴사하면 나는 어떤 가게 사장님?',
  description: '창업 적합도 진단 서비스',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-quiz-bg text-quiz-text antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-quiz-teal focus:px-4 focus:py-2 focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        ) : null}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
