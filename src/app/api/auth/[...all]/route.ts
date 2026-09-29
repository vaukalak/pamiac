import { handleAuthRequest } from "@/lib/auth-request";

export function GET(request: Request) {
  return handleAuthRequest(request);
}

export function POST(request: Request) {
  return handleAuthRequest(request);
}
