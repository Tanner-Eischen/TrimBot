/// <reference types="vite/client" />

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke?: (command: string, args?: any) => Promise<any>;
        convertFileSrc?: (filePath: string) => string;
      };
    };
  }
}

export {};