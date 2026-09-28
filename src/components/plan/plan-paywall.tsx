import { PlanColumn } from "@/components/plan/plan-column";
import { plans } from "@/lib/plans";

export function PlanPaywall() {
  return (
    <div>
      <h1>Plan</h1>
      <p className="lede">This account is on the free plan.</p>
      <div className="plan-grid">
        {plans.map((plan) => (
          <PlanColumn key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
