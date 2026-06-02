import { ViewManager } from './ui/view-manager.js';
import { FormController } from './controllers/form-controller.js';

/**
 * Configurações globais do sistema de internacionalização (i18n).
 */
export const CONFIG_I18N = {
	IDIOMA_PADRAO: 'pt-br',
	CHAVE_STORAGE: 'language',
	CAMINHO_DICIONARIO: 'json/dicionario.json',
};

export let dicionarioCompleto = null;

/**
 * Objeto reativo contendo os textos traduzidos da aplicação.
 * É mutado in-place para manter a referência de memória em outros módulos.
 */
export const t = {};

/**
 * Ponto de entrada principal para o sistema de tradução.
 */
export async function inicializarI18n() {
	const idiomaSalvo = localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;

	document.documentElement.lang = idiomaSalvo;

	await carregarDicionario();
	await definirIdioma(idiomaSalvo);
}

/**
 * Realiza o download assíncrono do arquivo JSON de traduções.
 */
async function carregarDicionario() {
	if (dicionarioCompleto) return;

	try {
		const resposta = await fetch(CONFIG_I18N.CAMINHO_DICIONARIO);

		if (!resposta.ok) {
			throw new Error(`Erro HTTP ao buscar dicionário: código ${resposta.status}`);
		}

		dicionarioCompleto = await resposta.json();
	} catch (erro) {
		console.error('[i18n] Falha crítica ao carregar o dicionário de traduções:', erro);
	}
}

/**
 * Altera o idioma ativo, atualiza o dicionário em memória e aciona a reconstrução da tela.
 * @param {string} codigoIdioma - O código do idioma desejado (ex: 'pt-br', 'en').
 */
export async function definirIdioma(codigoIdioma) {
	if (!dicionarioCompleto) await carregarDicionario();

	const dicionarioSelecionado =
		dicionarioCompleto[codigoIdioma] || dicionarioCompleto[CONFIG_I18N.IDIOMA_PADRAO];

	Object.keys(t).forEach((chave) => delete t[chave]);
	Object.assign(t, dicionarioSelecionado);

	localStorage.setItem(CONFIG_I18N.CHAVE_STORAGE, codigoIdioma);
	document.documentElement.lang = codigoIdioma;

	reconstruirInterface();
}

/**
 * Destrói e recria o DOM com as novas strings, preservando o estado do formulário.
 */
function reconstruirInterface() {
	const containerApp = document.getElementById('app');

	if (!containerApp) return;

	const estadoTemporario = { ...FormController.estado };

	const elementoClassificacao = document.getElementById('selecao-classificacao');
	const valorClassificacaoSalva = elementoClassificacao ? elementoClassificacao.value : null;

	containerApp.innerHTML = ViewManager.construirPaginaPrincipal();

	FormController.init();

	restaurarEstadoDoFormulario(estadoTemporario, valorClassificacaoSalva);

	configurarSeletorDeIdioma();
}

/**
 * Isola a lógica específica de manipulação de formulário, melhorando a responsabilidade única.
 */
function restaurarEstadoDoFormulario(estadoSalvo, classificacaoSalva) {
	if (typeof FormController.renderizar !== 'function' || estadoSalvo.indice === null) {
		return;
	}

	const selectIndice = document.getElementById('selecao-indice');
	const selectDistribuicao = document.getElementById('selecao-distribuicao');
	const selectClassificacao = document.getElementById('selecao-classificacao');

	if (selectIndice) {
		selectIndice.value = estadoSalvo.indice;
	}
	if (selectDistribuicao) {
		selectDistribuicao.value = estadoSalvo.distribuicao;
	}
	if (selectClassificacao && classificacaoSalva) {
		selectClassificacao.value = classificacaoSalva;
	}

	FormController.estado = { indice: null, distribuicao: null };
	FormController.renderizar();
}

/**
 * Sincroniza o valor do `<select>` com o storage e atrela o ouvinte de eventos.
 */
function configurarSeletorDeIdioma() {
	const seletorDeIdioma = document.getElementById('seletor-idioma');

	if (!seletorDeIdioma) return;

	seletorDeIdioma.value =
		localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;

	seletorDeIdioma.addEventListener('change', (evento) => {
		const novoIdiomaSelecionado = evento.target.value;
		definirIdioma(novoIdiomaSelecionado);
	});
}
