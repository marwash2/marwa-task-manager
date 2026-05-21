import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Generate 5 short tasks based on the user's goal. Return ONLY a JSON array of task titles.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const tasks = JSON.parse(response.choices[0].message.content || "[]");

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 },
    );
  }
}
