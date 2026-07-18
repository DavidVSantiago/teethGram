import { t } from '../I18nManager.js';

/**
 * Gerenciador de Feedback Visual e Modais da aplicação.
 * Centraliza alertas e interações imperativas com o usuário, isolando
 * a manipulação do DOM relacionada a avisos.
 */
export class UI {
	/**
	 * Escapa texto livre para uso seguro em blocos HTML internos.
	 * @param {string} valor
	 * @returns {string}
	 */
	static escaparHtml(valor) {
		return String(valor)
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	/**
	 * Determina se uma mensagem já vem em formato HTML estruturado, sem necessidade de escaping.
	 * @param {string} mensagem
	 * @returns {boolean}
	 */
	static ehMensagemHtmlEstruturada(mensagem) {
		const texto = String(mensagem ?? '');
		return (
			texto.includes('<div') ||
			texto.includes('<strong') ||
			texto.includes('<p') ||
			texto.includes('<ul') ||
			texto.includes('<li')
		);
	}

	/**
	 * Exibe um alerta no modal principal da interface.
	 * @param {string} titulo - Título a ser exibido no cabeçalho do modal.
	 * @param {string} htmlConteudo - Conteúdo HTML estruturado para o corpo do modal.
	 */
	static exibirAlerta(titulo, htmlConteudo) {
		const modal = document.getElementById('janela-modal');
		const elementoTitulo = document.getElementById('modal-titulo');
		const elementoMensagem = document.getElementById('modal-mensagem');

		if (!modal || !elementoTitulo || !elementoMensagem) return;

		elementoTitulo.textContent = titulo;
		elementoMensagem.innerHTML = htmlConteudo;
		modal.style.display = 'flex';
		document.body.style.overflow = 'hidden';
	}

	/**
	 * Oculta o modal de feedback da interface visualmente.
	 */
	static fecharModal() {
		const modal = document.getElementById('janela-modal');

		if (modal) {
			modal.style.display = 'none';
		}
		document.body.style.overflow = 'auto';
	}

	/**
	 * Converte uma lista de mensagens de erro em HTML controlado para o modal.
	 * @param {Array<string>} listaErros
	 * @returns {string}
	 */
	static formatarErrosParaHtml(listaErros) {
		const errosNormalizados =
			Array.isArray(listaErros) && listaErros.length > 0
				? listaErros
				: ['Erro desconhecido ao processar a planilha.'];

		const listaHtml = errosNormalizados
			.map((mensagemErro) => {
				const conteudoHtml = this.ehMensagemHtmlEstruturada(mensagemErro)
					? String(mensagemErro)
					: this.escaparHtml(mensagemErro);

				return `
            <li class="erro-item">
              <strong class="marcador-erro">•</strong> ${conteudoHtml}
            </li>
          `;
			})
			.join('');

		return `
      <ul class="alerta-comparativo">
        ${listaHtml}
      </ul>
    `;
	}

	/**
	 * Notifica os erros de importação de planilha de forma organizada e legível.
	 * @param {Error & { code?: string, detalhes?: Array<string> | Object }} erro - Objeto de erro estruturado.
	 */
	static notificarErroPlanilha(erro) {
		const mensagemBase = erro?.message ?? 'Erro desconhecido ao processar a planilha.';
		const listaErros =
			Array.isArray(erro?.detalhes) && erro.detalhes.length > 0 ? erro.detalhes : [mensagemBase];

		const htmlEstruturado = `
      <div class="modal-corpo">
        <p class="alerta-titulo">${t.modal?.inconsistencias ?? 'Inconsistências encontradas:'}</p>

        ${this.formatarErrosParaHtml(listaErros)}

        <div class="caixa-dica">
          <p class="alerta-dica">
            <strong>${t.modal?.dicaTitulo ?? 'Dica:'}</strong> ${t.modal?.dicaParticipantes ?? 'Verifique o total de participantes.'}
          </p>
        </div>
      </div>
    `;

		this.exibirAlerta(t.modal?.tituloErroImportacao ?? 'Erro na Importação', htmlEstruturado);
	}
}
