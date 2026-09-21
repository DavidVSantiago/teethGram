import { ViewManager } from './ui/ViewManager.js';
import { FormController } from './controllers/FormController.js';

/**
 * Objeto reativo contendo os textos traduzidos da aplicação.
 * Mantido fora da classe e exportado diretamente para preservar a compatibilidade
 * das importações in-place nos outros módulos do sistema.
 * @type {Object}
 */
export const t = {};

/**
 * Gerenciador de Internacionalização (i18n).
 * Utiliza o padrão com métodos e propriedades estáticas para gerenciar o estado global de idiomas.
 */
export class I18nManager {
	/**
	 * Configurações globais de internacionalização.
	 * @readonly
	 */
	static CONFIG = Object.freeze({
		IDIOMA_PADRAO: 'pt-br',
		CHAVE_STORAGE: 'language',
		CAMINHO_DICIONARIO: 'json/dicionario.json',
	});

	/**
	 * Dicionário completo de traduções carregado em memória.
	 * @type {Object|null}
	 */
	static dicionarioCompleto = null;

	/**
	 * Ponto de entrada principal para a inicialização do sistema de tradução.
	 * @returns {Promise<void>}
	 */
	static async init() {
		const idiomaSalvo = localStorage.getItem(this.CONFIG.CHAVE_STORAGE) || this.CONFIG.IDIOMA_PADRAO;

		document.documentElement.lang = idiomaSalvo;

		await this.carregarDicionario();
		await this.definirIdioma(idiomaSalvo);
	}

	/**
	 * Realiza o download assíncrono do arquivo JSON contendo o dicionário de traduções.
	 * @returns {Promise<Object|null>} Dicionário completo ou null em caso de falha.
	 */
	static async carregarDicionario() {
		if (this.dicionarioCompleto) return this.dicionarioCompleto;

		try {
			const resposta = await fetch(this.CONFIG.CAMINHO_DICIONARIO);

			if (!resposta.ok) {
				throw new Error(`Erro HTTP ao buscar dicionário: código ${resposta.status}`);
			}

			this.dicionarioCompleto = await resposta.json();
			return this.dicionarioCompleto;
		} catch (erro) {
			console.error('[i18n] Falha crítica ao carregar o dicionário de traduções:', erro);
			this.dicionarioCompleto = null;
			return null;
		}
	}

	/**
	 * Altera o idioma ativo, atualiza o dicionário em memória e aciona a reconstrução da tela.
	 * @param {string} codigoIdioma - O código do idioma desejado (ex: 'pt-br', 'en').
	 * @returns {Promise<void>}
	 */
	static async definirIdioma(codigoIdioma) {
		const codigoIdiomaSeguro = codigoIdioma || this.CONFIG.IDIOMA_PADRAO;

		await this.carregarDicionario();
		const dicionarioSelecionado = this.obterDicionarioIdioma(codigoIdiomaSeguro);

		if (!dicionarioSelecionado) {
			console.error('[i18n] Nenhum dicionário disponível para aplicar o idioma. Mantendo o idioma padrão.');
			return;
		}

		Object.keys(t).forEach((chave) => delete t[chave]);
		Object.assign(t, dicionarioSelecionado);

		localStorage.setItem(this.CONFIG.CHAVE_STORAGE, codigoIdiomaSeguro);
		document.documentElement.lang = codigoIdiomaSeguro;

		this.reconstruirInterface();
	}

	/**
	 * Busca o dicionário correspondente ao idioma solicitado com fallback explícito.
	 * @param {string} codigoIdioma - Código do idioma a ser aplicado.
	 * @returns {Object|null} Dicionário do idioma solicitado ou do padrão.
	 */
	static obterDicionarioIdioma(codigoIdioma) {
		if (!this.dicionarioCompleto) {
			return null;
		}

		return this.dicionarioCompleto[codigoIdioma] || this.dicionarioCompleto[this.CONFIG.IDIOMA_PADRAO] || null;
	}

