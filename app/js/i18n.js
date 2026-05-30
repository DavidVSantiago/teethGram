import { ViewManager } from './ui/view-manager.js';
import { FormController } from './controllers/form-controller.js';

/**
 * Configurações globais do sistema de internacionalização.
 */
export const CONFIG_I18N = {
	IDIOMA_PADRAO: 'pt-br',
	CHAVE_STORAGE: 'language',
	CAMINHO_DICIONARIO: 'json/dicionario.json',
};

export let dicionarioCompleto = null;

/**
 * Objeto reativo contendo os textos traduzidos da aplicação.
 * É atualizado dinamicamente quando o idioma muda mantendo a referência de memória.
 */
export const t = {};

/**
 * Ponto de entrada principal para o sistema de tradução.
 * Chamado pelo main.js na inicialização da aplicação.
 */
export async function inicializarI18n() {
	const idiomaSalvo = localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;

	document.documentElement.lang = idiomaSalvo;

	await carregarDicionario();
	await definirIdioma(idiomaSalvo);

	configurarSeletor();
}

/**
 * Realiza o download assíncrono do arquivo JSON de traduções.
 */
async function carregarDicionario() {
	if (dicionarioCompleto) return;

	try {
		const resposta = await fetch(CONFIG_I18N.CAMINHO_DICIONARIO);

		if (!resposta.ok) {
			throw new Error(`Erro HTTP: ${resposta.status}`);
		}

		dicionarioCompleto = await resposta.json();
	} catch (erro) {
		console.error('[i18n] Falha ao carregar dicionário:', erro);
	}
}

/**
 * Altera o idioma ativo, atualiza o dicionário em memória e reconstrói o DOM.
 * @param {string} idioma - O código do idioma desejado (ex: 'pt-br', 'en').
 */
export async function definirIdioma(idioma) {
	if (!dicionarioCompleto) {
		await carregarDicionario();
	}

	const novoDicionario =
		dicionarioCompleto[idioma] || dicionarioCompleto[CONFIG_I18N.IDIOMA_PADRAO];

	for (const chave in t) {
		delete t[chave];
	}
	Object.assign(t, novoDicionario);

	localStorage.setItem(CONFIG_I18N.CHAVE_STORAGE, idioma);
	document.documentElement.lang = idioma;

	reconstruirInterface();
}

/**
 * Isola a lógica de reconstrução do DOM e recuperação de estado.
 * Evita que a função de tradução fique poluída com regras de UI.
 * @private
 */
function reconstruirInterface() {
	const containerApp = document.getElementById('app');
	if (!containerApp) return;

	const estadoSalvo = { ...FormController.estado };
	const classificacaoSalva = document.getElementById('selecao-classificacao')?.value;

	containerApp.innerHTML = ViewManager.construirPaginaPrincipal();

	FormController.init();

	if (typeof FormController.renderizar === 'function' && estadoSalvo.indice !== null) {
		const selectIndice = document.getElementById('selecao-indice');
		const selectDist = document.getElementById('selecao-distribuicao');
		const selectClass = document.getElementById('selecao-classificacao');

		if (selectIndice) selectIndice.value = estadoSalvo.indice;
		if (selectDist) selectDist.value = estadoSalvo.distribuicao;
		if (selectClass && classificacaoSalva) selectClass.value = classificacaoSalva;

		FormController.estado = { indice: null, distribuicao: null };
		FormController.renderizar();
	}

	configurarSeletor();
}

/**
 * Sincroniza o valor do elemento `<select>` com o idioma ativo
 * e atrela o ouvinte de mudança (change event).
 * @private
 */
function configurarSeletor() {
	const seletor = document.getElementById('seletor-idioma');
	if (!seletor) return;

	seletor.value = localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;

	seletor.onchange = (evento) => {
		definirIdioma(evento.target.value);
	};
}
