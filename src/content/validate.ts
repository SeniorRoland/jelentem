import type { Balance, Content, Tier } from '../engine/types';

/** Returns a list of human-readable problems. Empty list = content is consistent. */
export function validateContent(c: Content, b: Balance): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const dup = (id: string) => { if (ids.has(id)) errs.push(`Duplikált azonosító: ${id}`); ids.add(id); };

  if (c.weeks.length !== b.expect.length)
    errs.push(`A hetek száma (${c.weeks.length}) nem egyezik a balance.expect hosszával (${b.expect.length}).`);

  c.weeks.forEach((w, wi) => {
    if (w.obs.length < b.slotsPerWeek) errs.push(`${wi + 1}. hét: kevesebb megfigyelés, mint mondathely.`);
    for (const o of w.obs) {
      dup(o.id);
      if (o.who && !(o.who in c.residents)) errs.push(`${o.id}: ismeretlen lakó: ${o.who}`);
      if (/["']/.test(o.text)) errs.push(`${o.id}: egyenes idézőjel a szövegben, használj „ ” jeleket.`);
      if (o.text.endsWith('.')) errs.push(`${o.id}: a megfigyelés ne végződjön ponttal, a motor teszi hozzá.`);
    }
  });

  for (const it of c.ints) {
    dup(it.id);
    if (/["']/.test(it.text)) errs.push(`${it.id}: egyenes idézőjel a szövegben.`);
    if (it.text.endsWith('.')) errs.push(`${it.id}: az értelmezés ne végződjön ponttal.`);
  }
  (Object.keys(b.deal) as Tier[]).forEach(t => {
    const n = c.ints.filter(x => x.tier === t).length;
    if (n < b.deal[t]) errs.push(`Kevés „${t}” értelmezés: ${n} < ${b.deal[t]}`);
  });

  for (const r of c.notes.repeat) {
    if (!ids.has(r.obs) || !ids.has(r.ifReported)) errs.push(`Ismétlés-jegyzet ismeretlen megfigyelésre hivatkozik: ${r.obs}/${r.ifReported}`);
  }
  return errs;
}
