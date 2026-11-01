import { readStore } from '@/lib/store'; import { ok } from '@/lib/http';
export async function GET(){
  const s=await readStore(),rows=s.complaints.filter(c=>c.isPublic),total=rows.length;
  const count=(fn:(x:typeof rows[number])=>boolean)=>rows.filter(fn).length;
  const byCategory=s.departments.map(d=>({name:d.category.replace('_',' '),value:count(c=>c.category===d.category)})).filter(x=>x.value>0);
  const byWard=s.wards.map(w=>({name:w.name.replace('Ward ','W'),value:count(c=>c.wardId===w.id)}));
  return ok({total,pending:count(c=>!['resolved','verified','rejected'].includes(c.status)),resolved:count(c=>['resolved','verified'].includes(c.status)),critical:count(c=>c.severity==='critical'),resolutionRate:total?Math.round(count(c=>['resolved','verified'].includes(c.status))/total*100):0,byCategory,byWard});
}
