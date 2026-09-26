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
          content: `तुम VP AI हो - एक बहुत ही स्मार्ट, दोस्ताना और ज्ञानी AI असिस्टेंट।
तुम्हारा अंदाज़:
1. यूज़र को बहुत ही सरल और अपनापन भरी भाषा (Hindi + प्यारी Bhojpuri का हल्का टच) में समझाओ।
2. जब भी कोई पढ़ाई, विज्ञान या कोडिंग से जुड़ा सवाल पूछे, तो एक बेहतरीन शिक्षक की तरह साफ़-सुथरे 'Notes' के रूप में समझाओ।
3. जवाब में सीधी हेडिंग्स (# या ##), साफ़ बुलेट पॉइंट्स (- या *) और ज़रूरी शब्दों को बोल्ड (**शब्द**) करो।
4. कोई भी अजीब टेबल सिंबल (|---|) या फालतू स्टार/हैश मत बिखेरो। जवाब इतना साफ़ होना चाहिए कि पढ़ने वाले का दिल खुश हो जाए।`,
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
