import { PlanColumn } from "@/components/plan/plan-column";
import { PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacePlans } from "@/lib/plans";

interface Properties {
  workspaceId: string;
}

export function WorkspacePaywall(props: Properties) {
  const { workspaceId } = props;
  if (workspaceId === PERSONAL_SPACE_ID) return null;

  return (
    <section className="workspace-plan">
      <h2>Plan</h2>
      <p className="lede">This workspace is on the free plan.</p>
      <div className="plan-grid">
        {workspacePlans.map((plan) => (
          <PlanColumn key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}
