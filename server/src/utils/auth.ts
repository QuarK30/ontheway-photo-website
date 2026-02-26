import crypto from "crypto";

const SALT = "ontheway-admin-v1";
const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = "sha256";

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, ITERATIONS, KEYLEN, DIGEST).toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(hashPassword(password), "hex"),
    Buffer.from(hash, "hex")
  );
}
