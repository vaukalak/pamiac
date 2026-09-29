export interface ProfileUser {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface ProfileContent {
  id: string;
  name?: string;
  email?: string;
}

export function profileContent(user: ProfileUser): ProfileContent {
  const id = user.id.trim();
  if (!id) throw new Error("Profile id is empty");
  const content: ProfileContent = { id };
  const name = user.name?.trim() ?? "";
  const email = user.email?.trim() ?? "";
  if (name) content.name = name;
  if (email) content.email = email;
  return content;
}
