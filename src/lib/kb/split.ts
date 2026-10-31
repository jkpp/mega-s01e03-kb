// Splits a merged ticket into the problems its reports really describe.
// causes.ts knows two causes from the tenant alone. A third one is in the desk's own notes
// (desk-notes.json, `oneDayMove`): reports where the date moved by one day, not month for day.
// causes.ts counts those under the tenant's cause and footnotes them; here they get their own row,
// because a month/day swap fix does not touch them.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count. A guess from the reporter's browser.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; merged: number; problems: ProblemRow[] } {
  const unique = uniqueById(all);
  const merged = unique.filter((r) => r.mergedInto === ticket);
  const by = new Map<Problem, Report[]>();
  for (const r of merged) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const problems = PROBLEMS.filter((p) => by.has(p)).map((p) => {
    const rs = by.get(p)!;
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem: p,
      reports: rs.length,
      tenants: new Set(rs.map((r) => r.tenant)).size,
      channels: tally(rs.map((r) => r.channel)),
      taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    };
  });
  return { rows: all.length, unique: unique.length, merged: merged.length, problems };
}
