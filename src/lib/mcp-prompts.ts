export const starterPrompts = [
  {
    name: "search-notes",
    title: "Search notes",
    description: "Search the signed-in library and summarize the matching notes.",
    text: "Find my notes about checkout and summarize what they say.",
  },
  {
    name: "draw-diagram",
    title: "Draw a diagram",
    description: "Create a UML class diagram in the signed-in library.",
    text: "Draw a UML class diagram of an order, a payment, and how they connect.",
  },
  {
    name: "update-diagram",
    title: "Update a diagram",
    description: "Add one method to a class on an existing diagram.",
    text: "Add a login method to the user class on my checkout diagram.",
  },
] as const;
