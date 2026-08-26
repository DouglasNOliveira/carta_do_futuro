const MAX_TEMAS = 5;
const MAX_NOME = 60;
const TEMAS_PERMITIDOS = new Map([
  ["Ética e integridade", "Fortalecer uma cultura de conduta responsável, imparcialidade e prevenção de conflitos de interesse."],
  ["Transparência ativa", "Tornar dados, decisões e resultados compreensíveis, acessíveis e úteis para toda a sociedade."],
  ["Independência técnica", "Preservar análises baseadas em evidências, com autonomia e rigor profissional."],
  ["Foco no cidadão", "Orientar o controle para a qualidade dos serviços públicos e para as necessidades reais das pessoas."],
  ["Participação social", "Ampliar escuta, diálogo e canais para que a sociedade acompanhe e influencie a gestão pública."],
  ["Educação para o controle", "Aproximar conhecimento, escolas, gestores e comunidades para fortalecer a cidadania."],
  ["Eficiência e resultados", "Avaliar não só a conformidade, mas o impacto e a qualidade das políticas públicas."],
  ["Inovação responsável", "Usar dados, tecnologia e inteligência artificial com segurança, transparência e propósito público."],
  ["Atuação preventiva", "Antecipar riscos e orientar gestores antes que problemas se transformem em prejuízos."],
  ["Sustentabilidade", "Incorporar critérios ambientais, sociais e de longo prazo nas decisões e no controle."],
  ["Equidade e inclusão", "Contribuir para políticas públicas que reduzam desigualdades e atendam todas as pessoas."],
  ["Cooperação institucional", "Integrar instituições e níveis de governo para soluções públicas mais consistentes."],
]);

function json(body, status = 200, origin = "") {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": origin, "vary": "Origin" } });
}
function origemPermitida(request, env) {
  const origin = request.headers.get("Origin") || "";
  return origin === env.ALLOWED_ORIGIN ? origin : "";
}
export default {
  async fetch(request, env) {
    const origin = origemPermitida(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: origin ? 204 : 403, headers: origin ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", "vary": "Origin" } : {} });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/api/gerar-carta") return json({ error: "rota não encontrada" }, 404, origin);
    if (!origin) return json({ error: "origem não autorizada" }, 403);
    if (!env.AZURE_API_KEY || !env.AZURE_ENDPOINT || !env.AZURE_OPENAI_API_VERSION) return json({ error: "serviço de geração não configurado" }, 503, origin);

    let body;
    try { body = await request.json(); } catch { return json({ error: "dados inválidos" }, 400, origin); }
    const nome = typeof body.nome === "string" ? body.nome.trim().slice(0, MAX_NOME) : "";
    const temas = Array.isArray(body.temas) ? body.temas.slice(0, MAX_TEMAS) : [];
    const nomeValido = /^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(nome);
    const temasValidos = temas.length && new Set(temas.map((tema) => tema?.titulo)).size === temas.length && temas.every((tema) => TEMAS_PERMITIDOS.get(tema?.titulo) === tema?.descricao);
    if (!nomeValido || !temasValidos) return json({ error: "informe um nome válido e ao menos uma prioridade" }, 400, origin);

    const prioridades = temas.map((tema) => `- ${tema.titulo}: ${tema.descricao}`).join("\n");
    const instructions = `Você redige cartas institucionais em português brasileiro para a experiência "Carta do Futuro" do Tribunal de Contas do Estado do Paraná (TCE-PR). Produza somente o texto da carta, sem título Markdown, sem listas e sem explicar que é IA. Comece exatamente com "Olá, ${nome}. Escrevo de 2046". Escreva entre 350 e 500 palavras, em 5 a 7 parágrafos curtos, com tom humano, esperançoso, sóbrio e mobilizador. Trate as prioridades como compromissos desejados, nunca como fatos presentes. Não invente programas, leis, números, autoridades, decisões ou realizações do TCE-PR. Não faça promessas institucionais nem partidárias. Valorize integridade, transparência, independência técnica, cidadania, prevenção, qualidade do gasto público e cooperação. Termine exatamente com:\n\nCom gratidão e responsabilidade,\n\nVocê (e o Paraná que ajudamos a cuidar), em 2046.`;
    try {
      const deployment = encodeURIComponent(env.MODELOGPT || "gpt-4o-mini");
      const endpoint = `${env.AZURE_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(env.AZURE_OPENAI_API_VERSION)}`;
      const azure = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json", "api-key": env.AZURE_API_KEY }, body: JSON.stringify({ messages: [{ role: "system", content: instructions }, { role: "user", content: `Prioridades selecionadas pela pessoa:\n${prioridades}` }], max_tokens: 900, temperature: 0.7, top_p: 0.95 }) });
      if (!azure.ok) { console.error("Azure OpenAI", azure.status); return json({ error: "não foi possível gerar a carta agora" }, 502, origin); }
      const carta = (await azure.json()).choices?.[0]?.message?.content?.trim() || "";
      if (!carta) return json({ error: "não foi possível gerar a carta agora" }, 502, origin);
      return json({ carta }, 200, origin);
    } catch (error) { console.error(error); return json({ error: "não foi possível gerar a carta agora" }, 502, origin); }
  },
};
