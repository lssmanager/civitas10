const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const bytesOf = (content: string | Uint8Array): Uint8Array => typeof content === "string" ? new TextEncoder().encode(content) : content;

export const sha256Integrity = async (content: string | Uint8Array): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytesOf(content));
  return `sha256-${toBase64Url(new Uint8Array(digest))}`;
};

export const verifyIntegrity = async (content: string | Uint8Array, expected: string): Promise<boolean> => {
  if (!expected.startsWith("sha256-")) return false;
  return await sha256Integrity(content) === expected;
};

export const verifySignature = async ({ payload, signature, publicKey }:{ payload:string; signature?:{ algorithm:"ed25519"; value:string }; publicKey?:CryptoKey }): Promise<boolean> => {
  if (!signature) return true;
  if (signature.algorithm !== "ed25519" || !publicKey) return false;
  try {
    const raw = signature.value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = raw.padEnd(Math.ceil(raw.length / 4) * 4, "=");
    const signatureBytes = Uint8Array.from(globalThis.atob(padded), (char) => char.charCodeAt(0));
    return await globalThis.crypto.subtle.verify("Ed25519", publicKey, signatureBytes, bytesOf(payload));
  } catch {
    return false;
  }
};
