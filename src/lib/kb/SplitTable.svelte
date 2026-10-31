<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // `tickets`: where each problem is tracked now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const counted = $derived(split.problems.reduce((n, p) => n + p.reports, 0));
  const list = (m: Record<string, number>) =>
    Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ×${n}`)
      .join(' · ');
  const issueNo = (url: string) => url.replace(/^.*\/issues\//, '#');
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.problems.length}</strong> problems ·
  export rows {split.rows}, unique {split.unique}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code></td>
        <td><strong>{p.reports}</strong></td>
        <td>{p.tenants}</td>
        <td class="small">{list(p.channels)}</td>
        <td class="small">{list(p.taggedAs)}</td>
        <td class="small">{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if tickets[p.problem]}<a href={tickets[p.problem]}>{issueNo(tickets[p.problem]!)}</a>{:else}<span class="none">none</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{counted}</strong></td><td colspan="5" class="small">{counted === split.merged ? `every report in #${ticket} counted once` : `${split.merged - counted} reports not counted`}</td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.05rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
  tfoot td { border-bottom: none; }
</style>
