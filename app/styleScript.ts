// Storybook only: the style preview (StyleSwitcher) stores its pick here. A server-safe module, so the root layout
// can inline the script (a "use client" module would hand the layout a client reference, not the string).
export const STYLE_STORAGE_KEY = "semi-style";

/** Inline, before paint: applies the stored style so the page never flashes the default one. */
export const STYLE_SCRIPT = `try{var s=localStorage.getItem("${STYLE_STORAGE_KEY}");if(s)document.documentElement.dataset.style=s}catch(e){}`;
