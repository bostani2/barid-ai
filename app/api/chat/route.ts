import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { query, conversation_id, user, files } = await req.json();

    if (!query || typeof query !== "string") {
      return new Response("Missing 'query' in request body", { status: 400 });
    }

    const apiKey = process.env.DIFY_API_KEY;
    if (!apiKey) {
      return new Response("Server missing DIFY_API_KEY", { status: 500 });
    }

    const baseUrl = process.env.DIFY_BASE_URL ?? "http://dify.kianhub.com";

    const upstream = await fetch(`${baseUrl}/v1/chat-messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {},
        query,
        response_mode: "streaming",
        conversation_id: conversation_id ?? "",
        user: user ?? "web-user",
        files: files ?? [],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      return new Response(text || "Upstream error", { status: upstream.status || 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const reader = upstream.body!.getReader();

        function flushFrames(frames: string[]) {
          for (const frame of frames) {
            const lines = frame.split("\n");
            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith("data:")) continue;
              const jsonStr = line.slice(5).trim();
              if (!jsonStr) continue;
              if (jsonStr === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const evt = JSON.parse(jsonStr);
                const eventName = evt.event as string | undefined;
                if (eventName === "message" && typeof evt.answer === "string") {
                  controller.enqueue(encoder.encode(evt.answer));
                } else if (eventName === "message_end") {
                  controller.close();
                  return;
                }
              } catch {
                // ignore malformed JSON chunks
              }
            }
          }
        }

        function pump() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                if (buffer) {
                  flushFrames([buffer]);
                }
                controller.close();
                return;
              }
              buffer += decoder.decode(value, { stream: true });
              const frames = buffer.split("\n\n");
              buffer = frames.pop() || "";
              flushFrames(frames);
              pump();
            })
            .catch((err) => {
              controller.error(err);
            });
        }

        pump();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    return new Response("Invalid request body", { status: 400 });
  }
}


