/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL_HERBALISM: string | undefined;
  readonly VITE_URL_EVOLUTION: string | undefined;
  readonly VITE_URL_SUDOKU: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
