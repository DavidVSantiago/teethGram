import { t } from '../i18n.js';

/**
 * Gerenciador de Feedback Visual e Modais da aplicação.
 * Centraliza alertas e interações imperativas com o usuário, isolando
 * a manipulação do DOM relacionada a avisos.
 */
export const UI = {
	/**
	 * Exibe um alerta no modal principal da interface.
	 * @param {string} titulo - Título a ser exibido no cabeçalho do modal.
	 * @param {string} htmlConteudo - Conteúdo HTML estruturado para o corpo do modal.
	 */
	exibirAlerta(titulo, htmlConteudo) {
		const modal = document.getElementById('janela-modal');
		const elementoTitulo = document.getElementById('modal-titulo');
		const elementoMensagem = document.getElementById('modal-mensagem');

		if (!modal || !elementoTitulo || !elementoMensagem) return;

		elementoTitulo.textContent = titulo;
		elementoMensagem.innerHTML = htmlConteudo;
		modal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	},

	/**
	 * Oculta o modal de feedback da interface visualmente.
	 */
	fecharModal() {
		const modal = document.getElementById('janela-modal');

		if (modal) {
			modal.style.display = 'none';
		}
		document.body.style.overflow = 'auto';
	},

	/**
	 * Notifica os erros de importação de planilha de forma organizada e legível.
	 * Extrai um array JSON de dentro de uma string bruta e converte em lista HTML.
	 * @param {string} mensagemBruta - String gerada pelo sistema contendo detalhes do erro.
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
				.map((mensagemErro) => {
					return `
            <li class="erro-item">
              <strong class="marcador-erro">•</strong> ${mensagemErro}
            </li>
          `;
				})
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
