const SENT_ADDRESS_KEY = "pamiac.login.sentAddress";

export function readSentLoginAddress() {
  const storage = sentLoginStorage();
  if (!storage) return null;
  try {
    const address = storage.getItem(SENT_ADDRESS_KEY);
    if (!address) return null;
    return address;
  } catch {
    return null;
  }
}

export function rememberSentLoginAddress(address: string) {
  if (!address) return;
  const storage = sentLoginStorage();
  if (!storage) return;
  try {
    storage.setItem(SENT_ADDRESS_KEY, address);
  } catch {
    return;
  }
}

export function forgetSentLoginAddress() {
  const storage = sentLoginStorage();
  if (!storage) return;
  try {
    storage.removeItem(SENT_ADDRESS_KEY);
  } catch {
    return;
  }
}

function sentLoginStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
