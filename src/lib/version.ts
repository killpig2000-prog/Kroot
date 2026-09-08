import pkg from "../../package.json";

// One source of truth for the number the Settings page shows and the number
// the Play Store build carries: package.json. Bump it there when you ship.
export const APP_VERSION: string = pkg.version;
