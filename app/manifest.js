export default function manifest() {
  return {
    name: 'VP AI Assistant',
    short_name: 'VP AI',
    description: 'Smart AI Assistant for notes, voice, and vision',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: 'https://i.postimg.cc/C5pbh5zN/file-00000000583082118b16369073f60da3.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://i.postimg.cc/C5pbh5zN/file-00000000583082118b16369073f60da3.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
