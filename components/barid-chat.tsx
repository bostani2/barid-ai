"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function BaridChat() {
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isSending, setIsSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    setIsSending(true)

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed }
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" }
    setMessages(prev => [...prev, userMsg, assistantMsg])
    setInput("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      })

      if (!res.ok || !res.body) {
        throw new Error(await res.text())
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done })
        if (chunk) {
          setMessages(prev => {
            const next = [...prev]
            const idx = next.findIndex(m => m.id === assistantMsg.id)
            if (idx !== -1) {
              next[idx] = { ...next[idx], content: next[idx].content + chunk }
            }
            return next
          })
        }
      }
    } catch (e) {
      setMessages(prev => {
        const next = [...prev]
        const idx = next.findIndex(m => m.role === "assistant" && m.content === "")
        if (idx !== -1) {
          next[idx] = { ...next[idx], content: "خطا در دریافت پاسخ." }
        }
        return next
      })
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#212121] text-white" data-name="Barid-chat" data-node-id="1:56">
      <h1
        className="absolute left-1/2 -translate-x-1/2 top-4 text-[24px] leading-none whitespace-nowrap"
        data-node-id="1:65"
      >
        سامانه هوشمند اتوماسیون اداری
      </h1>

      <div
        ref={scrollRef}
        className="absolute left-1/2 -translate-x-1/2 top-[60px] bottom-[120px] w-[90%] max-w-[849px] overflow-y-auto"
      >
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={m.id} className="whitespace-pre-wrap leading-relaxed" dir="rtl">
              <span className="mr-2 text-[#AFAFAF]">
                {m.role === "user" ? "شما:" : "دستیار:"}
                {m.role === "assistant" && isSending && i === messages.length - 1 && (
                  <span className="inline-flex items-center mr-1 align-middle" aria-live="polite">
                    <span
                      className="ml-2 inline-block h-3 w-3 rounded-full border-2 border-[#AFAFAF] border-t-transparent animate-spin"
                      aria-label="در حال فکر کردن"
                    />
                  </span>
                )}
              </span>
              <span>{m.content}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[35px] w-[90%] max-w-[849px]"
        data-name="Search bar"
        data-node-id="1:68"
        dir="rtl"
      >
        <Input
          className="h-[69px] rounded-[35px] bg-[#303030] border-0 text-white placeholder-[#AFAFAF] pr-6"
          placeholder="پیام خود را بنویسید و Enter را بزنید"
          aria-label="Send message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
      </div>

      <p
        className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[12px] whitespace-nowrap"
        data-node-id="1:72"
      >
        شرکت ملی مناطق نفت خیز جنوب
      </p>
    </div>
  )
}


