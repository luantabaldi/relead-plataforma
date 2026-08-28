// Backfill de leads_reativacao.corretor_id_cvcrm a partir do CV CRM.
// -----------------------------------------------------------------------------
// Hoje a coluna está 100% NULL. Este script lê cada lead pendente no Supabase,
// consulta o CV CRM por lead_id_cvcrm e grava o idcorretor de volta.
//
// Uso (NÃO commitar as chaves — passe por env):
//   SB_URL=https://reqlxhvjrqqfksrxifwl.supabase.co \
//   SB_SERVICE_ROLE_KEY=... \
//   CVCRM_EMAIL=integracao@symimoveis.com.br \
//   CVCRM_TOKEN=... \
//   node scripts/backfill-corretor-id.mjs
//
// CV CRM: GET https://integracao.cvcrm.com.br/api/v1/comercial/leads?email=..&token=..
//   -> campos usados: id (idlead), idcorretor
// -----------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";

const { SB_URL, SB_SERVICE_ROLE_KEY, CVCRM_EMAIL, CVCRM_TOKEN } = process.env;
if (!SB_URL || !SB_SERVICE_ROLE_KEY || !CVCRM_EMAIL || !CVCRM_TOKEN) {
  console.error("Faltam envs: SB_URL, SB_SERVICE_ROLE_KEY, CVCRM_EMAIL, CVCRM_TOKEN");
  process.exit(1);
}

const db = createClient(SB_URL, SB_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CV_BASE = "https://integracao.cvcrm.com.br/api/v1";
const DRY_RUN = process.argv.includes("--dry-run");

// Opção A (recomendada): baixar TODOS os leads do CV uma vez e montar um mapa
// idlead -> idcorretor. Ajuste a paginação conforme a doc da sua conta.
async function carregarMapaCorretores() {
  const mapa = new Map();
  let pagina = 1;
  for (;;) {
    const url = `${CV_BASE}/comercial/leads?email=${encodeURIComponent(CVCRM_EMAIL)}` +
      `&token=${encodeURIComponent(CVCRM_TOKEN)}&pagina=${pagina}&registros=500`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`CV CRM ${r.status}: ${await r.text()}`);
    const body = await r.json();
    const leads = Array.isArray(body) ? body : (body.leads ?? body.data ?? []);
    if (!leads.length) break;
    for (const l of leads) {
      const id = String(l.id ?? l.idlead);
      const idcorretor = l.idcorretor ?? l.corretor?.id ?? null;
      if (id && idcorretor) mapa.set(id, String(idcorretor));
    }
    console.log(`CV página ${pagina}: ${leads.length} leads (mapa: ${mapa.size})`);
    pagina++;
  }
  return mapa;
}

async function main() {
  const mapa = await carregarMapaCorretores();

  const { data: leads, error } = await db
    .from("leads_reativacao")
    .select("id, lead_id_cvcrm")
    .is("corretor_id_cvcrm", null)
    .not("lead_id_cvcrm", "is", null);
  if (error) throw error;

  console.log(`${leads.length} leads sem corretor no Supabase`);
  let ok = 0, semMatch = 0;

  for (const lead of leads) {
    const idcorretor = mapa.get(String(lead.lead_id_cvcrm));
    if (!idcorretor) { semMatch++; continue; }
    if (DRY_RUN) { ok++; continue; }
    const { error: upErr } = await db
      .from("leads_reativacao")
      .update({ corretor_id_cvcrm: idcorretor })
      .eq("id", lead.id);
    if (upErr) { console.error(lead.id, upErr.message); continue; }
    ok++;
  }

  console.log(`\nAtualizados: ${ok} | Sem correspondência no CV: ${semMatch}`);
  console.log(DRY_RUN ? "(dry-run — nada gravado)" : "Feito.");

  // Propaga para conversas_ia por telefone
  if (!DRY_RUN) {
    const { error: e2 } = await db.rpc("noop"); // placeholder
    void e2;
    console.log("Rode agora o UPDATE de conversas_ia por telefone (ver migration §5).");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
