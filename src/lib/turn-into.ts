export interface TurnIntoChoice {
  type: string;
  props?: Readonly<Record<string, boolean | number | string>>;
}

export interface TurnIntoBlock {
  id: string;
  type: string;
  props: Readonly<Record<string, boolean | number | string | undefined>>;
}

export function blockMatchesChoice(block: TurnIntoBlock, choice: TurnIntoChoice): boolean {
  if (block.type !== choice.type) return false;

  return Object.entries(choice.props ?? {}).every(([name, value]) => block.props[name] === value);
}

export function blockMatchesAnyChoice(
  block: TurnIntoBlock,
  choices: readonly TurnIntoChoice[],
): boolean {
  return choices.some((choice) => blockMatchesChoice(block, choice));
}

export function blocksToTurnInto<T extends TurnIntoBlock>(
  hovered: T,
  selected: readonly T[] | undefined,
  choices: readonly TurnIntoChoice[],
): T[] {
  const hoveredIsSelected = selected?.some((block) => block.id === hovered.id) === true;
  if (!hoveredIsSelected || selected === undefined) return [hovered];

  return selected.filter((block) => blockMatchesAnyChoice(block, choices));
}
