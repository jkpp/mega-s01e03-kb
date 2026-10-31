// Splits a merged ticket into the problems its reports describe, counted the desk's way.
// The counts come from the desk's own view (causes.ts, as CauseTable runs it): `parser` and `hint`
// by tenant, with the desk's one-day moves (desk-notes.json, `oneDayMove`) counted where they are
// filed and shown as their own problem. A month/day swap fix does not touch them.
import { groupByCause, readAs, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export type ProblemRow = {
  problem: Problem;
  reports: number;
  // For one-day: the cause row the desk files these reports under.
  filedUnder?: string;
  tenants: number;
  // What intake tagged these reports as: tag → count. A guess from the reporter's browser.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

function row(problem: Problem, rs: Report[], filedUnder?: string): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs.length,
    filedUnder,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; merged: number; problems: ProblemRow[] } {
  const unique = uniqueById(all);
  const merged = unique.filter((r) => r.mergedInto === ticket);
  const groups = groupByCause(merged, tenantOf);
  const problems: ProblemRow[] = groups.map((g) => row(g.cause, g.reports));
  for (const g of groups) {
    if (readAs(g, oneDayMove)) problems.push(row('one-day', g.reports.filter((r) => oneDayMove.includes(r.id)), g.cause));
  }
  return { rows: all.length, unique: unique.length, merged: merged.length, problems };
}
