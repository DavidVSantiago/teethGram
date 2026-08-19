/**
 * Gerenciador de Tema (Claro/Escuro).
 * Responsável por alternar o tema visual da aplicação, respeitar a preferência
 * do sistema operacional do usuário e persistir a escolha no navegador.
 */
export class ThemeManager {
	/**
	 * Chave utilizada para persistência no LocalStorage.
	 * @type {string}
	 */
	static CHAVE_STORAGE = 'teethgram_tema';

	/**
	 * Classe CSS aplicada ao body para atuar sobre as variáveis CSS de tema escuro.
	 * @type {string}
	 */
	static CLASSE_TEMA_ESCURO = 'tema-escuro';

	/**
	 * Mapeamento dos nomes de temas aceitos.
	 * @readonly
	 * @type {Readonly<{ESCURO: string, CLARO: string}>}
	 */
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
		this.configurarOuvinteSistema();
	}

	/**
	 * Configura a escuta no checkbox/toggle do cabeçalho que alterna o tema.
	 */
	static configurarOuvinte() {
		const elementoToggleTema = document.getElementById('toggle-tema');

		if (!elementoToggleTema) return;

		elementoToggleTema.addEventListener('change', (evento) => {
			const isTemaEscuro = evento.target.checked;
			this.alternarTema(isTemaEscuro);
		});
	}

	/**
	 * Escuta alterações de tema do sistema operacional quando não houver preferência salva pelo usuário.
	 */
	static configurarOuvinteSistema() {
		if (!window.matchMedia) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', (evento) => {
			const temaSalvo = localStorage.getItem(this.CHAVE_STORAGE);
			if (!temaSalvo) {
				this.setTema(evento.matches ? this.TEMAS.ESCURO : this.TEMAS.CLARO, false);
			}
		});
	}

	/**
	 * Persiste o tema escolhido no LocalStorage.
	 * @param {string} tema - Nome do tema ('escuro' ou 'claro').
	 */
	static persistirTema(tema) {
		if (!Object.values(this.TEMAS).includes(tema)) return;
		localStorage.setItem(this.CHAVE_STORAGE, tema);
	}

	/**
	 * Centraliza a validação e a aplicação do tema no DOM e UI.
	 * @param {string} tema - Nome do tema a ser aplicado.
	 * @param {boolean} [devePersistir=true] - Define se a escolha deve ser salva no storage.
	 */
	static setTema(tema, devePersistir = true) {
		if (!Object.values(this.TEMAS).includes(tema)) return;

		const ehTemaEscuro = tema === this.TEMAS.ESCURO;
		document.body.classList.toggle(this.CLASSE_TEMA_ESCURO, ehTemaEscuro);

		if (devePersistir) {
			this.persistirTema(tema);
		}

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
	 * Verifica se há um tema salvo no LocalStorage ou se o sistema operacional prefere o modo escuro.
	 */
	static carregarTemaSalvo() {
		const temaSalvo = localStorage.getItem(this.CHAVE_STORAGE);

		if (temaSalvo && Object.values(this.TEMAS).includes(temaSalvo)) {
			this.setTema(temaSalvo, false);
			return;
		}

		const prefereSistemaEscuro = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

		const temaInicial = prefereSistemaEscuro ? this.TEMAS.ESCURO : this.TEMAS.CLARO;
		this.setTema(temaInicial, false);
	}
}
