import { ViewManager } from '../ui/ViewManager.js';
import { FormRenderer } from '../ui/FormRenderer.js';
import { UI } from '../ui/UIFeedback.js';
import { PlanilhaService } from '../services/PlanilhaService.js';
import { DentesService } from '../services/DentesService.js';

/**
 * Controlador responsável por orquestrar a interface do formulário e o fluxo de dados.
 * Atua estritamente como mediador (sem tocar diretamente no DOM).
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
	 * Inicializa o controlador, configurando os eventos e realizando a primeira renderização.
	 */
	static init() {
		this.setupListeners();
		this.renderizar();
	}

	/**
	 * Configura os ouvintes de eventos para os campos de seleção principais.
	 */
	static setupListeners() {
		const elementoSelecaoIndice = document.getElementById('selecao-indice');
		const elementoSelecaoDistribuicao = document.getElementById('selecao-distribuicao');
		const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');

		if (elementoSelecaoIndice) {
			elementoSelecaoIndice.addEventListener('change', () => this.renderizar());
		}

		if (elementoSelecaoDistribuicao) {
			elementoSelecaoDistribuicao.addEventListener('change', () => this.renderizar());
		}

		if (elementoSelecaoClassificacao) {
			elementoSelecaoClassificacao.addEventListener('change', (evento) => {
				const sistemaAlvoSelecionado = evento.target.value;
				FormRenderer.atualizarSistemaNumeracao(sistemaAlvoSelecionado);
			});
		}
	}

	/**
	 * Renderiza a grade de dentes na tela com base nas opções selecionadas no filtro.
	 */
	static renderizar() {
		const elementoSelecaoIndice = document.getElementById('selecao-indice');
		const elementoSelecaoDistribuicao = document.getElementById('selecao-distribuicao');
		const containerFormulario = document.getElementById('container-formulario');

		if (!elementoSelecaoIndice || !elementoSelecaoDistribuicao || !containerFormulario) {
			console.warn('FormController: Elementos base não encontrados para renderização.');
			return;
		}

		const valorIndiceAtual = elementoSelecaoIndice.value;
		const valorDistribuicaoAtual = elementoSelecaoDistribuicao.value;

		if (
			this.estado.indice === valorIndiceAtual &&
			this.estado.distribuicao === valorDistribuicaoAtual
		) {
			return;
		}

		ViewManager.mudarTituloCard(valorIndiceAtual);
		FormRenderer.atualizarOpcoesDistribuicao(valorIndiceAtual);

		const quadrantesDoSistema = FormRenderer.obterQuadrantes(valorIndiceAtual);
		const ehDistribuicaoTotal = valorDistribuicaoAtual === 'total';

		let configuracaoComponentes = null;

		if (!ehDistribuicaoTotal) {
			configuracaoComponentes =
				valorIndiceAtual === 'cpo-d'
					? FormRenderer.obterConfiguracaoCPOD()
					: FormRenderer.obterConfiguracaoCEOD();
		}

		containerFormulario.innerHTML = FormRenderer.gerarEstruturaArcos(
			quadrantesDoSistema,
			configuracaoComponentes,
		);

		this.estado = { indice: valorIndiceAtual, distribuicao: valorDistribuicaoAtual };

		const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');
		const sistemaAlvo = elementoSelecaoClassificacao ? elementoSelecaoClassificacao.value : 'fdi';

		FormRenderer.atualizarSistemaNumeracao(sistemaAlvo);
		FormRenderer.atualizarEstadoInputs(valorIndiceAtual, valorDistribuicaoAtual);
	}

	/**
	 * Gerencia a importação e leitura do arquivo de planilha.
	 * Aciona o serviço de processamento e lida com o feedback de interface.
	 * @param {File} file - Arquivo enviado pelo input file.
	 */
	static async handleImport(file) {
		try {
			const tipoDeFormularioEnum = this.obterTipoEnum();
			const elementoSelecaoClassificacao = document.getElementById('selecao-classificacao');
			const classificacaoSelecionada = elementoSelecaoClassificacao
				? elementoSelecaoClassificacao.value
				: 'fdi';

			let componenteAlvoSelecionado = 'TODOS';

			if (this.estado.distribuicao === 'componente-c') {
				componenteAlvoSelecionado = DentesService.COMPONENTES.CARIADO;
			} else if (this.estado.distribuicao === 'componente-p') {
				componenteAlvoSelecionado = DentesService.COMPONENTES.PERDIDO;
			} else if (this.estado.distribuicao === 'componente-o') {
				componenteAlvoSelecionado = DentesService.COMPONENTES.OBTURADO;
			}

			const resultadoProcessamento = await PlanilhaService.processarPlanilha(
				file,
				tipoDeFormularioEnum,
				classificacaoSelecionada,
				componenteAlvoSelecionado,
			);

			this.preencherDadosNaTela(
				resultadoProcessamento.dados,
				resultadoProcessamento.totalParticipantes,
				componenteAlvoSelecionado,
				classificacaoSelecionada,
			);
		} catch (erroDeImportacao) {
			UI.notificarErroPlanilha(erroDeImportacao);
		}
	}

	/**
	 * Distribui os dados processados da planilha para os respectivos inputs do HTML.
	 * @param {Map} dadosMap - O mapa contendo os dentes e seus valores.
	 * @param {number} totalParticipantes - O número total de pacientes lido da planilha.
	 * @param {string} componenteAlvo - Indica se estamos preenchendo TODOS ou um específico.
	 * @param {string} classificacaoSelecionada - O sistema de numeração alvo (ex: 'fdi' ou 'ada').
	 */
	static preencherDadosNaTela(
		dadosMap,
		totalParticipantes,
		componenteAlvo,
		classificacaoSelecionada,
	) {
		const inputTotalParticipantes = document.getElementById('total-participantes');

		if (inputTotalParticipantes) {
			inputTotalParticipantes.value = totalParticipantes;
		}

		const ehDistribuicaoTotal = this.estado.distribuicao === 'total';
		const configuracaoComponentes =
			this.estado.indice === 'cpo-d'
				? FormRenderer.obterConfiguracaoCPOD()
				: FormRenderer.obterConfiguracaoCEOD();

		dadosMap.forEach((valorExtraido, chaveDoDente) => {
			if (ehDistribuicaoTotal) {
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					'total',
					valorExtraido,
					classificacaoSelecionada,
				);
			} else if (componenteAlvo === 'TODOS') {
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idC,
					valorExtraido.cariado,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idPE,
					valorExtraido.perdido,
					classificacaoSelecionada,
				);
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					configuracaoComponentes.idO,
					valorExtraido.obturado,
					classificacaoSelecionada,
				);
			} else {
				const mapaDeSufixos = {
					[DentesService.COMPONENTES.CARIADO]: configuracaoComponentes.idC,
					[DentesService.COMPONENTES.PERDIDO]: configuracaoComponentes.idPE,
					[DentesService.COMPONENTES.OBTURADO]: configuracaoComponentes.idO,
				};

				const sufixoDoInput = mapaDeSufixos[componenteAlvo] || '';
				FormRenderer.injetarValorNoInput(
					chaveDoDente,
					sufixoDoInput,
					valorExtraido,
					classificacaoSelecionada,
				);
			}
		});
	}

	/**
	 * Determina o tipo de formulário a ser processado com base no estado atual.
	 * @returns {number} O identificador numérico do enumerador TIPO_FORMULARIO.
	 */
	static obterTipoEnum() {
		const { indice, distribuicao } = this.estado;
		const ehDistribuicaoTotal = distribuicao === 'total';

		if (indice === 'cpo-d') {
			return ehDistribuicaoTotal
				? PlanilhaService.TIPO_FORMULARIO.CPOD_TOTAL
				: PlanilhaService.TIPO_FORMULARIO.CPOD_POR_COMPONENTE;
		}

		return ehDistribuicaoTotal
			? PlanilhaService.TIPO_FORMULARIO.CEOD_TOTAL
			: PlanilhaService.TIPO_FORMULARIO.CEOD_POR_COMPONENTE;
	}
}
