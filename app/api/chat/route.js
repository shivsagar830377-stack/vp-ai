import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY Vercel में नहीं मिली!" },
        { status: 500 }
      );
    }

    const { message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "Message खाली है" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "तुम VP AI हो। यूज़र को आसान Hindi + Bhojpuri mix में समझाओ। पढ़ाई के सवालों को teacher की तरह step-by-step समझाओ।",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "कोई जवाब नहीं मिला।";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "Groq Error: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