	/**
	 * Destrói e recria o DOM com as novas strings, preservando o estado do formulário,
	 * re-renderizando o gráfico se ativo e disparando o evento de atualização de idioma.
	 */
	static reconstruirInterface() {
		const containerApp = document.getElementById('app');

		if (!containerApp) return;

		const estadoTemporario = this.obterEstadoFormulario();
		const elementoClassificacao = document.getElementById('selecao-classificacao');
		const valorClassificacaoSalva = elementoClassificacao ? elementoClassificacao.value : null;

		const containerHistogramaAntigo = document.getElementById('container-histograma');
		const graficoEstavaVisivel = containerHistogramaAntigo && !containerHistogramaAntigo.classList.contains('hidden');

		containerApp.innerHTML = ViewManager.construirPaginaPrincipal();

		FormController.init();

		this.restaurarEstadoDoFormulario(estadoTemporario, valorClassificacaoSalva);
		this.configurarSeletorDeIdioma();

		if (graficoEstavaVisivel) {
			FormController.gerarHistograma();
		}

		// Dispara evento global notificando que a interface foi reconstruída devido ao idioma
		document.dispatchEvent(new CustomEvent('i18n:languageChanged', { detail: { idioma: document.documentElement.lang } }));
	}

	/**
	 * Centraliza a leitura do estado completo do formulário (incluindo valores dos inputs) para preservá-los após troca de idioma.
	 * @returns {{ indice: string|null, distribuicao: string|null, valoresInputs: Object, modoDistribuicao: string|null }}
	 */
	static obterEstadoFormulario() {
		const estadoAtual = FormController.estado ?? {};
		const valoresInputs = {};

		const inputs = document.querySelectorAll('#container-formulario input, #total-participantes');
		inputs.forEach((input) => {
			if (input.id && input.value !== '') {
				valoresInputs[input.id] = input.value;
			}
		});

		const modoDistribuicaoRadio = document.querySelector('input[name="modo-distribuicao"]:checked')?.value ?? null;

		return {
			indice: estadoAtual.indice ?? null,
			distribuicao: estadoAtual.distribuicao ?? null,
			valoresInputs,
			modoDistribuicao: modoDistribuicaoRadio,
		};
	}

	/**
	 * Isola a lógica específica de manipulação de formulário, restaurando opções e valores de inputs no DOM.
	 * @param {Object} estadoSalvo - O estado salvo retornado por obterEstadoFormulario.
	 * @param {string|null} classificacaoSalva - O sistema de classificação (FDI/ADA).
	 */
	static restaurarEstadoDoFormulario(estadoSalvo, classificacaoSalva) {
		if (typeof FormController.renderizar !== 'function' || !estadoSalvo?.indice) {
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

		if (estadoSalvo.modoDistribuicao) {
			const radio = document.querySelector(`input[name="modo-distribuicao"][value="${estadoSalvo.modoDistribuicao}"]`);
			if (radio) radio.checked = true;
		}

		if (estadoSalvo.valoresInputs) {
			Object.entries(estadoSalvo.valoresInputs).forEach(([id, valor]) => {
				const input = document.getElementById(id);
				if (input) {
					input.value = valor;
				}
			});
		}
	}

	/**
	 * Sincroniza o valor do elemento `<select>` de idioma no cabeçalho com o storage e atrela o ouvinte de eventos.
	 */
	static configurarSeletorDeIdioma() {
		const seletorDeIdioma = document.getElementById('seletor-idioma');

		if (!seletorDeIdioma) return;

		seletorDeIdioma.value = localStorage.getItem(this.CONFIG.CHAVE_STORAGE) || this.CONFIG.IDIOMA_PADRAO;

		seletorDeIdioma.addEventListener('change', (evento) => {
			const novoIdiomaSelecionado = evento.target.value;
			this.definirIdioma(novoIdiomaSelecionado);
		});
	}
}
