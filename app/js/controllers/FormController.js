import { ViewManager } from '../ui/ViewManager.js';
import { FormRenderer } from '../ui/FormRenderer.js';
import { UI } from '../ui/UIFeedback.js';
import { PlanilhaService } from '../services/PlanilhaService.js';
import { DentesService } from '../services/DentesService.js';

/**
 * Mapeamento entre o estado de distribuição do formulário e os componentes do DentesService.
 */
const MAPA_COMPONENTES_DISTRIBUICAO = Object.freeze({
	'componente-c': DentesService.COMPONENTES.CARIADO,
	'componente-p': DentesService.COMPONENTES.PERDIDO,
	'componente-o': DentesService.COMPONENTES.OBTURADO,
});

/**
 * Mapeamento entre o estado de distribuição do formulário e as chaves esperadas pelo GraficoOdontologico.
 */
const MAPA_DISTRIBUICAO_GRAFICO = Object.freeze({
	total: 'total',
	'componente-c': 'c',
	'componente-p': 'p',
	'componente-o': 'o',
});

/**
 * Controlador responsável por orquestrar a interface do formulário e o fluxo de dados.
 * Atua estritamente como mediador (sem tocar diretamente na árvore do DOM para estilização).
 */
export class FormController {
	static FORMULARIO = Object.freeze({
		INDICE_CPO_D: 'cpo-d',
		INDICE_CEO_D: 'ceo-d',
		DISTRIBUICAO_TOTAL: 'total',
		DISTRIBUICAO_COMPONENTE_C: 'componente-c',
		DISTRIBUICAO_COMPONENTE_P: 'componente-p',
		DISTRIBUICAO_COMPONENTE_O: 'componente-o',
		TODOS: 'TODOS',
		CLASSIFICACAO_PADRAO: 'fdi',
	});

	static estado = {
		indice: null,
		distribuicao: null,
	};

	/**
	 * Instância ou referência do serviço/renderizador do gráfico Canvas.
	 * @type {Object|null}
	 */
	static graficoInstancia = null;

	/**
	 * Registra a instância da classe responsável pelo Canvas Odontológico.
	 * @param {Object} instanciaGrafico - Instância de GraficoOdontologico.
	 */
	static registrarGrafico(instanciaGrafico) {
		this.graficoInstancia = instanciaGrafico;
	}

	/**
	 * Inicializa o controlador, configurando os eventos e realizando a primeira renderização.
	 */
	static init() {
		this.setupListeners();
		this.renderizar();
	}

	/**
	 * Configura os ouvintes de eventos para os campos de seleção e inputs do formulário.
	 */
	static setupListeners() {
		const elIndice = document.getElementById('selecao-indice');
		const elDistribuicao = document.getElementById('selecao-distribuicao');
		const elClassificacao = document.getElementById('selecao-classificacao');
		const containerForm = document.getElementById('container-formulario');

		elIndice?.addEventListener('change', () => this.renderizar());
		elDistribuicao?.addEventListener('change', () => this.renderizar());
		elClassificacao?.addEventListener('change', (e) => FormRenderer.atualizarSistemaNumeracao(e.target.value));
		containerForm?.addEventListener('input', () => this.atualizarEstadoBotaoGerar());
	}

	/**
	 * Renderiza a grade de dentes na tela com base nas opções selecionadas no filtro.
	 */
	static renderizar() {
		const elIndice = document.getElementById('selecao-indice');
		const elDistribuicao = document.getElementById('selecao-distribuicao');
		const containerForm = document.getElementById('container-formulario');

		if (!elIndice || !elDistribuicao || !containerForm) {
			console.warn('FormController: Elementos base não encontrados para renderização.');
			return;
		}

		const valorIndice = elIndice.value;
		const valorDistribuicao = elDistribuicao.value;

		if (this.estado.indice === valorIndice && this.estado.distribuicao === valorDistribuicao) {
			return;
		}

		document.getElementById('container-histograma')?.classList.add('hidden');

		ViewManager.mudarTituloCard(valorIndice);
		FormRenderer.atualizarOpcoesDistribuicao(valorIndice);

		const quadrantes = FormRenderer.obterQuadrantes(valorIndice);
		const ehTotal = valorDistribuicao === 'total';
		const configComp = !ehTotal
			? valorIndice === 'cpo-d'
				? FormRenderer.obterConfiguracaoCPOD()
				: FormRenderer.obterConfiguracaoCEOD()
			: null;

		containerForm.innerHTML = FormRenderer.gerarEstruturaArcos(quadrantes, configComp);
		this.estado = { indice: valorIndice, distribuicao: valorDistribuicao };

		const sistemaAlvo = document.getElementById('selecao-classificacao')?.value || 'fdi';
		FormRenderer.atualizarSistemaNumeracao(sistemaAlvo);
		FormRenderer.atualizarEstadoInputs(valorIndice, valorDistribuicao);
		this.atualizarEstadoBotaoGerar();
	}

