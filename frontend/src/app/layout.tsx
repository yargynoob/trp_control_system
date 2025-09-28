import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Система управления дефектами',
  description: 'Система контроля дефектов на промышленных предприятиях'
};

export default function RootLayout({
  children


}: {children: React.ReactNode;}) {
  return (
    <html lang="ru">
      <body className={inter.className + ' bg-white text-gray-900'}>
        {children}
      </body>
    </html>);

}