const SENT_ADDRESS_KEY = "pamiac.login.sentAddress";
const SENT_PAINT_MARK = "data-login-sent";

export function loginSentBootScript() {
  const key = JSON.stringify(SENT_ADDRESS_KEY);
  const mark = JSON.stringify(SENT_PAINT_MARK);
  return `try{if(sessionStorage.getItem(${key}))document.documentElement.setAttribute(${mark},"")}catch(e){}`;
}

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
  if (storage) {
    try {
      storage.removeItem(SENT_ADDRESS_KEY);
    } catch {
      // The paint mark still has to come off so the form can show.
    }
  }
  releaseSentLoginPaint();
}

function releaseSentLoginPaint() {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute(SENT_PAINT_MARK);
}

function sentLoginStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}
