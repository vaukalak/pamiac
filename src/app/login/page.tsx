import { redirect } from "next/navigation";
import { AppHeader } from "@/components/header/app-header";
import { LoginForm } from "@/components/login-form";
import { SetupScreen } from "@/components/setup-screen";
import { safeNext } from "@/lib/config";
import { oauthAuthorizeResumePath, oauthLoginReturnPath, toSearchParams } from "@/lib/oauth-return";
import { getLibrarySession, getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = toSearchParams(params);
  const next = typeof params.next === "string" ? params.next : null;
  const oauthResume = oauthAuthorizeResumePath(query);
  const nextPath = oauthResume ?? safeNext(next);
  const formNext = oauthLoginReturnPath(query) ?? nextPath;
  const result = oauthResume ? await getSession() : await getLibrarySession();
  if (result.status === "setup") return <SetupScreen />;
  if (result.status === "error") return <SetupScreen detail={result.message} />;
  if (result.session) redirect(nextPath);

  return (
    <>
      <AppHeader />
      <main className="auth-wrap auth-door">
        <div className="auth-ground" aria-hidden="true">
          <svg className="auth-ground-note" viewBox="0 0 220 150" focusable="false">
            <path d="M11 11 H135 L167 43 V139 H11 Z" fill="var(--uml-note-shadow)" />
            <path
              d="M8 8 H132 L164 40 V136 H8 Z"
              fill="var(--uml-note)"
              stroke="var(--uml-note-edge)"
              strokeWidth="1.5"
            />
            <path
              d="M132 8 L164 40 H132 Z"
              fill="var(--paper-deep)"
              stroke="var(--uml-note-edge)"
              strokeWidth="1.5"
            />
            <path
              d="M24 62 H108 M24 82 H86 M24 102 H100"
              fill="none"
              stroke="var(--uml-note-edge)"
              strokeWidth="1.25"
              strokeLinecap="round"
            />
          </svg>
          <svg className="auth-ground-diagram" viewBox="0 0 280 200" focusable="false">
            <defs>
              <pattern id="auth-ground-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0 H0 V24" fill="none" stroke="var(--canvas-grid)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="280" height="200" fill="var(--canvas)" />
            <rect width="280" height="200" fill="url(#auth-ground-grid)" />
            <rect x="43" y="55" width="250" height="118" fill="var(--uml-ink)" />
            <rect
              x="40"
              y="52"
              width="250"
              height="118"
              fill="var(--uml-fill)"
              stroke="var(--uml-ink)"
              strokeWidth="1.5"
            />
            <path
              d="M40 88 H290 M40 124 H290"
              fill="none"
              stroke="var(--uml-ink)"
              strokeWidth="1.25"
            />
          </svg>
        </div>
        <section className="auth-card">
          <p className="eyebrow">Notes, UML, and agents</p>
          <LoginForm nextPath={formNext} />
        </section>
      </main>
    </>
  );
}
