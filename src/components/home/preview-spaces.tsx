import { PreviewSpaceCard, type PreviewSpace } from "@/components/home/preview-space-card";

const SPACES: PreviewSpace[] = [
  { icon: "home", name: "Personal", detail: "Private desk" },
  { icon: "library", name: "Field notes", detail: "Team workspace", open: true },
];

export function PreviewSpaces() {
  return (
    <div className="home-preview-spaces">
      {SPACES.map((space) => (
        <PreviewSpaceCard key={space.name} space={space} />
      ))}
    </div>
  );
}
