/** Public-folder asset path that respects Vite base (GitHub Pages subdirectory, local zip, dev). */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}
