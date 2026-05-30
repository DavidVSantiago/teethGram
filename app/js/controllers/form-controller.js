import { ViewManager } from '../ui/view-manager.js';
import { FormRenderer } from '../ui/form-renderer.js';
import { UI } from '../ui/ui-feedback.js';
import { processarPlanilha, TIPO_FORMULARIO } from '../services/planilha-service.js';
import { COMPONENTES } from '../services/dentes-service.js';

/**
 * Controlador responsável por orquestrar a interface do formulário e o fluxo de dados.
 * Atua estritamente como mediador (sem tocar diretamente no DOM).
 */
export const FormController = {
	estado: {
		indice: null,
		distribuicao: null,
	},

	/**
	 * Inicializa o controlador, configurando os eventos e realizando a primeira renderização.
	 */
	init() {
		this.setupListeners();
		this.renderizar();
	},

	/**
	 * Configura os ouvintes de eventos para os campos de seleção principais.
	 */
	setupListeners() {
		document.getElementById('selecao-indice')?.addEventListener('change', () => this.renderizar());

		document
			.getElementById('selecao-distribuicao')
			?.addEventListener('change', () => this.renderizar());

		document.getElementById('selecao-classificacao')?.addEventListener('change', () => {
			const sistemaAlvo = document.getElementById('selecao-classificacao')?.value;
			FormRenderer.atualizarSistemaNumeracao(sistemaAlvo);
		});
	},

	/**
	 * Renderiza a grade de dentes na tela com base nas opções selecionadas no filtro.
	 */
	renderizar() {
		const indice = document.getElementById('selecao-indice')?.value;
		const distribuicao = document.getElementById('selecao-distribuicao')?.value;
		const container = document.getElementById('container-formulario');

		if (this.estado.indice === indice && this.estado.distribuicao === distribuicao) {
			return;
		}

		ViewManager.mudarTituloCard(indice);
		FormRenderer.atualizarOpcoesDistribuicao(indice);

		const sistema = FormRenderer.obterQuadrantes(indice);
		const ehTotal = distribuicao === 'total';

		let configComp = null;
		if (!ehTotal) {
			configComp =
				indice === 'cpo-d'
					? FormRenderer.obterConfiguracaoCPOD()
					: FormRenderer.obterConfiguracaoCEOD();
		}

		if (container) {
			container.innerHTML = FormRenderer.gerarEstruturaArcos(sistema, configComp);
		}

		this.estado = { indice, distribuicao };

		const sistemaAlvo = document.getElementById('selecao-classificacao')?.value;
		FormRenderer.atualizarSistemaNumeracao(sistemaAlvo);
		FormRenderer.atualizarEstadoInputs(indice, distribuicao);
	},

	/**
	 * Gerencia a importação e leitura do arquivo de planilha.
	 * Aciona o serviço de processamento e lida com o feedback de interface.
	 * @param {File} file - Arquivo enviado pelo input file.
	 */
	async handleImport(file) {
		try {
			const tipoEnum = this.obterTipoEnum();
			const selectClassificacao = document.getElementById('selecao-classificacao');
			const classificacaoSelecionada = selectClassificacao ? selectClassificacao.value : 'fdi';

			let componenteAlvo = 'TODOS';
			if (this.estado.distribuicao === 'componente-c') componenteAlvo = COMPONENTES.CARIADO;
			if (this.estado.distribuicao === 'componente-p') componenteAlvo = COMPONENTES.PERDIDO;
			if (this.estado.distribuicao === 'componente-o') componenteAlvo = COMPONENTES.OBTURADO;

			const { dados, totalParticipantes } = await processarPlanilha(
				file,
				tipoEnum,
				classificacaoSelecionada,
				componenteAlvo,
			);

			this.preencherDadosNaTela(
				dados,
				totalParticipantes,
				componenteAlvo,
				classificacaoSelecionada,
			);
		} catch (erro) {
			UI.notificarErroPlanilha(erro.message);
		}
	},

	/**
	 * Distribui os dados processados da planilha para os respectivos inputs do HTML.
	 * @param {Map} dadosMap - O mapa contendo os dentes e seus valores.
	 * @param {number} totalParticipantes - O número total de pacientes lido da planilha.
	 * @param {string} componenteAlvo - Indica se estamos preenchendo TODOS ou um específico.
	 */
	preencherDadosNaTela(dadosMap, totalParticipantes, componenteAlvo, classificacaoSelecionada) {
		const inputTotal = document.getElementById('total-participantes');
		if (inputTotal) inputTotal.value = totalParticipantes;

		const ehTotal = this.estado.distribuicao === 'total';
		const configComp =
			this.estado.indice === 'cpo-d'
				? FormRenderer.obterConfiguracaoCPOD()
				: FormRenderer.obterConfiguracaoCEOD();

		dadosMap.forEach((valor, denteKey) => {
			if (ehTotal) {
				FormRenderer.injetarValorNoInput(denteKey, 'total', valor, classificacaoSelecionada);
			} else if (componenteAlvo === 'TODOS') {
				FormRenderer.injetarValorNoInput(
					denteKey,
					configComp.idC,
					valor.cariado,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					denteKey,
					configComp.idPE,
					valor.perdido,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					denteKey,
					configComp.idO,
					valor.obturado,
					classificacaoSelecionada,
				);
			} else {
				const mapaSufixos = {
					[COMPONENTES.CARIADO]: configComp.idC,
					[COMPONENTES.PERDIDO]: configComp.idPE,
					[COMPONENTES.OBTURADO]: configComp.idO,
				};

				const sufixo = mapaSufixos[componenteAlvo] || '';
				FormRenderer.injetarValorNoInput(denteKey, sufixo, valor, classificacaoSelecionada);
			}
		});
	},

	/**
	 * Determina o tipo de formulário a ser processado com base no estado atual.
	 * @returns {number} O identificador do enumerador TIPO_FORMULARIO.
	 */
	obterTipoEnum() {
		const { indice, distribuicao } = this.estado;
		const ehTotal = distribuicao === 'total';

		if (indice === 'cpo-d') {
			return ehTotal ? TIPO_FORMULARIO.CPOD_TOTAL : TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
		}

		return ehTotal ? TIPO_FORMULARIO.CEOD_TOTAL : TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	},
};
