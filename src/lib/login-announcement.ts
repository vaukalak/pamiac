interface Input {
  status: "idle" | "sending" | "sent" | "error";
  addressError: string;
  failure: string;
  address: string;
}

const retry = "Try again, or use another address.";

export function loginAnnouncement(input: Input) {
  const { status, addressError, failure, address } = input;

  if (status === "sent") {
    return [
      "Check your email",
      `We sent a link to ${address}.`,
      "Check your inbox, then spam, then promotions,",
      "and it can take a minute.",
    ].join("\n");
  }

  if (addressError) return addressError;

  if (status === "error") return [failure, retry].filter((line) => line !== "").join("\n");

  return "";
}
