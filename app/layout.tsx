export const metadata = {
  title: 'Webhook Hoster',
  description: 'Public webhook management platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
