/**
 * Gerenciador de Tema (Claro/Escuro).
 * Responsável por alternar o tema visual da aplicação, respeitar a preferência
 * do sistema operacional do usuário e persistir a escolha no navegador.
 */
export class ThemeManager {
	static CHAVE_STORAGE = 'teethgram_tema';
	static CLASSE_TEMA_ESCURO = 'tema-escuro';

	static TEMAS = Object.freeze({
		ESCURO: 'escuro',
		CLARO: 'claro',
	});

	/**
	 * Inicializa o gerenciador, carregando o tema salvo e atrelando os eventos.
	 */
	static init() {
		this.carregarTemaSalvo();
		this.configurarOuvinte();
	}

	/**
	 * Configura a escuta no checkbox do cabeçalho que alterna o tema.
	 */
	static configurarOuvinte() {
		const elementoToggleTema = document.getElementById('toggle-tema');

		if (!elementoToggleTema) {
			return;
		}

		elementoToggleTema.addEventListener('change', (evento) => {
			const isTemaEscuro = evento.target.checked;
			this.alternarTema(isTemaEscuro);
		});
	}

	/**
	 * Persiste o tema escolhido em uma única camada.
	 * @param {string} tema
	 */
	static persistirTema(tema) {
		if (!Object.values(this.TEMAS).includes(tema)) {
			return;
		}

		localStorage.setItem(this.CHAVE_STORAGE, tema);
	}

	/**
	 * Centraliza a validação e a aplicação do tema.
	 * @param {string} tema
	 */
	static setTema(tema) {
		if (!Object.values(this.TEMAS).includes(tema)) {
			return;
		}

		const ehTemaEscuro = tema === this.TEMAS.ESCURO;
		document.body.classList.toggle(this.CLASSE_TEMA_ESCURO, ehTemaEscuro);
		this.persistirTema(tema);

		const elementoToggleTema = document.getElementById('toggle-tema');
		if (elementoToggleTema) {
			elementoToggleTema.checked = ehTemaEscuro;
		}
	}

	/**
	 * Aplica a classe no body e salva a preferência no Local Storage.
	 * @param {boolean} isEscuro - Flag indicando se o tema deve ser escuro.
	 */
	static alternarTema(isEscuro) {
		const tema = isEscuro ? this.TEMAS.ESCURO : this.TEMAS.CLARO;
		this.setTema(tema);
	}

	/**
	 * Verifica se há um tema salvo ou se o sistema operacional prefere o modo escuro.
	 */
	static carregarTemaSalvo() {
		const temaSalvo = localStorage.getItem(this.CHAVE_STORAGE);
		const prefereSistemaEscuro =
			window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

		let temaAtivo = this.TEMAS.CLARO;

		if (temaSalvo === this.TEMAS.ESCURO) {
			temaAtivo = this.TEMAS.ESCURO;
		} else if (temaSalvo === this.TEMAS.CLARO) {
			temaAtivo = this.TEMAS.CLARO;
		} else if (prefereSistemaEscuro) {
			temaAtivo = this.TEMAS.ESCURO;
		}

		this.setTema(temaAtivo);
	}
}
