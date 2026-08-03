<div align="center">

# 📊 Armani Processor

**Conversor de tabelas de medidas da Armani para o formato de importação da Sizebay.**

Envie o CSV bruto, receba o CSV normalizado — medidas traduzidas do italiano, faixas separadas em início/fim, números padronizados e gênero e faixa de idade deduzidos dos códigos internos.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

[**🔗 Acessar a ferramenta**](https://armani-processor.vercel.app)

</div>

---

## 📖 Sobre o projeto

As tabelas de medidas que chegam da Armani vêm no formato interno deles: cabeçalhos de medida em italiano, faixas escritas como `88 - 92`, decimais com vírgula e sufixo `cm`, e o gênero e a faixa de idade escondidos em códigos numéricos. Nada disso é aceito direto na importação da Sizebay.

Traduzir na mão, planilha por planilha, é lento e propenso a erro silencioso — um decimal com vírgula que passa batido vira uma medida errada em produção.

O **Armani Processor** faz a conversão inteira em um passo: um clique, um upload, e o `output.csv` já baixa pronto.

## 🔄 O que a transformação faz

### 1. Traduz os nomes das medidas

Cabeçalhos em italiano viram os nomes canônicos da Sizebay:

| Origem (italiano) | Destino |
| ----------------- | ------- |
| `torace` · `petto` · `seno` | `chest` |
| `vita` · `waist` | `waist` |
| `bacino` · `fianchi` · `hip` | `hip` |
| `sottoseno` | `underBust` |
| `spalle` | `shoulderWidth` |
| `int. gamba` | `insideLeg` |
| `gamba` | `thigh` |
| `altezza` | `height` |
| `lunghezza` | `insoleLength` |
| `larghezza` | `width` |
| `circonferenza` | `circumference` |
| `numero` | `bar` |

Cabeçalhos fora do mapa passam sanitizados (espaços removidos) em vez de serem descartados.

### 2. Separa faixas em duas colunas

`88 - 92` vira `ini = 88` e `fin = 92`. Aceita hífen, en dash e em dash. Valor único vira `ini = fin`.

### 3. Normaliza números

Padroniza para ponto decimal e remove ruído — trata `1.234,5`, `92,5`, `92.5`, `92 cm` e `92"`, sempre devolvendo o número limpo.

### 4. Deduz gênero e faixa de idade dos códigos

| Código de gênero | Gênero |
| ---------------- | ------ |
| `B` · `M` | `male` |
| `G` · `W` | `female` |
| `J` · `U` | `unisex` |

| Códigos presentes | Faixa de idade |
| ----------------- | -------------- |
| `93` · `96` · `99` | `kids` |
| `30` · `60` · `90` | `adult` |

### 5. Classifica a categoria

`SIZEGRID_LVL2` contendo `SHOES` → `shoe`; caso contrário → `clothes`.

### 6. Descarta acessórios

Linhas cujo `TGL_FILTER_CODE` contém `ACC` são puladas — acessórios não têm tabela de medidas.

## ✨ Funcionalidades

- 📤 **Upload de um clique** — sem formulário, sem configuração
- ⚙️ **Processamento no servidor** — Route Handler do Next.js, arquivos grandes sem travar o navegador
- ⬇️ **Download automático** — o `output.csv` baixa sozinho quando termina
- 🔄 **Indicador de carregamento** durante o processamento
- ♻️ **Reenvio do mesmo arquivo** — o input é limpo após cada envio

## 🛠️ Stack

| Tecnologia | Versão | Uso |
| ---------- | ------ | --- |
| [Next.js](https://nextjs.org/) | 16 | Framework React + Route Handler |
| [React](https://react.dev/) | 19 | Biblioteca de UI |
| [TypeScript](https://www.typescriptlang.org/) | 5 | Tipagem estática |
| [csv-parse](https://csv.js.org/parse/) | 6 | Leitura do CSV de entrada |
| [csv-stringify](https://csv.js.org/stringify/) | 6 | Escrita do CSV de saída |

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm, yarn, pnpm ou bun

### Instalação e execução

```bash
git clone https://github.com/Jlvieira0909/armani-processor.git
cd armani-processor
npm install

npm run dev      # desenvolvimento
npm run build    # build de produção
npm run start    # servir o build
npm run lint     # ESLint
```

Abra [http://localhost:3000](http://localhost:3000).

## 📁 Estrutura

```
armani-processor/
├── app/
│   ├── api/process/route.ts   # toda a lógica de transformação
│   ├── page.tsx               # upload + download
│   ├── layout.tsx
│   ├── styles.css
│   └── globals.css
├── next.config.ts
└── tsconfig.json
```

## 🔌 API

A rota também aceita chamada direta:

```bash
curl -X POST http://localhost:3000/api/process \
  -F "file=@tabela-armani.csv" \
  -o output.csv
```

Erros retornam `400` com `{ "error": "..." }`.

## 🧩 Projeto relacionado

O mesmo processamento existe como **extensão de Chrome**, rodando 100% offline no navegador: [**sizebay-armani-extension**](https://github.com/Jlvieira0909/sizebay-armani-extension).

Use a extensão quando o arquivo não pode sair da máquina; use esta versão web quando quiser algo sem instalação.

## 🌐 Deploy

Hospedado na [Vercel](https://vercel.com/): **[armani-processor.vercel.app](https://armani-processor.vercel.app)**

---

<div align="center">

Feito com ❤️ por [João Luiz Vieira](https://github.com/Jlvieira0909)

</div>
