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
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "तुम VP AI हो। यूज़र के सवालों का जवाब आसान, साफ और आकर्षक भाषा (Hindi + Bhojpuri mix) में दो। जवाब हमेशा सीधा, सुंदर और पॉइंट्स में लिखो। फालतू टेबल (|---|) या अजीब सिंबल मत बनाओ।",
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
