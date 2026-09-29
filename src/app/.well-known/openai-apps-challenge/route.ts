export function GET() {
  const challenge = process.env.OPENAI_APPS_CHALLENGE;
  if (!challenge) return new Response(null, { status: 404 });
  return new Response(challenge, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
