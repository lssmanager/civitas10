import { createHash, createVerify } from "node:crypto";
export const sha256Integrity = (content:string|Buffer) => `sha256-${createHash("sha256").update(content).digest("base64url")}`;
export const verifyIntegrity = (content:string|Buffer, expected:string) => expected.startsWith("sha256-") && sha256Integrity(content) === expected;
export const verifySignature = ({ payload, signature, publicKeyPem }:{ payload:string; signature?:{ algorithm:"ed25519"; value:string }; publicKeyPem?:string }) => {
  if(!signature) return true; if(signature.algorithm !== "ed25519" || !publicKeyPem) return false; try { return createVerify("sha256").update(payload).verify(publicKeyPem, signature.value, "base64url"); } catch { return false; }
};
