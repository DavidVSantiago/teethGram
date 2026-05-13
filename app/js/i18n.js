import {
	construirPaginaPrincipal,
	mudarTituloCard,
	resetarIndicesCarregados,
	inicializarEventosFormulario,
} from './view-manager.js';

export const CONFIG_I18N = {
	IDIOMA_PADRAO: 'pt-br',
	CHAVE_STORAGE: 'language',
	CAMINHO_DICIONARIO: 'json/dicionario.json',
};

export let dicionarioCompleto = null;
export const t = {};

/**
 * =======================================================================================
 * CARREGAMENTO E GERENCIAMENTO DE ESTADO
 * =======================================================================================
 */

/**
 * Busca e armazena em memória o JSON contendo todas as traduções da aplicação.
 * Evita requisições duplicadas caso o dicionário já esteja em cache.
 */
export async function carregarDicionario() {
	if (dicionarioCompleto) return;

	try {
		const resposta = await fetch(CONFIG_I18N.CAMINHO_DICIONARIO);
		if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

		dicionarioCompleto = await resposta.json();
	} catch (erro) {
		console.error('[i18n] Falha crítica ao carregar o dicionário de traduções:', erro);
	}
}

/**
 * Altera o idioma atual da aplicação, salva a preferência localmente,
 * recarrega as traduções e reconstrói a interface preservando o estado dos filtros.
 *
 * @param {string} idioma - Sigla do idioma desejado (ex: 'pt-br', 'en').
 */
export async function definirIdioma(idioma) {
	const containerApp = document.getElementById('app');

	if (!containerApp) {
		console.warn('[i18n] Container principal "#app" não encontrado no DOM.');
		return;
	}

	await carregarDicionario();

	localStorage.setItem(CONFIG_I18N.CHAVE_STORAGE, idioma);
	document.documentElement.lang = idioma;

	const novoDicionario =
		dicionarioCompleto[idioma] || dicionarioCompleto[CONFIG_I18N.IDIOMA_PADRAO];

	Object.keys(t).forEach((key) => delete t[key]);
	Object.assign(t, novoDicionario);

	const estadoTela = {
		indice: document.getElementById('selecao-indice')?.value,
		distribuicao: document.getElementById('selecao-distribuicao')?.value,
		classificacao: document.getElementById('selecao-classificacao')?.value,
	};

	containerApp.innerHTML = construirPaginaPrincipal();
	resetarIndicesCarregados();

	if (estadoTela.indice) {
		document.getElementById('selecao-indice').value = estadoTela.indice;
		mudarTituloCard(estadoTela.indice);
	}

	if (estadoTela.distribuicao) {
		document.getElementById('selecao-distribuicao').value = estadoTela.distribuicao;
	}

	if (estadoTela.classificacao) {
		document.getElementById('selecao-classificacao').value = estadoTela.classificacao;
	}

	inicializarEventosFormulario();
}

/**
 * Inicializa o subsistema de internacionalização.
 * Recupera a preferência salva no storage (ou adota o padrão) e atrela o ouvinte ao seletor de idiomas.
 */
export function inicializarI18n() {
	const idiomaSalvo = localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;
	const seletorElemento = document.getElementById('seletor-idioma');

	if (seletorElemento) {
		seletorElemento.value = idiomaSalvo;
		seletorElemento.addEventListener('change', (evento) => {
			definirIdioma(evento.target.value);
		});
	}

	definirIdioma(idiomaSalvo);
}

inicializarI18n();
