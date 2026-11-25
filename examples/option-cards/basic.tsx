"use client";

import { useState } from "react";
import { OptionCards } from "@semi/ui";

export default function OptionCardsBasic() {
  const [provider, setProvider] = useState("openai");
  return (
    <div className="space-y-3 max-w-xl">
      <div className="text-overline text-muted">Nhà cung cấp AI</div>
      <OptionCards
        label="Nhà cung cấp AI"
        value={provider}
        onChange={setProvider}
        options={[
          { value: "openai", label: "OpenAI", icon: "sparkles" },
          { value: "anthropic", label: "Anthropic", icon: "cpu" },
          { value: "google", label: "Google Gemini", icon: "zap" },
          { value: "local", label: "Máy chủ nội bộ", icon: "server" },
        ]}
      />
    </div>
  );
}
