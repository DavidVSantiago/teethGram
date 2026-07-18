/**
 * Gerenciador de Zoom de Acessibilidade.
 * Aplica um scale() via classe CSS para contornar a limitação de zoom
 * nativo em layouts baseados em Viewport Width (vw).
 */
export class ZoomManager {
	static CHAVE_STORAGE = 'teethgram_zoom_ativo';
	static CLASSE_ZOOM_ATIVO = 'zoom-ativo';

	static ESTADO_ZOOM = Object.freeze({
		ATIVO: 'true',
		INATIVO: 'false',
	});

	/**
	 * Inicializa o gerenciador carregando o estado salvo e configurando os ouvintes.
	 */
	static init() {
		this.carregarEstadoSalvo();
		this.configurarOuvinte();
	}

	/**
	 * Persiste o estado do zoom em uma única camada.
	 * @param {string} valor - O estado do zoom a ser salvo (true/false como string).
	 */
	static persistirEstado(valor) {
		if (!Object.values(this.ESTADO_ZOOM).includes(valor)) {
			return;
		}

		localStorage.setItem(this.CHAVE_STORAGE, valor);
	}

	/**
	 * Centraliza a validação e a aplicação do zoom ativo.
	 * @param {boolean} valor - Define se o zoom deve ser ativado ou desativado.
	 */
	static setZoomAtivo(valor) {
		const estado = valor ? this.ESTADO_ZOOM.ATIVO : this.ESTADO_ZOOM.INATIVO;

		document.body.classList.toggle(this.CLASSE_ZOOM_ATIVO, valor);
		this.persistirEstado(estado);

		const elementoToggleZoom = document.getElementById('toggle-zoom');
		if (elementoToggleZoom) {
			elementoToggleZoom.checked = valor;
		}
	}

	/**
	 * Verifica o localStorage ao carregar a página e aplica o zoom se necessário.
	 */
	static carregarEstadoSalvo() {
		const estadoSalvo = localStorage.getItem(this.CHAVE_STORAGE);
		const zoomAtivo = estadoSalvo === this.ESTADO_ZOOM.ATIVO;

		this.setZoomAtivo(zoomAtivo);
	}

	/**
	 * Configura o ouvinte de eventos no toggle de zoom.
	 */
	static configurarOuvinte() {
		const elementoToggleZoom = document.getElementById('toggle-zoom');

		if (!elementoToggleZoom) return;

		elementoToggleZoom.addEventListener('change', (evento) => {
			this.setZoomAtivo(evento.target.checked);
		});
	}
}
