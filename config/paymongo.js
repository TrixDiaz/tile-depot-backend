import {PAYMONGO_PUBLIC_KEY, PAYMONGO_SECRET_KEY} from "./env.js";

export const paymongoConfig = {
  publicKey: PAYMONGO_PUBLIC_KEY,
  secretKey: PAYMONGO_SECRET_KEY,
  baseUrl: "https://api.paymongo.com/v1",
};

// Helper to get auth header for PayMongo API
// Using the base64-encoded key directly
export const getPaymongoAuthHeader = () => {
  // Use the hardcoded base64-encoded secret key directly
  const base64EncodedKey = "c2tfdGVzdF8yUFkzQXdhdENHQmtyeGtlQ3lFU1BjcTQ6";
  return `Basic ${base64EncodedKey}`;
};
