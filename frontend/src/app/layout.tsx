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
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-[#3B97D3] selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <BrandLogo variant="dark" />
              <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />
              <span className="text-xs text-slate-500 hidden sm:inline-block">
                Ecosystem App • Pakistan Wellness & Psychoeducation
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-500 text-center sm:text-right">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#7CC157]" />
                Direct JazzCash / EasyPaisa / Bank Processing
              </span>
              <span>© {new Date().getFullYear()} BetterSelf LMS. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
