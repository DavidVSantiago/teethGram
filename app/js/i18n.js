/**
 * =======================================================================================
 * CONFIGURAÇÕES GLOBAIS DE IDIOMA
 * =======================================================================================
 */

const CONFIG_I18N = {
	IDIOMA_PADRAO: 'pt-br',
	CHAVE_STORAGE: 'language',
	CAMINHO_DICIONARIO: 'json/dicionario.json',
};

let dicionarioCompleto = null;
let t = null;

/**
 * =======================================================================================
 * CARREGAMENTO E GERENCIAMENTO DE ESTADO
 * =======================================================================================
 */

/**
 * Busca o JSON com todas as traduções, caso ainda não tenha sido carregado.
 */
async function carregarDicionario() {
	if (dicionarioCompleto) return;

	try {
		const resposta = await fetch(CONFIG_I18N.CAMINHO_DICIONARIO);
		if (!resposta.ok) throw new Error(`Erro HTTP: ${resposta.status}`);

		dicionarioCompleto = await resposta.json();
	} catch (erro) {
		console.error('Falha crítica ao carregar o dicionário de traduções:', erro);
	}
}

/**
 * Altera o idioma da aplicação, atualiza o DOM e preserva o estado da tela (se houver).
 * @param {string} idioma - Sigla do idioma (ex: 'pt-br', 'en')
 */
async function definirIdioma(idioma) {
	const containerApp = document.getElementById('app');
	if (!containerApp) return;

	await carregarDicionario();

	localStorage.setItem(CONFIG_I18N.CHAVE_STORAGE, idioma);
	document.documentElement.lang = idioma;

	// Define o dicionário global (fallback para pt-br se o idioma não existir)
	t = dicionarioCompleto[idioma] || dicionarioCompleto[CONFIG_I18N.IDIOMA_PADRAO];

	const estadoTela = {
		indice: document.getElementById('selecao-indice')?.value,
		distribuicao: document.getElementById('selecao-distribuicao')?.value,
		classificacao: document.getElementById('selecao-classificacao')?.value,
	};

	containerApp.innerHTML = construirPaginaPrincipal();

	ultimoIndiceCarregado = null;
	ultimaDistribuicaoCarregada = null;

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

	if (typeof inicializarEventosFormulario === 'function') {
		inicializarEventosFormulario();
	}
}

/**
 * =======================================================================================
 * INICIALIZAÇÃO
 * =======================================================================================
 */

/**
 * Ponto de entrada do sistema de internacionalização.
 */
function inicializarI18n() {
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
