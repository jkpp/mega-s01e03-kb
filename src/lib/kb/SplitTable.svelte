<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/split';

  // `tickets`: where each problem is tracked now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
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
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code>{#if p.filedUnder}<span class="small"> · filed under <code>{p.filedUnder}</code></span>{/if}</td>
        <td><strong>{p.reports}</strong></td>
        <td>{p.tenants}</td>
        <td class="small">{list(p.taggedAs)}</td>
        <td class="small">{p.firstSeen} → {p.lastSeen}</td>
        <td>{#if tickets[p.problem]}<a href={tickets[p.problem]}>{issueNo(tickets[p.problem]!)}</a>{:else}<span class="none">none</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="small">Counted the desk's way: <code>parser</code> and <code>hint</code> by tenant, as the #{ticket} cause
  table counts them. The one-day reports stay counted where the desk files them and are listed again as
  their own problem.</p>

<style>
  .sum { font-size: 1.05rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
