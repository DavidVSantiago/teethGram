# 🦷 Teethgram — Sistema de Geração de Histogramas Dentários

> **Versão:** 2.0 Beta  
> **Licença:** Todos os direitos reservados.  
> **Acesso Web:** [Teethgram Online](https://algol.dev/tools/teethgram/)

---

## 📌 1. Visão Geral do Projeto

O **Teethgram** é uma ferramenta web de apoio à pesquisa, gestão e prática clínica na área de Odontologia e Saúde Bucal Coletiva. O sistema permite que pesquisadores e gestores registrem e distribuam visualmente os componentes da experiência de cárie dentária — através dos índices epidemiológicos **CPO-D** (dentes permanentes) e **ceo-d** (dentes decíduos) — organizando e gerando histogramas ilustrativos de forma automatizada.

O projeto foi idealizado e desenvolvido através da colaboração entre o Departamento de Ciência e Tecnologia (DCT), o projeto de extensão **Programa Sorrir** e o Grupo de Pesquisa **Saúde Bucal Coletiva (UESB/CNPq)**, vinculado ao Departamento de Saúde I (DSI) da **Universidade Estadual do Sudoeste da Bahia (UESB)**.

---

## 🛠️ 2. Tecnologias Utilizadas

- **HTML5 Semântico:** Estruturação acessível seguindo as diretrizes WCAG.
- **CSS3 Moderno:** Utilização de CSS Nesting (aninhamento), CSS Variables, layout responsivo com Grid/Flexbox e suporte nativo a Temas (Claro/Escuro).
- **JavaScript ES6+ (Modular):** Código orientado a objetos usando Modules (`import`/`export`), classes nativas e sem o uso de frameworks pesados para garantir performance e leveza.
- **SheetJS (`xlsx.full.min.js`):** Processamento e parsing de planilhas Excel diretamente no cliente (browser).
- **Canvas API:** Renderização dinâmica e exportação dos gráficos e histogramas em alta resolução.

---

## 🏗️ 3. Padrões de Arquitetura e Código

O código foi reestruturado e refatorado seguindo boas práticas de engenharia de software para garantir facilidade de manutenção, legibilidade e extensibilidade.

### 🧩 Arquitetura de Software

1. **Separação de Responsabilidades (SOC):**
   - **Controllers:** Gerenciamento do fluxo de entrada de dados e envio para processamento.
   - **Services:** Regras de negócio, mapeamento de índices odontológicos e manipulação/validação de planilhas Excel.
   - **UI:** Componentes de renderização dinâmica de formulários, controle visual de zoom, temas e gerenciamento de feedbacks/modais.
2. **Internacionalização (i18n):**
   - Centralizada na pasta `json/dicionario.json` e orquestrada pelo `I18nManager.js`, fornecendo suporte multilíngue (Português BR e Inglês) para termos odontológicos e mensagens de validação.
3. **Documentação Restrita (JSDoc):**
   - Manutenção rigorosa do padrão JSDoc em todas as funções e módulos JavaScript, garantindo tipagem clara e fácil legibilidade do código.

### ⚙️ Padrões de Estilização e Interface

- **Arquitetura modular de estilos:** Separação clara de responsabilidades no layout entre a visualização desktop (`style.css`) e os ajustes de responsabilidade mobile (`style-phone.css`).
- **CSS Nesting (W3C Standard):** Redução de redundância de código e otimização da manutenção utilizando o aninhamento nativo de seletores.
- **Sistemas de Temas e Cores:** Alternância de temas dinâmicos orientada por variáveis de ambiente CSS, preservando a acessibilidade e o contraste visual exigidos pelas diretrizes WCAG.

---

## 📁 4. Estrutura de Arquivos

```text
teethgram/
├── assets/
│   ├── imagens/                # Vetores, ícones SVG e identidades visuais
│   └── planilhas/              # Modelos de planilha base (.xlsx em PT-BR e EN)
├── css/
│   ├── style-phone.css         # Adaptações responsivas para telas menores (<= 600px)
│   └── style.css               # Estilos globais, temas e regras com CSS Nesting
├── js/
│   ├── controllers/
│   │   └── FormController.js   # Controle dos eventos e submissão dos formulários
│   ├── services/
│   │   ├── DentesService.js    # Regras e mapeamento dos dentes e arcos (FDI/ADA)
│   │   └── PlanilhaService.js  # Importação, leitura e validação das planilhas
│   ├── ui/
│   │   ├── FormRenderer.js     # Construção dinâmica dos inputs dos dentes
│   │   ├── GraficoOdontologico.js # Renderizador dos histogramas via Canvas
│   │   ├── ThemeManager.js     # Gerenciador de alternância do tema Claro/Escuro
│   │   ├── UIFeedback.js       # Controle de exibição do modal de erros/avisos
│   │   ├── ViewManager.js      # Orquestrador principal da exibição da UI
│   │   └── ZoomManager.js      # Gerenciador da escala e acessibilidade visual
│   ├── Application.js          # Ponto de entrada da aplicação (Bootstrap)
│   └── I18nManager.js          # Gerenciador de troca e carregamento de idiomas
├── json/
│   └── dicionario.json         # Chaves de tradução multilíngue
├── index.html                  # Interface estrutural em HTML5 semântico
└── README.md                   # Documentação do projeto
```

---

## 👨‍💻 5. Autores e Créditos

- **Idealizadores:**
  - Prof. Dr. Manoelito Ferreira Silva Júnior
  - Profa. Dra. Marília Jesus Batista de Brito Mota
  - Prof. Dr. Haroldo José Mendes
- **Desenvolvedores / Programadores:**
  - Dominique Muniz da Silva
  - Eduardo Caetano de Souza Júnior
  - William Souza Almeida
- **Orientador:**
  - Prof. Me. Almir David Valente Santiago

---

## 📄 6. Como Citar este Trabalho

Se você utilizar o **Teethgram** em sua pesquisa ou projeto acadêmico, utilize a seguinte citação:

> Silva-Júnior M. F., Brito-Mota M. J. B., Mendes H. J., Silva D. M., Souza-Júnior E. C., Santiago A. D. V. **TeethGram**. Jequié, 17 de Setembro de 2025. Disponível em: <https://algol.dev/tools/teethgram/>.
