import { ConfirmHost, TaskHost, ThemeProvider, ThemeScript, ToastHost } from "@semi/ui";
import brand from "./brand.json";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata = {
  title: `${brand.name} — brand preview`,
  description: `The ${brand.name} brand on the Semi Design System: logo, colours, type, voice, sample screens and every component.`,
};

// The style picked in the preview is applied before paint, like the theme.
const STYLE_SCRIPT = `try{var s=localStorage.getItem("brand-preview-style");if(s)document.documentElement.dataset.style=s}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-theme="dark" data-style={brand.styles.default} className={`dark ${fontVariables}`} suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
        <script dangerouslySetInnerHTML={{ __html: STYLE_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-canvas text-body font-sans antialiased">
        <ThemeProvider defaultTheme="dark">
          {children}
          <ToastHost />
          <ConfirmHost />
          <TaskHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
