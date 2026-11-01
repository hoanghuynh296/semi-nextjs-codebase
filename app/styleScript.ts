// Storybook only: the style preview (StyleSwitcher) stores its pick here. A server-safe module, so the root layout
// can inline the script (a "use client" module would hand the layout a client reference, not the string).
export const STYLE_STORAGE_KEY = "semi-style";
export const PALETTE_STORAGE_KEY = "semi-palette";

/** Inline, before paint: applies the stored style and palette so the page never flashes the default ones. */
export const STYLE_SCRIPT = `try{var d=document.documentElement,s=localStorage.getItem("${STYLE_STORAGE_KEY}"),p=localStorage.getItem("${PALETTE_STORAGE_KEY}");if(s)d.dataset.style=s;if(p)d.dataset.palette=p}catch(e){}`;
