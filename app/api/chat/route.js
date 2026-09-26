
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "Message खाली है" }, { status: 400 });
    }

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "तुम VP AI हो। यूज़र को आसान Hindi + Bhojpuri mix में समझाओ। पढ़ाई के सवालों को teacher की तरह step-by-step समझाओ। जरूरत होने पर headings, bullets और छोटे notes दो।",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "मुझे अभी जवाब नहीं मिल पाया।";

    return Response.json({ reply });
  } catch (error) {
    console.error("Groq Error:", error);
    return Response.json(
      { error: "AI से जवाब लेने में समस्या हुई।" },
      { status: 500 }
    );
  }
}
