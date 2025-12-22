/*************************************************************************************** */
/** CONFIGURAÇÕES GLOBAIS (ARRAYS & VARIÁVEIS DE ESTADO) */
/*************************************************************************************** */

// Variáveis de estado para controlar atualizações e evitar recargas desnecessárias
let ultimoIndiceCarregado = "";
let ultimaDistribuicaoCarregada = "";

/* --- SISTEMA PERMANENTE (CPO-D) --- */

// Códigos FDI (Permanentes)
const FDI_PERMANENTE = [
    "18", "17", "16", "15", "14", "13", "12", "11", // Sup. Direito (18-11)
    "21", "22", "23", "24", "25", "26", "27", "28", // Sup. Esquerdo (21-28)
    "31", "32", "33", "34", "35", "36", "37", "38", // Inf. Esquerdo (31-38)
    "41", "42", "43", "44", "45", "46", "47", "48" // Inf. Direito (41-48)
];

// Códigos ADA Equivalentes (Permanentes)
const ADA_PERMANENTE = [
    "1",  "2",  "3",  "4",  "5",  "6",  "7",  "8", // Sup. Direito
    "9",  "10", "11", "12", "13", "14", "15", "16", // Sup. Esquerdo
    "24", "23", "22", "21", "20", "19", "18", "17", // Inf. Esquerdo
    "25", "26", "27", "28", "29", "30", "31", "32" // Inf. Direito
];

/* --- SISTEMA DECÍDUO (ceo-d) --- */

// Códigos FDI (Decíduos)
const FDI_DECIDUO = [
    "55", "54", "53", "52", "51", // Sup. Direito (55-51)
    "61", "62", "63", "64", "65", // Sup. Esquerdo (61-65)
    "71", "72", "73", "74", "75", // Inf. Esquerdo (71-75)
    "81", "82", "83", "84", "85" // Inf. Direito (81-85)
];

// Códigos ADA Equivalentes (Decíduos)
const ADA_DECIDUO = [
    "A",  "B",  "C",  "D",  "E", // Sup. Direito
    "F",  "G",  "H",  "I",  "J", // Sup. Esquerdo
    "O",  "N",  "M",  "L",  "K", // Inf. Esquerdo
    "P",  "Q",  "R",  "S",  "T" // Inf. Direito
];

/*************************************************************************************** */
/** FUNÇÃO DE GERAÇÃO DO FORMULÁRIO */
/*************************************************************************************** */

/**
 * Configura o estado inicial da aplicação ao carregar a página.
 * Responsável por renderizar o formulário inicial e vincular as funções de atualização
 * aos inputs de controle (Índice, Distribuição e Classificação).
 */
document.addEventListener('DOMContentLoaded', function() {
    gerarFormulario();

    // Adiciona ouvintes de evento (Listeners)
    document.getElementById('indexSelect').addEventListener('change', gerarFormulario);
    document.getElementById('distSelect').addEventListener('change', gerarFormulario);
    document.getElementById('toothClassificationSelect').addEventListener('change', atualizarClassificacaoDente);
});


/**
 * Carrega e injeta o template HTML do formulário correspondente às opções selecionadas.
 * Realiza uma requisição assíncrona (`fetch`) e utiliza `DOMParser` para renderizar
 * o conteúdo dentro do container principal, prevenindo recargas se os parâmetros não tiverem mudado.
 * @returns {void}
 */
function gerarFormulario(){
    const containerFormulario = document.querySelector('#form-container');
    const indiceSelectInput = document.getElementById('indexSelect');
    const distribuicaoSelectInput = document.getElementById('distSelect');

    // Obter e normalizar valores do usuário
    let indiceSelecionado = indiceSelectInput.value.toLowerCase().trim();
    let valorDistribuicao = distribuicaoSelectInput.value.toLowerCase().trim();

    // Verificação de Estado: Se nada mudou, não recarrega
    if (indiceSelecionado === ultimoIndiceCarregado && valorDistribuicao === ultimaDistribuicaoCarregada) return;

    // Atualiza as variáveis de estado, para a próxima alteração
    ultimoIndiceCarregado = indiceSelecionado;
    ultimaDistribuicaoCarregada = valorDistribuicao;

    // Determinar o caminho do arquivo
    let caminhoArquivoHtml = obterCaminhoArquivoHtml(indiceSelecionado, valorDistribuicao);

    if (!caminhoArquivoHtml) {
        containerFormulario.innerHTML = "<p>Configuração não encontrada para esta opção.</p>";
        return;
    }

    // Buscar e Injetar HTML
    fetch(caminhoArquivoHtml)
        .then(function (resposta) {
            if (resposta.ok) {
                return resposta.text();
            } else {
                throw new Error('Erro na resposta da rede');
            }
        })
        .then(function (conteudoHtml) {
            const analisadorDom = new DOMParser();
            const documentoAnalisado = analisadorDom.parseFromString(conteudoHtml, 'text/html');
            
            // Injeta apenas o conteúdo do body
            containerFormulario.innerHTML = documentoAnalisado.body.innerHTML;

            // Atualiza a Classificação dos Dentes
            atualizarClassificacaoDente();
        })
        .catch(function (erro) {
            console.error(erro);
            containerFormulario.innerHTML = "<p style='color:red'>Erro ao carregar formulário.</p>";
        });
}

