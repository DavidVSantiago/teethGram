/*************************************************************************************** */
/** CONFIGURAÇÕES GLOBAIS (ARRAYS & VARIÁVEIS DE ESTADO) */
/*************************************************************************************** */

// Variáveis de estado para controlar atualizações e evitar recargas desnecessárias
let ultimoIndiceCarregado = '';
let ultimaDistribuicaoCarregada = '';

/* --- SISTEMA PERMANENTE (CPO-D) --- */

// Códigos FDI (Permanentes)
const FDI_PERMANENTE = [
  '18', '17', '16', '15', '14', '13', '12', '11', // Sup. Direito (18-11)
  '21', '22', '23', '24', '25', '26', '27', '28', // Sup. Esquerdo (21-28)
  '31', '32', '33', '34', '35', '36', '37', '38', // Inf. Esquerdo (31-38)
  '41', '42', '43', '44', '45', '46', '47', '48'  // Inf. Direito (41-48)
];

// Códigos ADA Equivalentes (Permanentes)
const ADA_PERMANENTE = [
  '1',  '2',  '3',  '4',  '5',  '6',  '7',  '8',  // Sup. Direito
  '9',  '10', '11', '12', '13', '14', '15', '16', // Sup. Esquerdo
  '24', '23', '22', '21', '20', '19', '18', '17', // Inf. Esquerdo
  '25', '26', '27', '28', '29', '30', '31', '32'  // Inf. Direito
];

/* --- SISTEMA DECÍDUO (ceo-d) --- */

// Códigos FDI (Decíduos)
const FDI_DECIDUO = [
  '55', '54', '53', '52', '51', // Sup. Direito (55-51)
  '61', '62', '63', '64', '65', // Sup. Esquerdo (61-65)
  '71', '72', '73', '74', '75', // Inf. Esquerdo (71-75)
  '81', '82', '83', '84', '85'  // Inf. Direito (81-85)
];

// Códigos ADA Equivalentes (Decíduos)
const ADA_DECIDUO = [
  'A',  'B',  'C',  'D',  'E', // Sup. Direito
  'F',  'G',  'H',  'I',  'J', // Sup. Esquerdo
  'O',  'N',  'M',  'L',  'K', // Inf. Esquerdo
  'P',  'Q',  'R',  'S',  'T'  // Inf. Direito
];

/*************************************************************************************** */
/** FUNÇÃO DE GERAÇÃO DO FORMULÁRIO */
/*************************************************************************************** */

/**
 * Configura o estado inicial da aplicação ao carregar a página.
 * Responsável por renderizar o formulário inicial e vincular as funções de atualização
 * aos inputs de controle (Índice, Distribuição e Classificação).
 */
document.addEventListener('DOMContentLoaded', function () {
	gerarFormulario();

	// Adiciona ouvintes de evento (Listeners) atualizados para os novos IDs em português
	document.getElementById('selecao-indice').addEventListener('change', gerarFormulario);
	document.getElementById('selecao-distribuicao').addEventListener('change', gerarFormulario);
	document.getElementById('selecao-classificacao').addEventListener('change', atualizarClassificacaoDente);
});

/**
 * Carrega e injeta o template HTML do formulário correspondente às opções selecionadas.
 * Realiza uma requisição assíncrona (`fetch`) e renderiza o conteúdo dentro do container principal.
 * @returns {void}
 */
function gerarFormulario() {
	const containerFormulario = document.querySelector('#container-formulario');
	const indiceSelectInput = document.getElementById('selecao-indice');
	const distribuicaoSelectInput = document.getElementById('selecao-distribuicao');

	// Obter e normalizar valores do usuário
	let indiceSelecionado = indiceSelectInput.value.toLowerCase().trim();
	let valorDistribuicao = distribuicaoSelectInput.value.toLowerCase().trim();

	// Verificação de Estado: Se nada mudou, não recarrega
	if (indiceSelecionado === ultimoIndiceCarregado && valorDistribuicao === ultimaDistribuicaoCarregada)
		return;

	mudarTituloCard(indiceSelecionado);

	// Atualiza as variáveis de estado
	ultimoIndiceCarregado = indiceSelecionado;
	ultimaDistribuicaoCarregada = valorDistribuicao;

	// Determinar o caminho do arquivo
	let caminhoArquivoHtml = obterCaminhoArquivoHtml(indiceSelecionado, valorDistribuicao);

	if (!caminhoArquivoHtml) {
		containerFormulario.innerHTML ='<p>Configuração não encontrada para esta opção.</p>';
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
			const documentoAnalisado = analisadorDom.parseFromString(
				conteudoHtml,
				'text/html'
			);

			// Injeta apenas o conteúdo do body para manter a limpeza do DOM
			containerFormulario.innerHTML = documentoAnalisado.body.innerHTML;

			// Atualiza a Classificação dos Dentes (ADA/FDI) após a injeção
			atualizarClassificacaoDente();
		})
		.catch(function (erro) {
			console.error(erro);
			containerFormulario.innerHTML =
				`<p style="color:red">Erro ao carregar formulário.</p>`;
		});
}

/*************************************************************************************** */
/** FUNÇÕES AUXILIARES */
/*************************************************************************************** */

