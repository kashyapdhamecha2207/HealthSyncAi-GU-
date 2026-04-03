import Header from '../components/Header';
import "./globals.css";

export const metadata = {
  title: "HealthSync AI+ | Smart Care & Scheduling",
  description: "A unified healthcare platform reducing no-shows and improving patient adherence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`font-sans min-h-screen bg-slate-50 flex flex-col`}>
        <Header />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
