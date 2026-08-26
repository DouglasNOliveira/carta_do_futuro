const TEMAS = [
  { grupo: "Integridade e confiança", itens: [
    ["Ética e integridade", "Fortalecer uma cultura de conduta responsável, imparcialidade e prevenção de conflitos de interesse."],
    ["Transparência ativa", "Tornar dados, decisões e resultados compreensíveis, acessíveis e úteis para toda a sociedade."],
    ["Independência técnica", "Preservar análises baseadas em evidências, com autonomia e rigor profissional."],
  ]},
  { grupo: "Cidadania e controle social", itens: [
    ["Foco no cidadão", "Orientar o controle para a qualidade dos serviços públicos e para as necessidades reais das pessoas."],
    ["Participação social", "Ampliar escuta, diálogo e canais para que a sociedade acompanhe e influencie a gestão pública."],
    ["Educação para o controle", "Aproximar conhecimento, escolas, gestores e comunidades para fortalecer a cidadania."],
  ]},
  { grupo: "Efetividade e inovação", itens: [
    ["Eficiência e resultados", "Avaliar não só a conformidade, mas o impacto e a qualidade das políticas públicas."],
    ["Inovação responsável", "Usar dados, tecnologia e inteligência artificial com segurança, transparência e propósito público."],
    ["Atuação preventiva", "Antecipar riscos e orientar gestores antes que problemas se transformem em prejuízos."],
  ]},
  { grupo: "Futuro sustentável", itens: [
    ["Sustentabilidade", "Incorporar critérios ambientais, sociais e de longo prazo nas decisões e no controle."],
    ["Equidade e inclusão", "Contribuir para políticas públicas que reduzam desigualdades e atendam todas as pessoas."],
    ["Cooperação institucional", "Integrar instituições e níveis de governo para soluções públicas mais consistentes."],
  ]},
];

const limite = 5;
const form = document.querySelector("#carta-form");
const temasEl = document.querySelector("#temas");
const contador = document.querySelector("#contador");
const erro = document.querySelector("#erro");
const botao = document.querySelector("#gerar");
const areaForm = document.querySelector("#formulario-area");
const carregando = document.querySelector("#carregando");
const resultado = document.querySelector("#resultado");
const textoCarta = document.querySelector("#texto-carta");

function renderizarTemas() {
  TEMAS.forEach(({ grupo, itens }) => {
    const fieldset = document.createElement("fieldset");
    fieldset.innerHTML = `<legend>${grupo}</legend>`;
    itens.forEach(([titulo, descricao]) => {
      const label = document.createElement("label");
      label.className = "opcao";
      label.innerHTML = `<input type="checkbox" name="tema" value="${titulo}" data-descricao="${descricao}"><span><strong>${titulo}</strong><small>${descricao}</small></span>`;
      label.querySelector("input").addEventListener("change", atualizarContador);
      fieldset.append(label);
    });
    temasEl.append(fieldset);
  });
}
function selecionados() { return [...document.querySelectorAll('input[name="tema"]:checked')]; }
function atualizarContador() {
  const marcados = selecionados();
  contador.textContent = `${marcados.length} / ${limite}`;
  document.querySelectorAll('input[name="tema"]').forEach((el) => { el.disabled = marcados.length >= limite && !el.checked; });
}
const frases = ["Conectando com o futuro…", "Organizando escolhas para o controle público…", "Escrevendo sua carta…"];
let intervalo;
function iniciarCarregamento() { let i = 0; carregando.querySelector("p").textContent = frases[0]; intervalo = setInterval(() => { i = (i + 1) % frases.length; carregando.querySelector("p").textContent = frases[i]; }, 1700); areaForm.querySelector("form").classList.add("escondido"); carregando.classList.remove("escondido"); }
function pararCarregamento() { clearInterval(intervalo); carregando.classList.add("escondido"); areaForm.querySelector("form").classList.remove("escondido"); }

form.addEventListener("submit", async (event) => {
  event.preventDefault(); erro.textContent = "";
  const escolhas = selecionados();
  if (!escolhas.length) { erro.textContent = "Escolha ao menos uma prioridade."; return; }
  if (!window.CARTA_API_URL || window.CARTA_API_URL.startsWith("COLE_")) { erro.textContent = "A aplicação ainda não foi conectada à API segura."; return; }
  const payload = { nome: document.querySelector("#nome").value.trim(), temas: escolhas.map((el) => ({ titulo: el.value, descricao: el.dataset.descricao })) };
  botao.disabled = true; iniciarCarregamento();
  try {
    const response = await fetch(`${window.CARTA_API_URL.replace(/\/$/, "")}/api/gerar-carta`, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível gerar a carta.");
    textoCarta.textContent = data.carta; resultado.classList.remove("escondido"); resultado.scrollIntoView({ behavior:"smooth", block:"start" });
  } catch (e) { erro.textContent = e.message === "Failed to fetch" ? "Não foi possível conectar à API agora. Tente novamente em instantes." : e.message; }
  finally { pararCarregamento(); botao.disabled = false; }
});
document.querySelector("#reiniciar").addEventListener("click", () => { resultado.classList.add("escondido"); form.reset(); atualizarContador(); document.querySelector("#nome").focus(); });
document.querySelector("#copiar").addEventListener("click", async () => { await navigator.clipboard.writeText(textoCarta.textContent); document.querySelector("#copiar").textContent = "Carta copiada"; setTimeout(() => document.querySelector("#copiar").textContent = "Copiar carta", 1800); });
renderizarTemas();