	/**
	 * Gerencia a importação e leitura do arquivo de planilha.
	 * Aciona o serviço de processamento e lida com o feedback de interface.
	 * @param {File} file - Arquivo enviado pelo input file.
	 */
	static async handleImport(file) {
		try {
			const tipoEnum = this.obterTipoEnum();
			const classificacao = document.getElementById('selecao-classificacao')?.value || 'fdi';
			const componenteAlvo = MAPA_COMPONENTES_DISTRIBUICAO[this.estado.distribuicao] || 'TODOS';

			const resultado = await PlanilhaService.processarPlanilha(file, tipoEnum, classificacao, componenteAlvo);

			this.preencherDadosNaTela(resultado.dados, resultado.totalParticipantes, componenteAlvo, classificacao);
		} catch (erro) {
			UI.notificarErroPlanilha(erro);
		}
	}

	/**
	 * Distribui os dados processados da planilha para os respectivos inputs do HTML.
	 * @param {Map} dadosMap - O mapa contendo os dentes e seus valores.
	 * @param {number} totalParticipantes - O número total de pacientes lido da planilha.
	 * @param {string} componenteAlvo - Indica se estamos preenchendo TODOS ou um específico.
	 * @param {string} classificacaoSelecionada - O sistema de numeração alvo (ex: 'fdi' ou 'ada').
	 */
	static preencherDadosNaTela(dadosMap, totalParticipantes, componenteAlvo, classificacaoSelecionada) {
		const inputTotal = document.getElementById('total-participantes');
		if (inputTotal) inputTotal.value = totalParticipantes;

		const ehTotal = this.estado.distribuicao === 'total';
		const configComp = this.estado.indice === 'cpo-d' ? FormRenderer.obterConfiguracaoCPOD() : FormRenderer.obterConfiguracaoCEOD();

		dadosMap.forEach((valor, dente) => {
			if (ehTotal) {
				FormRenderer.injetarValorNoInput(dente, 'total', valor, classificacaoSelecionada);
			} else if (componenteAlvo === 'TODOS') {
				FormRenderer.injetarValorNoInput(dente, configComp.idC, valor.cariado, classificacaoSelecionada);
				FormRenderer.injetarValorNoInput(dente, configComp.idPE, valor.perdido, classificacaoSelecionada);
				FormRenderer.injetarValorNoInput(dente, configComp.idO, valor.obturado, classificacaoSelecionada);
			} else {
				const mapas = {
					[DentesService.COMPONENTES.CARIADO]: configComp.idC,
					[DentesService.COMPONENTES.PERDIDO]: configComp.idPE,
					[DentesService.COMPONENTES.OBTURADO]: configComp.idO,
				};
				FormRenderer.injetarValorNoInput(dente, mapas[componenteAlvo] || '', valor, classificacaoSelecionada);
			}
		});

		this.atualizarEstadoBotaoGerar();
	}

	/**
	 * Determina o tipo de formulário a ser processado com base no estado atual.
	 * @returns {number} O identificador numérico do enumerador TIPO_FORMULARIO.
	 */
	static obterTipoEnum() {
		const { indice, distribuicao } = this.estado;
		const ehTotal = distribuicao === 'total';

		if (indice === 'cpo-d') {
			return ehTotal ? PlanilhaService.TIPO_FORMULARIO.CPOD_TOTAL : PlanilhaService.TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
		}
		return ehTotal ? PlanilhaService.TIPO_FORMULARIO.CEOD_TOTAL : PlanilhaService.TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	}

	/**
	 * Coleta as configurações e metadados informados no formulário.
	 * @returns {{ totalParticipantes: number, sistemaClassificacao: string, indice: string, distribuicao: string }}
	 */
	static obterConfiguracoesFormulario() {
		const inputTotal = document.getElementById('total-participantes');
		const selectClassificacao = document.getElementById('selecao-classificacao');

		return {
			totalParticipantes: this.converterParaInteiro(inputTotal?.value),
			sistemaClassificacao: selectClassificacao?.value || 'fdi',
			indice: this.estado.indice,
			distribuicao: this.estado.distribuicao,
		};
	}

