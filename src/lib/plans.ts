export interface Plan {
  id: string;
  name: string;
  price: string;
  documents: number;
  enabled: boolean;
  action: string;
}

export const plans: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    documents: 30,
    enabled: true,
    action: "Current plan",
  },
  {
    id: "5",
    name: "$5",
    price: "per month",
    documents: 200,
    enabled: false,
    action: "Coming soon",
  },
  {
    id: "20",
    name: "$20",
    price: "per month",
    documents: 1500,
    enabled: false,
    action: "Coming soon",
  },
];

export function currentPlan() {
  const plan = plans.find((item) => item.enabled);
  if (!plan) throw new Error("No current plan");
  return plan;
}

export function formatCount(count: number) {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function documentLabel(plan: Plan) {
  return `${formatCount(plan.documents)} documents`;
}

export function documentRoom(count: number, plan: Plan) {
  if (count < plan.documents) return null;
  return `The ${plan.name} plan holds ${formatCount(plan.documents)} documents.`;
}
