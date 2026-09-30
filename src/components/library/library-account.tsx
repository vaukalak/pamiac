import { ProfileMenu } from "@/components/header/profile-menu";

interface Properties {
  email: string;
}

export function LibraryAccount(props: Properties) {
  const { email } = props;

  return (
    <div className="library-account">
      <ProfileMenu email={email} />
      <p className="library-email">{email}</p>
    </div>
  );
}