	/**
	 * Coleta todos os valores inseridos no formulário, organiza os dados por arcada,
	 * exibe a section do Canvas e dispara o desenho utilizando a instância do gráfico.
	 * @returns {Object|null} Dados e configurações consolidadas ou null se o formulário estiver vazio.
	 */
	static gerarHistograma() {
		const config = this.obterConfiguracoesFormulario();
		const modoDistribuicao = document.querySelector('input[name="modo-distribuicao"]:checked')?.value || 'media';
		const dadosColetados = { valores: {} };

		const inputs = document.querySelectorAll(`.${FormRenderer.CLASSES_INPUT.TOTAL}, .${FormRenderer.CLASSES_INPUT.COMPONENTE}`);

		inputs.forEach((input) => {
			if (input.value === '') return;

			const partes = input.id.split('-');
			const ehTotal = input.classList.contains(FormRenderer.CLASSES_INPUT.TOTAL);
			const numeroDente = ehTotal ? partes[1] : partes[1];
			const val = this.converterParaInteiro(input.value);

			if (!dadosColetados.valores[numeroDente]) {
				dadosColetados.valores[numeroDente] = { c: 0, p: 0, o: 0 };
			}

			if (ehTotal) {
				dadosColetados.valores[numeroDente].c = val;
			} else {
				const comp = partes[0].toLowerCase();
				if (comp === 'c') dadosColetados.valores[numeroDente].c = val;
				else if (comp === 'p' || comp === 'e') dadosColetados.valores[numeroDente].p = val;
				else if (comp === 'o') dadosColetados.valores[numeroDente].o = val;
			}
		});

		if (!this.temDadosPreenchidos(dadosColetados.valores)) return null;

		const dadosSuperiores = {};
		const dadosInferiores = {};
		const sisClass = config.sistemaClassificacao.toLowerCase();

		Object.entries(dadosColetados.valores).forEach(([dente, contagens]) => {
			if (this.ehArcadaInferior(dente, sisClass)) {
				dadosInferiores[dente] = contagens;
			} else {
				dadosSuperiores[dente] = contagens;
			}
		});

		const configGrafico = {
			classificacao: config.sistemaClassificacao.toUpperCase(),
			distribuicao: MAPA_DISTRIBUICAO_GRAFICO[this.estado.distribuicao] || 'total_componentes',
			mostrarPorcentagem: modoDistribuicao === 'percentual',
			totalParticipantes: config.totalParticipantes,
			indice: config.indice,
		};

		const containerHistograma = document.getElementById('container-histograma');
		if (containerHistograma) {
			containerHistograma.classList.remove('hidden');
			containerHistograma.scrollIntoView({ behavior: 'smooth' });
		}

		if (typeof this.graficoInstancia?.renderizar === 'function') {
			this.graficoInstancia.renderizar(dadosSuperiores, dadosInferiores, configGrafico);
		}

		return dadosColetados;
	}

	/**
	 * Habilita ou desabilita o botão de geração de gráfico com base no preenchimento do formulário.
	 */
	static atualizarEstadoBotaoGerar() {
		const botaoGerar = document.getElementById('btn-gerar-histograma');
		if (!botaoGerar) return;

		const inputs = document.querySelectorAll(`.${FormRenderer.CLASSES_INPUT.TOTAL}, .${FormRenderer.CLASSES_INPUT.COMPONENTE}`);
		const possuiValorValido = Array.from(inputs).some((i) => this.converterParaInteiro(i.value) > 0);

		botaoGerar.disabled = !possuiValorValido;
	}

	/**
	 * Verifica se existe ao menos um valor numérico maior que zero nos dentes coletados.
	 * @param {Object} valores - Objeto com os dentes e contagens { c, p, o }.
	 * @returns {boolean} True se houver ao menos um dado válido.
	 * @private
	 */
	static temDadosPreenchidos(valores) {
		return Object.values(valores).some((c) => (c.c || 0) + (c.p || 0) + (c.o || 0) > 0);
	}

	/**
	 * Identifica se determinado dente pertence à arcada inferior.
	 * @param {string} dente - Identificador do dente.
	 * @param {string} sistemaClassificacao - Sistema de numeração ('fdi' ou 'ada').
	 * @returns {boolean} True se o dente for da arcada inferior.
	 * @private
	 */
	static ehArcadaInferior(dente, sistemaClassificacao) {
		if (sistemaClassificacao === 'ada') {
			const num = parseInt(dente, 10);
			if (!isNaN(num)) return num >= 17 && num <= 32;
			return ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].includes(dente.toUpperCase());
		}
		return ['3', '4', '7', '8'].includes(dente.charAt(0));
	}

	/**
	 * Converte com segurança um valor em texto para inteiro não negativo.
	 * @param {string|number} valor - Valor a ser convertido.
	 * @returns {number} Inteiro equivalente ou 0.
	 * @private
	 */
	static converterParaInteiro(valor) {
		const parsed = parseInt(valor, 10);
		return isNaN(parsed) || parsed < 0 ? 0 : parsed;
	}
}
