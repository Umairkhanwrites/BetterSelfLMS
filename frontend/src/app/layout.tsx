import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BrandLogo from '@/components/BrandLogo';

export const metadata: Metadata = {
  title: 'BetterSelf LMS — Evidence-Based Psychoeducation & Wellness',
  description: 'Self-paced clinical wellness courses benchmarked against Coursera & Skillshare with local Pakistan payment flow.',
  icons: {
    icon: '/brand-monogram.png',
    shortcut: '/brand-monogram.png',
    apple: '/brand-monogram.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-[#2988C6] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-950 border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <BrandLogo variant="dark" showSubtitle={false} />
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Pakistan's first clinical psychoeducation platform. Evidence-based courses for lasting mental wellness.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#66B151]" />
                  JazzCash · EasyPaisa · Bank Transfer
                </span>
              </div>
            </div>
            <div className="border-t border-slate-800/50 mt-8 pt-6 text-center">
              <p className="text-[11px] text-slate-600">© {new Date().getFullYear()} BetterSelf LMS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
