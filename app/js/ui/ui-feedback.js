import { t } from '../i18n.js';

/**
 * Gerenciador de Feedback Visual e Modais da aplicação.
 * Centraliza alertas e interações imperativas com o usuário, isolando
 * a manipulação do DOM relacionada a avisos.
 */
export const UI = {
	/**
	 * Exibe um alerta no modal principal da interface.
	 */
	exibirAlerta(titulo, htmlConteudo) {
		const modal = document.getElementById('janela-modal');
		const tituloElem = document.getElementById('modal-titulo');
		const mensagemElem = document.getElementById('modal-mensagem');

		if (!modal || !tituloElem || !mensagemElem) return;

		tituloElem.textContent = titulo;
		mensagemElem.innerHTML = htmlConteudo;
		modal.style.display = 'flex';
	},

	/**
	 * Oculta o modal de feedback da interface.
	 */
	fecharModal() {
		const modal = document.getElementById('janela-modal');
		if (modal) modal.style.display = 'none';
	},

	/**
	 * Notifica os erros de importação de planilha de forma organizada e legível.
	 * @param {string} mensagemBruta - String contendo o array JSON de erros.
	 */
	notificarErroPlanilha(mensagemBruta) {
		let listaHtml = '';

		try {
			const inicioJson = mensagemBruta.indexOf('[');
			const fimJson = mensagemBruta.lastIndexOf(']') + 1;

			if (inicioJson === -1) {
				throw new Error('A mensagem não contém um formato de lista válido.');
			}

			const jsonPuro = mensagemBruta.substring(inicioJson, fimJson);
			const listaErros = JSON.parse(jsonPuro);

			listaHtml = listaErros
				.map(
					(msg) => `
						<li class="erro-item">
							<strong class="marcador-erro">•</strong> ${msg}
						</li>
					`,
				)
				.join('');
		} catch (erro) {
			listaHtml = `
				<div class="erro-fallback">
					${mensagemBruta}
				</div>
			`;
		}

		const htmlEstruturado = `
      <div class="modal-corpo">
        <p class="alerta-titulo">${t.modal?.inconsistencias ?? 'Inconsistências encontradas:'}</p>

        <ul class="alerta-comparativo">
          ${listaHtml}
        </ul>

        <div class="caixa-dica">
          <p class="alerta-dica">
            <strong>${t.modal?.dicaTitulo ?? 'Dica:'}</strong> ${t.modal?.dicaParticipantes ?? 'Verifique o total de participantes.'}
          </p>
        </div>
      </div>
    `;

		this.exibirAlerta(t.modal?.tituloErroImportacao ?? 'Erro na Importação', htmlEstruturado);
	},
};
