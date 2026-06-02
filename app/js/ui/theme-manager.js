/**
 * Gerenciador de Tema (Claro/Escuro).
 * Responsável por alternar o tema visual da aplicação, respeitar a preferência
 * do sistema operacional do usuário e persistir a escolha no navegador.
 */
export const ThemeManager = {
	CHAVE_STORAGE: 'teethgram_tema',

	/**
	 * Inicializa o gerenciador, carregando o tema salvo e atrelando os eventos.
	 */
	init() {
		this.carregarTemaSalvo();
		this.configurarOuvinte();
	},

	/**
	 * Configura a escuta no checkbox do cabeçalho que alterna o tema.
	 */
	configurarOuvinte() {
		const elementoToggleTema = document.getElementById('toggle-tema');

		if (!elementoToggleTema) {
			return;
		}

		elementoToggleTema.addEventListener('change', (evento) => {
			const isTemaEscuro = evento.target.checked;
			this.alternarTema(isTemaEscuro);
		});
	},

	/**
	 * Aplica a classe no body e salva a preferência no Local Storage.
	 * @param {boolean} isEscuro - Flag indicando se o tema deve ser escuro.
	 */
	alternarTema(isEscuro) {
		if (isEscuro) {
			document.body.classList.add('tema-escuro');
			localStorage.setItem(this.CHAVE_STORAGE, 'escuro');
		} else {
			document.body.classList.remove('tema-escuro');
			localStorage.setItem(this.CHAVE_STORAGE, 'claro');
		}
	},

	/**
	 * Verifica se há um tema salvo ou se o sistema operacional prefere o modo escuro.
	 */
	carregarTemaSalvo() {
		const temaSalvo = localStorage.getItem(this.CHAVE_STORAGE);
		const elementoToggleTema = document.getElementById('toggle-tema');

		const prefereSistemaEscuro =
			window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

		const deveSerEscuro = temaSalvo === 'escuro' || (!temaSalvo && prefereSistemaEscuro);

		if (deveSerEscuro) {
			document.body.classList.add('tema-escuro');

			if (elementoToggleTema) {
				elementoToggleTema.checked = true;
			}
		}
	},
};
