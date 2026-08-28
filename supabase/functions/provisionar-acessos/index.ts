// Edge Function: provisionar-acessos
// -----------------------------------------------------------------------------
// Percorre public.usuarios_cv e garante que todo corretor ATIVO tem uma conta
// de login (auth.users). Novos -> auth.admin.inviteUserByEmail (e-mail de convite
// para o corretor definir a própria senha). Inativos no CV -> ban_duration.
//
// Gatilho recomendado: pg_cron / schedule diário, logo APÓS o sync do n8n
// (n8n: "Sync Corretores CV -> usuarios_cv"). Também pode ser chamada manualmente.
//
// Deploy:
//   supabase functions deploy provisionar-acessos --no-verify-jwt
// Secrets necessários (supabase secrets set ...):
//   SB_URL                = https://reqlxhvjrqqfksrxifwl.supabase.co
//   SB_SERVICE_ROLE_KEY   = <service_role key>   (NUNCA vai pro frontend/git)
//   PROVISION_SECRET      = <token aleatório>    (header x-provision-secret)
// -----------------------------------------------------------------------------

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SB_URL = Deno.env.get("SB_URL")!;
const SERVICE_ROLE = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const PROVISION_SECRET = Deno.env.get("PROVISION_SECRET")!;
// Para onde o link do convite redireciona (tela de definir senha no painel):
const REDIRECT_TO = Deno.env.get("INVITE_REDIRECT_TO") ??
  "https://relead-plataforma.vercel.app/definir-senha";

const admin = createClient(SB_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

Deno.serve(async (req) => {
  if (req.headers.get("x-provision-secret") !== PROVISION_SECRET) {
    return json({ error: "unauthorized" }, 401);
  }

  const resumo = { convidados: 0, reativados: 0, banidos: 0, erros: [] as string[] };

  // 1. Todos os usuários do CV
  const { data: usuarios, error } = await admin
    .from("usuarios_cv")
    .select("cvcrm_id, nome, email, papel, ativo");
  if (error) return json({ error: error.message }, 500);

  // 2. Índice das contas auth existentes por e-mail (paginado)
  const contas = new Map<string, { id: string; banned_until?: string | null }>();
  for (let page = 1; ; page++) {
    const { data, error: e } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (e) return json({ error: e.message }, 500);
    for (const u of data.users) {
      if (u.email) contas.set(u.email.toLowerCase(), { id: u.id, banned_until: (u as any).banned_until });
    }
    if (data.users.length < 1000) break;
  }

  // 3. Reconcilia
  for (const u of usuarios ?? []) {
    const email = u.email?.toLowerCase();
    if (!email) continue;
    const conta = contas.get(email);

    try {
      if (u.ativo && !conta) {
        // novo -> convite
        const { error: e } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { papel: u.papel, cvcrm_id: u.cvcrm_id, nome: u.nome },
          redirectTo: REDIRECT_TO,
        });
        if (e) throw e;
        resumo.convidados++;
      } else if (u.ativo && conta?.banned_until) {
        // voltou a ficar ativo -> desbane
        const { error: e } = await admin.auth.admin.updateUserById(conta.id, { ban_duration: "none" });
        if (e) throw e;
        resumo.reativados++;
      } else if (!u.ativo && conta && !conta.banned_until) {
        // inativo no CV -> bane (100 anos) e marca o perfil
        const { error: e } = await admin.auth.admin.updateUserById(conta.id, { ban_duration: "876000h" });
        if (e) throw e;
        await admin.from("perfis").update({ ativo: false }).eq("id", conta.id);
        resumo.banidos++;
      }
    } catch (err) {
      resumo.erros.push(`${email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return json(resumo, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}