/*************************************************************************************** */
/** FUNÇÃO AUXILIARES */
/*************************************************************************************** */

/**
 * Resolve o caminho do arquivo de template HTML com base no índice e modo de distribuição selecionados.
 * @param {string} tipoIndice - O tipo de índice selecionado (ex: 'cpo-d', 'ceo-d').
 * @param {string} tipoDistribuicao - O modo de distribuição (ex: 'total', 'total_componente').
 * @returns {string|null} O caminho relativo do arquivo HTML ou `null` se a combinação for inválida.
 */
function obterCaminhoArquivoHtml(tipoIndice, tipoDistribuicao) {
    // Verifica se a distribuição requer a visão por Componente
    let ehVisualizacaoPorComponente = false;
    if (tipoDistribuicao.includes('componente')) {
        ehVisualizacaoPorComponente = true;
    }

    // Lógica para CPO-D (Permanente)
    if (tipoIndice === 'cpo-d') {
        if (ehVisualizacaoPorComponente) {
            return './formularios/cpod_por_comp.html';
        } else {
            return './formularios/cpod_total.html';
        }
    }

    // Lógica para ceo-d (Decíduo)
    if (tipoIndice === 'ceo-d') {
        if (ehVisualizacaoPorComponente) {
            return './formularios/ceod_por_comp.html';
        } else {
            return './formularios/ceod_total.html';
        }
    }

    return null;
}

/**
 * Sincroniza a numeração dos dentes na tela com a classificação selecionada (FDI/ADA).
 * Responsável por atualizar o texto visual, bem como os identificadores semânticos 
 * (`id`, `name`) e de acessibilidade (`for`) de todos os inputs e labels.
 * @returns {void}
 */
function atualizarClassificacaoDente() {
    const classificacaoDenteSelectInput = document.getElementById('toothClassificationSelect');

    let valorClassificacaoDente = classificacaoDenteSelectInput.value.toLowerCase(); // 'fdi' ou 'ada'

    // Seleciona todos os containers de dentes
    const elementosDente = document.querySelectorAll('.tooth, .tooth-component');

    // Percorre cada dente na tela
    elementosDente.forEach(function (elementoDente) {
        processarUnicoDente(elementoDente, valorClassificacaoDente);
    });
}

/**
 * Processa a conversão de um único componente de dente (Card).
 * Utiliza os arrays globais para traduzir o número original para o valor de exibição
 * (ADA ou FDI).
 * @param {HTMLElement} elementoDente - O elemento DOM container do dente.
 * @param {string} valorClassificacaoDente - O modo de classificação selecionado ('fdi' ou 'ada').
 * @returns {void}
 */
function processarUnicoDente(elementoDente, valorClassificacaoDente) {
    let idElemento = elementoDente.id;
    let numeroDente = idElemento.replace('tooth-', '');

    // Determina o valor a ser exibido
    let valorExibicao = numeroDente;

    if (valorClassificacaoDente === 'ada') {
        // Tenta encontrar nos Permanentes
        let indiceArray = FDI_PERMANENTE.indexOf(numeroDente);
        
        if (indiceArray !== -1) {
            valorExibicao = ADA_PERMANENTE[indiceArray];
        } else {
            // Se não achou, tenta nos Decíduos
            indiceArray = FDI_DECIDUO.indexOf(numeroDente);
            if (indiceArray !== -1) {
                valorExibicao = ADA_DECIDUO[indiceArray];
            }
        }
    }

    // Atualiza Texto Visual (Label ou Header)
    const elementoTextoRotulo = elementoDente.querySelector('.tooth-number, .tooth-header');
    if (elementoTextoRotulo) {
        elementoTextoRotulo.textContent = valorExibicao;
    }

    // Atualiza Inputs (ID e Name)
    const listaInputs = elementoDente.querySelectorAll('input');
    listaInputs.forEach(function (elementoInput) {
        substituirValorAtributo(elementoInput, 'id', numeroDente, valorExibicao);
        substituirValorAtributo(elementoInput, 'name', numeroDente, valorExibicao);
    });

    // Atualiza Labels (Atributo For)
    const listaLabels = elementoDente.querySelectorAll('label');
    listaLabels.forEach(function (elementoLabel) {
        substituirValorAtributo(elementoLabel, 'for', numeroDente, valorExibicao);
    });
}

/**
 * Utilitário para realizar a substituição segura de substrings em atributos HTML.
 * Verifica se o atributo especificado existe e se contém o termo antigo antes de efetuar a troca,
 * prevenindo erros em elementos que podem não ter determinados atributos definidos.
 * @param {HTMLElement} elemento - O elemento DOM alvo da modificação.
 * @param {string} nomeAtributo - O nome do atributo a ser alterado (ex: 'id', 'name', 'for').
 * @param {string} valorAntigo - O trecho de texto atual que deve ser localizado e removido.
 * @param {string} valorNovo - O novo texto que será inserido no lugar.
 * @returns {void}
 */
function substituirValorAtributo(elemento, nomeAtributo, valorAntigo, valorNovo) {
    let valorAtributoAtual = elemento.getAttribute(nomeAtributo);
    
    if (valorAtributoAtual && valorAtributoAtual.includes(valorAntigo)) {
        let novoValorAtributo = valorAtributoAtual.replace(valorAntigo, valorNovo);
        elemento.setAttribute(nomeAtributo, novoValorAtributo);
    }
}