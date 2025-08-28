"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

export default function BaridChat() {
  return (
    <div className="relative min-h-screen w-full bg-[#212121] text-white" data-name="Barid-chat" data-node-id="1:56">
      <h1
        className="absolute left-1/2 -translate-x-1/2 top-4 text-[24px] leading-none whitespace-nowrap"
        data-node-id="1:65"
      >
        سامانه هوشمند توماسیون اداری
      </h1>

      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[35px] w-[90%] max-w-[849px]"
        data-name="Search bar"
        data-node-id="1:68"
        dir="rtl"
      >
        <Input
          className="h-[69px] rounded-[35px] bg-[#303030] border-0 text-white placeholder-[#AFAFAF] pr-6"
          placeholder="جستجوی موضوعی در نامه ها"
          aria-label="Search letters by topic"
        />
      </div>

      <p
        className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[16px] whitespace-nowrap"
        data-node-id="1:72"
      >
        شرکت ملی مناطق نفت خیز جنوب
      </p>
    </div>
  )
}


