import { mudarTituloCard } from '../view-manager.js';
import { FormulariosRenderer } from './form-dynamic.js';

let ultimoIndiceCarregado = null;
let ultimaDistribuicaoCarregada = null;

/**
 * Reseta o estado em cache do controlador de formulários.
 * Força uma nova renderização do HTML na próxima chamada de geração.
 */
export function resetarEstadoFormulario() {
	ultimoIndiceCarregado = null;
	ultimaDistribuicaoCarregada = null;
}

/**
 * =======================================================================================
 * FUNÇÕES PRINCIPAIS EXPORTADAS
 * =======================================================================================
 */

/**
 * Renderiza dinamicamente o formulário odontológico na tela com base nas
 * seleções de índice (CPO-D/ceo-d) e distribuição (Total/Componentes).
 * Evita recarregamentos desnecessários verificando o estado em cache.
 */
export function gerarFormulario() {
	const container = document.querySelector('#container-formulario');
	const selecaoIndice = document.getElementById('selecao-indice');
	const selecaoDistribuicao = document.getElementById('selecao-distribuicao');

	if (!container || !selecaoIndice || !selecaoDistribuicao) {
		console.warn('[FormController] Elementos alvo não encontrados no DOM para gerar o formulário.');
		return;
	}

	const indice = selecaoIndice.value.toLowerCase();
	const distribuicao = selecaoDistribuicao.value.toLowerCase();
	const idioma = document.documentElement.lang || 'pt-br';

	if (indice === ultimoIndiceCarregado && distribuicao === ultimaDistribuicaoCarregada) {
		return;
	}

	mudarTituloCard(indice);

	ultimoIndiceCarregado = indice;
	ultimaDistribuicaoCarregada = distribuicao;

	let htmlGerado = '';
	const ehTotal = distribuicao === 'total';

	if (indice === 'cpo-d') {
		htmlGerado = ehTotal
			? FormulariosRenderer.renderizarCpodTotal(idioma)
			: FormulariosRenderer.renderizarCpodPorComponente(idioma);
	} else if (indice === 'ceo-d') {
		htmlGerado = ehTotal
			? FormulariosRenderer.renderizarCeodTotal(idioma)
			: FormulariosRenderer.renderizarCeodPorComponente(idioma);
	}

	container.innerHTML = /* html */ `
    <h3 class="visualmente-oculto">Entrada de Dados Odontológicos</h3>
    ${htmlGerado}
  `;

	if (htmlGerado) {
		atualizarClassificacaoDente();
	}
}

/**
 * Busca todos os elementos de dentes renderizados no DOM e dispara
 * a atualização da classificação (FDI ou ADA) para cada um deles.
 */
export function atualizarClassificacaoDente() {
	const selectClassificacao = document.getElementById('selecao-classificacao');

	if (!selectClassificacao) return;

	const sistemaSelecionado = selectClassificacao.value.toLowerCase();
	const elementosDente = document.querySelectorAll('.cartao-dente-simples, .componente-dente');

	elementosDente.forEach((elemento) => processarUnicoDente(elemento, sistemaSelecionado));
}

/**
 * =======================================================================================
 * FUNÇÕES INTERNAS E UTILITÁRIAS
 * =======================================================================================
 */

/**
 * Atualiza o texto de exibição e os atributos de um elemento de dente
 * para refletir a classificação selecionada, utilizando um atributo de dados (data-fdi)
 * como fonte de verdade para conversões seguras.
 *
 * @param {HTMLElement} elemento - O container HTML que representa o dente.
 * @param {string} sistemaSelecionado - O sistema de numeração ('fdi' ou 'ada').
 */
function processarUnicoDente(elemento, sistemaSelecionado) {
	const elementoNumero = elemento.querySelector('.numero-dente, .dente-titulo h3');

	if (!elementoNumero) return;

	const fdiOriginal = elementoNumero.getAttribute('data-fdi') || elementoNumero.textContent.trim();

	if (!elementoNumero.hasAttribute('data-fdi')) {
		elementoNumero.setAttribute('data-fdi', fdiOriginal);
	}

	let numeroExibicao = fdiOriginal;

	if (sistemaSelecionado === 'ada') {
		numeroExibicao = converterFDIParaADA(fdiOriginal);
	}

	elementoNumero.textContent = numeroExibicao;

	elemento.querySelectorAll('input').forEach((input) => {
		substituirAtributo(input, 'id', fdiOriginal, numeroExibicao);
		substituirAtributo(input, 'name', fdiOriginal, numeroExibicao);
	});

	elemento.querySelectorAll('label').forEach((label) => {
		substituirAtributo(label, 'for', fdiOriginal, numeroExibicao);
	});
}

/**
 * Converte a numeração de um dente do sistema FDI para o sistema Universal (ADA).
 *
 * @param {string} fdiOriginal - O número do dente no padrão FDI.
 * @returns {string} O identificador correspondente no padrão ADA.
 */
function converterFDIParaADA(fdiOriginal) {
	const { FDI_PERMANENTE, ADA_PERMANENTE, FDI_DECIDUO, ADA_DECIDUO } = FormulariosRenderer.MAPAS;

	const indexPermanente = FDI_PERMANENTE.indexOf(fdiOriginal);
	if (indexPermanente !== -1) return ADA_PERMANENTE[indexPermanente];

	const indexDeciduo = FDI_DECIDUO.indexOf(fdiOriginal);
	if (indexDeciduo !== -1) return ADA_DECIDUO[indexDeciduo];

	return fdiOriginal;
}

/**
 * Substitui o valor de um dente dentro de uma string de atributo (ex: id ou name),
 * garantindo que a troca afete apenas a parte correta separada por hífens.
 *
 * @param {HTMLElement} elemento - O elemento HTML a ser alterado.
 * @param {string} atributo - O nome do atributo (ex: 'id', 'for', 'name').
 * @param {string} valorAntigo - O valor a ser procurado e substituído.
 * @param {string} valorNovo - O novo valor a ser inserido.
 */
function substituirAtributo(elemento, atributo, valorAntigo, valorNovo) {
	const valorAtual = elemento.getAttribute(atributo);

	if (valorAtual) {
		const valorModificado = valorAtual
			.split('-')
			.map((parte) => (parte === valorAntigo ? valorNovo : parte))
			.join('-');

		elemento.setAttribute(atributo, valorModificado);
	}
}
