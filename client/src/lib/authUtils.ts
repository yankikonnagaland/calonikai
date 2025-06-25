export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function isUsageLimitError(error: Error): boolean {
  return error.message.includes("Daily limit reached") || error.message.includes("upgrade to premium");
}