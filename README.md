# Carta do Futuro — TCE-PR

Aplicação de escuta ativa que permite à pessoa selecionar prioridades para o futuro do controle externo e receber uma carta personalizada, escrita a partir de 2046.

## Arquitetura

- `public/`: site estático para publicar no GitHub Pages.
- `worker/`: API Cloudflare Worker. Ela guarda a chave do Azure OpenAI e chama a API Chat Completions; essa chave nunca chega ao navegador ou ao GitHub.

O GitHub Pages **não executa código de servidor**. Por isso, a API precisa ser publicada separadamente (este projeto usa Cloudflare Workers) e o endereço dela é informado no arquivo público `public/api-config.js`.

## Publicar o site no GitHub Pages

1. Suba este repositório ao GitHub.
2. Em **Settings → Pages**, escolha **GitHub Actions** como fonte de publicação. O workflow já publica exclusivamente a pasta `public/`.
3. Após publicar o Worker, troque `COLE_AQUI...` em `public/api-config.js` pela URL dele, por exemplo: `https://carta-do-futuro-tce-pr.seu-subdominio.workers.dev`.

## Publicar a API no Cloudflare Workers

Instale o Wrangler e faça login:

```bash
npm install -g wrangler
wrangler login
```

No diretório `worker`, informe a origem definitiva do GitHub Pages e o endpoint do seu recurso Azure em `wrangler.toml`. O valor de `MODELOGPT` é o **nome do deployment no Azure**; se ele tiver sido criado com esse nome, mantenha `gpt-4o-mini`. Depois publique e cadastre a chave:

```bash
wrangler deploy
wrangler secret put AZURE_API_KEY
```

O comando pedirá a chave interativamente; não a coloque em arquivos, commits, nem em `api-config.js`. Para testes locais, crie `worker/.dev.vars` com `AZURE_API_KEY=...` (o arquivo já está no `.gitignore`) e execute `wrangler dev`.

O Worker usa o deployment Azure `gpt-4o-mini` e a API Chat Completions, mantendo as respostas curtas e institucionais. Os nomes das variáveis espelham o projeto `classificacoesRAG`: `AZURE_ENDPOINT`, `AZURE_API_KEY`, `AZURE_OPENAI_API_VERSION` e `MODELOGPT`.

## Personalização

Os temas e descrições do formulário ficam em `public/app.js`; as regras editoriais ficam em `worker/src/index.js`. Ajuste-os juntos quando quiser mudar o conteúdo da carta.
