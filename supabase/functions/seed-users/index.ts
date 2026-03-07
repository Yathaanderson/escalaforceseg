import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const users = [
    { email: "admin@escala.com", password: "admin123", nome: "Administrador", role: "admin" as const },
    { email: "carlos@escala.com", password: "123456", nome: "Carlos Silva", role: "funcionario" as const },
    { email: "maria@escala.com", password: "123456", nome: "Maria Santos", role: "funcionario" as const },
  ];

  const results = [];

  for (const u of users) {
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu) => eu.email === u.email);
    
    if (existing) {
      results.push({ email: u.email, status: "already exists", id: existing.id });
      continue;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { nome: u.nome },
    });

    if (error) {
      results.push({ email: u.email, status: "error", error: error.message });
      continue;
    }

    // Update profile
    await supabaseAdmin.from("profiles").update({
      nome: u.nome,
      funcao: u.role === "admin" ? "Administrador" : "Vigilante",
      cpf: u.role === "admin" ? "" : u.email === "carlos@escala.com" ? "123.456.789-00" : "987.654.321-00",
      telefone: u.role === "admin" ? "" : u.email === "carlos@escala.com" ? "(11) 99999-1234" : "(11) 98888-5678",
    }).eq("id", data.user.id);

    // Set role
    await supabaseAdmin.from("user_roles").insert({
      user_id: data.user.id,
      role: u.role,
    });

    results.push({ email: u.email, status: "created", id: data.user.id });
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
