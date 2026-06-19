/// <reference types="nativewind/types" />

// Side-effect CSS imports (global.css for NativeWind, *.module.css on web).
declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

