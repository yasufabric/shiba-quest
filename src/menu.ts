import { config, type Command } from './config';

export interface CommandSlot {
  hidden: boolean;
  disabled: boolean;
  hot: boolean;
}

export type MenuCommand = 'attack' | 'charge' | 'guard' | 'combo';

/**
 * First run shows こうげき, ためる, and まもる together.
 * Only the guided command is hot; the other two stay visible and dimmed.
 */
export function commandMenu(input: {
  tutorialStep: number | null;
  comboReady: boolean;
  open: boolean;
}): Record<MenuCommand, CommandSlot> {
  const tutorial = input.tutorialStep !== null;
  const guided: Command | null = tutorial ? (config.tutorial.steps[input.tutorialStep ?? 0] ?? null) : 'attack';
  const commands: readonly MenuCommand[] = ['attack', 'charge', 'guard', 'combo'];
  const slots = {} as Record<MenuCommand, CommandSlot>;
  for (const command of commands) {
    slots[command] = slotFor(command, input.open, tutorial, guided, input.comboReady);
  }
  return slots;
}

function slotFor(
  command: MenuCommand,
  open: boolean,
  tutorial: boolean,
  guided: Command | null,
  comboReady: boolean,
): CommandSlot {
  if (command === 'combo') {
    const hidden = !open || tutorial || !comboReady;
    return { hidden, disabled: hidden, hot: false };
  }
  if (!open) return { hidden: false, disabled: true, hot: false };
  if (!tutorial) return { hidden: false, disabled: false, hot: command === 'attack' };
  const hot = command === guided;
  return { hidden: false, disabled: !hot, hot };
}
