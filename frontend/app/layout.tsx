import type { Metadata } from 'next';
import './globals.css';
import '../styles/themes/light.css';
import '../styles/themes/dark.css';
import './styles/theme.css';

import { ThemeProvider } from 'next-themes';
import ThemeSwitcher from './components/ThemeSwitcher/ThemeSwitcher';
import InstallAppBanner from './components/PWA/InstallAppBanner/InstallAppBanner';
import UpdateNotification from './components/PWA/UpdateNotification/UpdateNotification';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

export const metadata: Metadata = {
  title: 'MegiLance - Next-Gen Freelance Platform',
  description: 'The Next-Generation Freelance Platform powered by AI and Blockchain.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-[var(--background)] text-[var(--text-primary)]">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="light" 
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
          <InstallAppBanner />
          <UpdateNotification />
        </ThemeProvider>
      </body>
    </html>
  );
}

