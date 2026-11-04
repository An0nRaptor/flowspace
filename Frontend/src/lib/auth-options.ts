// Google login needs OAuth keys on the backend, so it's opt-in.
export const isGoogleLoginEnabled =
  import.meta.env.VITE_GOOGLE_LOGIN === "true";
