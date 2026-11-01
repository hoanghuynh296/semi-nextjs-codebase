import { CodeBlock } from "@semi/ui";

export default function CodeBlockBasic() {
  return (
    <div className="space-y-3">
      <CodeBlock code="npx semi-brand preview" />
      <CodeBlock
        title="app/globals.css"
        code={`@import "tailwindcss";
@import "@semi/ui/tokens.css";
@import "@semi/ui/base.css";`}
      />
    </div>
  );
}
