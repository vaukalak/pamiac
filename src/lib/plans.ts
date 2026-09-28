export interface Plan {
  id: string;
  name: string;
  price: string;
  enabled: boolean;
  action: string;
}

export const plans: readonly Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    enabled: true,
    action: "Current plan",
  },
  {
    id: "5",
    name: "$5",
    price: "per month",
    enabled: false,
    action: "Coming soon",
  },
  {
    id: "20",
    name: "$20",
    price: "per month",
    enabled: false,
    action: "Coming soon",
  },
];
