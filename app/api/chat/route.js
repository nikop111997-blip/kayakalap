import clientPromise from '@/lib/mongodb';
import fs from "fs"
import path from "path"

const kbPath = path.join(process.cwd(), "Kayapalat-Chatbot-Knowledge-Base.md")
const knowledgeBase = fs.readFileSync(kbPath, "utf-8")
export const dynamic = 'force-dynamic';

// ✅ CORS HEADERS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Credentials": "true",
};

// ✅ REMOVE <think> BLOCKS
function cleanChunk(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "")
}

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // ======================
    // 1. EXTRACT CONTEXT
    // ======================
    let frontendContext = "";
    let cleanMessages = messages.filter(msg => {
      if (msg.role === 'system') {
        frontendContext += "\n" + msg.content;
        return false;
      }
      return true;
    });

    // ======================
    // 2. SAVE USER DATA
    // ======================
    const userMatch = frontendContext.match(/name is (.+?) and their mobile is (\d{10})/i);

    if (userMatch) {
      const name = userMatch[1].trim();
      const mobile = userMatch[2].trim();

      try {
        const client = await clientPromise;
        const db = client.db("kayakalap");

        await db.collection("chatBot").updateOne(
          { mobile },
          {
            $set: {
              name,
              mobile,
              updatedAt: new Date(),
            },
            $push: {
              history: {
                $each: cleanMessages,
                $slice: -100
              }
            },
            $setOnInsert: {
              createdAt: new Date(),
            }
          },
          { upsert: true }
        );
      } catch (dbError) {
        console.error("MongoDB Save Error:", dbError);
      }
    }

    // ======================
    // 3. FIX MESSAGE FORMAT
    // ======================
    if (cleanMessages.length > 0 && cleanMessages[0].role === 'assistant') {
      cleanMessages.unshift({ role: 'user', content: 'Hello.' });
    }

    let alternatingMessages = [];
    for (let i = 0; i < cleanMessages.length; i++) {
      if (alternatingMessages.length === 0) {
        alternatingMessages.push(cleanMessages[i]);
      } else {
        let lastRole = alternatingMessages[alternatingMessages.length - 1].role;

        if (cleanMessages[i].role === lastRole) {
          alternatingMessages[alternatingMessages.length - 1].content += "\n\n" + cleanMessages[i].content;
        } else {
          alternatingMessages.push(cleanMessages[i]);
        }
      }
    }

    // ======================
    // 4. SYSTEM PROMPT
    // ======================
    const finalSystemPrompt = {
      role: 'system',
      content: `
IMPORTANT:
- Never output <think> tags
- Never show internal reasoning
- Only return final user-facing response

You are the digital concierge for Kayapalat Wellness.

Tone:
- Empathetic
- Clinical
- Premium
- Authoritative

Goal:
- Guide user to Strategy Session or Quiz
- Never give generic fitness advice
- Never suggest crash dieting or heavy workouts

${knowledgeBase}

User Context:
${frontendContext}
`
    };

    const finalMessageArray = [finalSystemPrompt, ...alternatingMessages];

    // ======================
    // 5. CALL SARVAM API
    // ======================
    const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: finalMessageArray,
        stream: true,
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return new Response(
        JSON.stringify({ error: errorText }),
        {
          status: response.status,
          headers: corsHeaders
        }
      );
    }

    // ======================
    // 6. STREAM CLEANING
    // ======================
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = decoder.decode(value);

          // 🔥 REMOVE <think>
          chunk = cleanChunk(chunk);

          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });

  } catch (error) {
    console.error("Server Error:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// ======================
// ✅ PREFLIGHT (CORS)
// ======================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}