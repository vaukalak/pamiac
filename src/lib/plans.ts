export interface Plan {
  id: string;
  name: string;
  price: string;
  documents: number;
  enabled: boolean;
  action: string;
  members?: number;
}

export const plans: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    documents: 100,
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

const workspaceMemberLimits = [3, 10, 50] as const;

export const workspacePlans: readonly (Plan & { members: number })[] = plans.map((plan, index) => {
  const members = workspaceMemberLimits[index];
  if (members == null) throw new Error("No current workspace plan");
  return { ...plan, members };
});

export function currentPlan() {
  const plan = plans.find((item) => item.enabled);
  if (!plan) throw new Error("No current plan");
  return plan;
}

export function currentWorkspacePlan() {
  const plan = workspacePlans.find((item) => item.enabled);
  if (!plan) throw new Error("No current workspace plan");
  return plan;
}

export function formatCount(count: number) {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function documentLabel(plan: Plan) {
  return `${formatCount(plan.documents)} documents`;
}

export function memberLabel(members: number) {
  return `${formatCount(members)} people`;
}

export function documentRoom(count: number, plan: Plan) {
  if (count < plan.documents) return null;
  return `The ${plan.name} plan holds ${formatCount(plan.documents)} documents.`;
}

export function memberRoom(count: number, plan: Plan & { members: number }) {
  if (count < plan.members) return null;
  return `The ${plan.name} plan holds ${formatCount(plan.members)} people.`;
}
