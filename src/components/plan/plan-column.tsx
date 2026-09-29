import { PlanAction } from "@/components/plan/plan-action";
import { documentLabel, type Plan } from "@/lib/plans";

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
      <p className="plan-allowance">{documentLabel(plan)}</p>
      <PlanAction enabled={plan.enabled} label={plan.action} />
    </article>
  );
}