/**
 * Resolve o caminho do arquivo de template HTML com base no índice e modo de distribuição selecionados.
 * @param {string} tipoIndice - O tipo de índice selecionado (ex: 'cpo-d', 'ceo-d').
 * @param {string} tipoDistribuicao - O modo de distribuição (ex: 'total', 'componente').
 * @returns {string|null} O caminho relativo do arquivo HTML.
 */
function obterCaminhoArquivoHtml(tipoIndice, tipoDistribuicao) {
	let ehVisualizacaoPorComponente = tipoDistribuicao.includes('componente');

	if (tipoIndice === 'cpo-d') {
		return ehVisualizacaoPorComponente
			? './formularios/cpod_por_comp.html'
			: './formularios/cpod_total.html';
	}

	if (tipoIndice === 'ceo-d') {
		return ehVisualizacaoPorComponente
			? './formularios/ceod_por_comp.html'
			: './formularios/ceod_total.html';
	}

	return null;
}

/**
 * Atualiza dinamicamente o título principal da seção de acordo com o índice selecionado.
 * @param {string} indiceSelecionado - O valor do índice vindo do select ('cpo-d' ou 'ceo-d').
 * @returns {void}
 */
function mudarTituloCard(indiceSelecionado) {
	const tituloCard = document.getElementById('titulo-secao-dinamico');
	if (!tituloCard) return;

  tituloCard.textContent = indiceSelecionado === 'cpo-d' ? 'Dentes Permanentes' : 'Dentes Decíduos'
}

/**
 * Sincroniza a numeração dos dentes na tela com a classificação selecionada (FDI/ADA).
 * Percorre todos os elementos de dentes e delega o processamento individual.
 * @returns {void}
 */
function atualizarClassificacaoDente() {
	const classificacaoDenteSelectInput = document.getElementById('selecao-classificacao');
	let valorClassificacaoDente = classificacaoDenteSelectInput.value.toLowerCase();

	// Seleciona as novas classes semânticas definidas na refatoração CSS/HTML
	const elementosDente = document.querySelectorAll('.cartao-dente-simples, .componente-dente');

	elementosDente.forEach(function (elementoDente) {
		processarUnicoDente(elementoDente, valorClassificacaoDente);
  });
}

/**
 * Processa a conversão de um único card de dente.
 * Traduz o número original (FDI padrão nos arquivos) para ADA se necessário,
 * atualizando rótulos visuais, IDs, names e atributos 'for' dos labels.
 * @param {HTMLElement} elementoDente - O elemento DOM (article) do dente.
 * @param {string} valorClassificacaoDente - O modo selecionado ('fdi' ou 'ada').
 * @returns {void}
 */
function processarUnicoDente(elementoDente, valorClassificacaoDente) {
	// Como removemos o ID do article para limpar o código, buscamos o número do dente no label original
	const elementoNumeroBase = elementoDente.querySelector('.numero-dente, .dente-titulo h3');
	if (!elementoNumeroBase) return;

	// Obtemos o número FDI original (sempre presente no HTML base)
	let numeroDenteOriginal = elementoNumeroBase.getAttribute('data-fdi') || elementoNumeroBase.textContent.trim();

	// Armazena o FDI original em um atributo personalizado se for a primeira execução
	if (!elementoNumeroBase.hasAttribute('data-fdi')) {
		elementoNumeroBase.setAttribute('data-fdi', numeroDenteOriginal);
	}

	let valorExibicao = numeroDenteOriginal;

	if (valorClassificacaoDente === 'ada') {
		let indiceArray = FDI_PERMANENTE.indexOf(numeroDenteOriginal);
		
    if (indiceArray !== -1) {
			valorExibicao = ADA_PERMANENTE[indiceArray];
		} else {
			indiceArray = FDI_DECIDUO.indexOf(numeroDenteOriginal);
			
      if (indiceArray !== -1) {
				valorExibicao = ADA_DECIDUO[indiceArray];
			}
		}
	}

	// Atualiza Texto Visual
	elementoNumeroBase.textContent = valorExibicao;

	// Atualiza Inputs e Labels usando o utilitário de substituição
	const inputsDente = elementoDente.querySelectorAll('input');
	inputsDente.forEach(input => {
		substituirValorAtributo(input, 'id', numeroDenteOriginal, valorExibicao);
		substituirValorAtributo(input, 'name', numeroDenteOriginal, valorExibicao);
	});

	const labelsDente = elementoDente.querySelectorAll('label');
	labelsDente.forEach(label => {
		substituirValorAtributo(label, 'for', numeroDenteOriginal, valorExibicao);
	});
}

/**
 * Utilitário para realizar a substituição segura de substrings em atributos HTML.
 * @param {HTMLElement} elemento - O elemento alvo.
 * @param {string} nomeAtributo - O atributo (id, name, for).
 * @param {string} valorAntigo - O número FDI original.
 * @param {string} valorNovo - O novo número/letra (ADA ou FDI atualizado).
 */
function substituirValorAtributo(elemento, nomeAtributo, valorAntigo, valorNovo) {
	let valorAtual = elemento.getAttribute(nomeAtributo);

	if (valorAtual) {
		let novoValor = valorAtual
			.split('-')
			.map(parte => (parte === valorAntigo ? valorNovo : parte))
			.join('-');
		
    elemento.setAttribute(nomeAtributo, novoValor);
	}
}
