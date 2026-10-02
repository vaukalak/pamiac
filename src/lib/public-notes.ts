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
    "You sign in with a magic link sent to your email. Google sign-in is optional.",
    "The account keeps your email address. A session cookie keeps you signed in.",
    "You choose who can open each document. The choices are private, invited emails, a password, or public.",
    "A public document can be read by anyone with the link. A private document stays with the owner.",
    "Search stores embeddings of your notes and diagrams in your library.",
    "The ChatGPT plugin asks for access at https://pamiac.com/oauth/consent",
    "ChatGPT does not receive PAMIAC_TOKEN.",
    "Support is at https://pamiac.com/support",
  ].join("\n\n"),
};

export const termsNote: PublicNoteContent = {
  id: "terms",
  title: "Terms",
  markdown: [
    "These terms cover Pamiac, the app for notes and UML diagrams.",
    "You sign in with a magic link, or with Google when that option is shown.",
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
