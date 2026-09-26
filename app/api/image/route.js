export async function POST(request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "प्रॉम्प्ट खाली है!" }, { status: 400 });
    }

    // Pollinations AI के जरिए FLUX मॉडल से डायरेक्ट इमेज URL बनाना
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=800&height=600&nologo=true`;

    return Response.json({ imageUrl });
  } catch (error) {
    return Response.json({ error: "इमेज बनाने में दिक्कत हुई।" }, { status: 500 });
  }
}
