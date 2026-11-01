"use client";

import { useState } from "react";
import { ChatModelPicker, Icon } from "@semi/ui";

const PROVIDERS = [
  { id: "claude", name: "Claude", models: [{ id: "opus", label: "Opus 5.5", efforts: true }, { id: "haiku", label: "Haiku 5.5" }] },
  { id: "local", name: "Ollama (máy này)", models: [{ id: "llama", label: "llama-local" }] },
];

export default function ChatModelPickerBasic() {
  const [provider, setProvider] = useState("claude");
  const [model, setModel] = useState("opus");
  const [effort, setEffort] = useState("");
  const current = PROVIDERS.find((p) => p.id === provider)!;
  const hasEffort = current.models.find((m) => m.id === model && "efforts" in m);
  return (
    <ChatModelPicker
      providers={PROVIDERS.map((p) => ({ value: p.id, label: p.name, icon: <Icon name="sparkles" className="w-3.5 h-3.5" /> }))}
      provider={provider}
      onProviderChange={(v) => {
        setProvider(v);
        setModel(PROVIDERS.find((p) => p.id === v)!.models[0].id);
      }}
      models={current.models.map((m) => ({ value: m.id, label: m.label }))}
      model={model}
      onModelChange={setModel}
      efforts={hasEffort ? [{ value: "", label: "Tự động" }, { value: "high", label: "Nghĩ kỹ" }] : []}
      effort={effort}
      onEffortChange={setEffort}
    />
  );
}
