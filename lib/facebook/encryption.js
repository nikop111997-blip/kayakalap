import crypto from "crypto";

function getEncryptionKey() {
  const key = Buffer.from(
    process.env.META_TOKEN_ENCRYPTION_KEY || "",
    "base64"
  );

  if (key.length !== 32) {
    throw new Error(
      "META_TOKEN_ENCRYPTION_KEY must be a valid 32-byte base64 key"
    );
  }

  return key;
}

export function encryptToken(token) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    content: encrypted.toString("base64"),
    authTag: authTag.toString("base64"),
    algorithm: "aes-256-gcm",
  };
}

export function decryptToken(encryptedToken) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encryptedToken.iv, "base64")
  );

  decipher.setAuthTag(
    Buffer.from(encryptedToken.authTag, "base64")
  );

  return Buffer.concat([
    decipher.update(
      Buffer.from(encryptedToken.content, "base64")
    ),
    decipher.final(),
  ]).toString("utf8");
}