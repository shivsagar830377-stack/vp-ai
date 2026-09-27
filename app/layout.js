export const metadata = {
  title: "VP AI Assistant",
  description: "Smart AI Assistant for notes, chat, and vision",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
