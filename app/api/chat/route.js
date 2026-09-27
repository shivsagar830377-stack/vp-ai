import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY Vercel me nahi mili!" },
        { status: 500 }
      );
    }

    const { message, image } = await request.json();

    if (!message && !image) {
      return Response.json({ error: "Message ya photo khali hai!" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    // Groq ka active & fastest model
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "Tum VP AI ho. User ke sawalo ka jawab aasan, clean Hindi + Bhojpuri mix me step-by-step teacher style me do. Koi raw asterisk ya hash symbol mat failao.",
        },
        {
          role: "user",
          content: message || "Is sawal ko aasan bhasha me samjha dijiye.",
        },
      ],
    });

    const reply = response.choices?.[0]?.message?.content || "Koi jawab nahi mila.";
    return Response.json({ reply });
  } catch (error) {
    return Response.json(
      { error: "Groq Error: " + (error?.message || error?.toString()) },
      { status: 500 }
    );
  }
}
