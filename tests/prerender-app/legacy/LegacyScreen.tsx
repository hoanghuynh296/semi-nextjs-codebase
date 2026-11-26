// A screen of the app's own (legacy) UI (#184): never rendered, it is the source of the legacy Tailwind build in
// app/(staged)/legacy.css, so that build has its own `.flex`, `.hidden`, `md:flex`, `--spacing` and
// Tailwind's default `--color-emerald-500`.
export function LegacyScreen() {
  return (
    <div className="flex flex-col p-4 gap-2 md:flex-row">
      <header className="flex md:hidden h-14 px-2">Legacy</header>
      <nav className="hidden md:flex w-60 text-emerald-500">Menu</nav>
    </div>
  );
}
