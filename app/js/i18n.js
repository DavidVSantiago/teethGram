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
 * É atualizado dinamicamente quando o idioma muda.
 */
export const t = {};

/**
 * Ponto de entrada principal para o sistema de tradução.
 * Chamado pelo main.js na inicialização da aplicação.
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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
 * @returns {Promise<void>}
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

	const containerApp = document.getElementById('app');

	if (containerApp) {
		const estadoSalvo = { ...FormController.estado };

		const selectClassAntigo = document.getElementById('selecao-classificacao');
		const classificacaoSalva = selectClassAntigo ? selectClassAntigo.value : null;

		containerApp.innerHTML = ViewManager.construirPaginaPrincipal();

		FormController.init();

		if (typeof FormController.renderizar === 'function' && estadoSalvo.indice !== null) {
			const selectIndice = document.getElementById('selecao-indice');
			const selectDist = document.getElementById('selecao-distribuicao');
			const selectClassNovo = document.getElementById('selecao-classificacao');

			if (selectIndice) selectIndice.value = estadoSalvo.indice;
			if (selectDist) selectDist.value = estadoSalvo.distribuicao;

			if (selectClassNovo && classificacaoSalva) {
				selectClassNovo.value = classificacaoSalva;
			}

			FormController.estado = { indice: null, distribuicao: null };

			FormController.renderizar();
		}

		configurarSeletor();
	}
}

/**
 * Sincroniza o valor do elemento `<select>` com o idioma ativo
 * e atrela o ouvinte de mudança (change event).
 * @private
 */
function configurarSeletor() {
	const seletor = document.getElementById('seletor-idioma');
	if (!seletor) return;

	const idiomaAtivo = localStorage.getItem(CONFIG_I18N.CHAVE_STORAGE) || CONFIG_I18N.IDIOMA_PADRAO;

	seletor.value = idiomaAtivo;

	seletor.onchange = (evento) => {
		definirIdioma(evento.target.value);
	};
}
