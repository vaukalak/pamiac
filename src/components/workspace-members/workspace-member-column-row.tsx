interface Properties {
  when: string;
}

export function WorkspaceMemberColumnRow(props: Properties) {
  const { when } = props;

  return (
    <tr>
      <th>Member</th>
      <th>Role</th>
      <th>{when}</th>
    </tr>
  );
}
