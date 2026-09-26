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

    const { message, image } = await request.json();

    if (!message && !image) {
      return Response.json({ error: "मैसेज या फोटो खाली है!" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    // अगर फोटो साथ में भेजी गई है तो विज़न मॉडल इस्तेमाल करें
    const modelToUse = image ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";

    let userContent = [];
    if (image) {
      userContent.push({
        type: "image_url",
        image_url: { url: image },
      });
    }
    userContent.push({
      type: "text",
      text: message || "इस फोटो को देखकर आसान हिंदी और भोजपुरी में समझाइए।",
    });

    const response = await groq.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: "system",
          content: `तुम VP AI हो। यूज़र के सवालों का जवाब आसान, साफ और आकर्षक भाषा (Hindi + Bhojpuri mix) में दो। अगर फोटो भेजी गई है, तो फोटो में दिख रही चीज़ या सवाल को बहुत अच्छे से समझकर टीचर की तरह समझाओ। जवाब हमेशा पॉइंट्स में और साफ लिखो।`,
        },
        {
          role: "user",
          content: userContent,
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
