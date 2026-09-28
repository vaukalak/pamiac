import type { Plan } from "@/lib/plans";
import { PlanAction } from "@/components/plan/plan-action";

interface Properties {
  plan: Plan;
}

export function PlanColumn(props: Properties) {
  const { plan } = props;
  const availability = plan.enabled ? "is-current" : "is-unavailable";

  return (
    <article className={`plan-card ${availability}`}>
      <h2>{plan.name}</h2>
      <p className="plan-price">{plan.price}</p>
      <PlanAction enabled={plan.enabled} label={plan.action} />
    </article>
  );
}
