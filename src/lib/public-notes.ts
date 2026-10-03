export interface PublicNoteContent {
  id: string;
  title: string;
  markdown: string;
}

export const privacyNote: PublicNoteContent = {
  id: "privacy",
  title: "Privacy policy",
  markdown: [
    "Pamiac stores the notes and UML diagrams in your library.",
    "You sign in with a magic link sent to your email. An existing account can also sign in with its email and password. Google sign-in is optional. Password sign-up is closed.",
    "Categories we collect: your email address, and your name and profile image when Google sign-in returns them. For a password account we store a hash of the password. A session cookie keeps you signed in. That session also stores the IP address and browser user agent from the sign-in request. We store the notes, diagrams, and sharing settings you add. Search stores embeddings of your notes and diagrams in your library. A support message includes the email and the text you send.",
    "Purposes: we use this data to create your account, send the sign-in link, check a password when you use that sign-in, keep you signed in, store and search your library, share a document the way you choose, answer a support message, and run the ChatGPT plugin after you approve it.",
    "Recipients: the library stays on Pamiac. Resend delivers the magic-link email, invitation emails, and support messages, and receives the address and message for that delivery. Google receives the sign-in only if you choose Google. People you invite, and anyone with a public or password link, can open what you shared.",
    "After you approve access, ChatGPT receives the account id and any name or email the plugin returns, plus the notes or diagrams a request reads or writes. ChatGPT does not receive PAMIAC_TOKEN or your password. The consent screen is https://pamiac.com/oauth/consent",
    "Retention: the sign-in link expires after 5 minutes. A browser session lasts 7 days and extends when you use the app, until you log out. Notes, diagrams, and their embeddings stay until you delete the document. Your email and any password hash stay with the account. We keep a support message so we can reply.",
    "Controls: you choose who can open each document. The choices are private, invited emails, a password, or public. A public document can be read by anyone with the link. A private document stays with the owner. You can delete a document, revoke an API key, and log out. Disconnect the plugin in ChatGPT to stop further access. To ask us to delete your account, write to support@pamiac.com. Support is at https://pamiac.com/support",
  ].join("\n\n"),
};

export const termsNote: PublicNoteContent = {
  id: "terms",
  title: "Terms",
  markdown: [
    "These terms cover Pamiac, the app for notes and UML diagrams.",
    "You sign in with a magic link, with an existing email and password, or with Google when that option is shown. Password sign-up is closed.",
    "You are responsible for the email inbox you use.",
    "You keep the notes and diagrams you add.",
    "You choose who can open each document. The choices are private, invited emails, a password, or public.",
    "A public document can be read by anyone with the link.",
    "The ChatGPT plugin connects at https://pamiac.com/oauth/consent",
    "ChatGPT does not receive PAMIAC_TOKEN. The plugin uses only the access you approve.",
    "Your embeddings search looks through your own library. It does not publish your documents.",
    "Support is at https://pamiac.com/support",
  ].join("\n\n"),
};
