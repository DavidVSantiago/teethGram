const tipoFormulario = { // simulação de ENUM em js ... Não pode ser 0, return entende como Null
    CEOD_POR_COMP: 1,
    CEOD_TOTAL: 2,
    CPOD_POR_COMP: 3,
    CPOD_TOTAL: 4,
};
//MAPA DE DESCRIÇÃO PARA FORMATAR A PLANILHA, 
//POIS O ENUM ACIMA RETORNA SOMENTE UM NUMERO E PRECISO DO NOME PARA FORMATAR
const tipoFormularioDescricao = {
    [tipoFormulario.CEOD_POR_COMP]: "ceod-por-comp",
    [tipoFormulario.CEOD_TOTAL]: "ceod-total",
    [tipoFormulario.CPOD_POR_COMP]: "cpod-por-comp",
    [tipoFormulario.CPOD_TOTAL]: "cpod-total"
};

const QTD_COLUNAS_CEOD = 20;
const QTD_COLUNAS_CPOD = 32;


// caminho dos arquivos das planilhas
const localArquivos = "planilhas/"; // (TODO - mudar para o endereço do servidor)

// Caminhos dos arquivos CEOD
const arquivosCEOD = {
    TOTAL: `${localArquivos}Total-ceo-d.xlsx`,
    POR_COMP: `${localArquivos}PComp-ceo-d.xlsx`
};

// Caminhos dos arquivos CPO-D
const arquivosCPOD = {
    TOTAL: `${localArquivos}Total-cpo-d.xlsx`,
    POR_COMP: `${localArquivos}PComp-cpo-d.xlsx`
};

/*************************************************************************************** */
/** FUNÇÕES DOS BOTÕES DA TELA */
/*************************************************************************************** */
function downloadBtn() {

    let tpForm = verificaTipoFormulario();
    let nomeArquivo = "";
    switch (tpForm) {
        case tipoFormulario.CEOD_POR_COMP:
            nomeArquivo = arquivosCEOD.POR_COMP;
            break;
        case tipoFormulario.CEOD_TOTAL:
            nomeArquivo = arquivosCEOD.TOTAL;
            break;
        case tipoFormulario.CPOD_POR_COMP:
            nomeArquivo = arquivosCPOD.POR_COMP;
            break;
        case tipoFormulario.CPOD_TOTAL:
            nomeArquivo = arquivosCPOD.TOTAL;
            break;
    }
    if (!nomeArquivo) {
        alert("Arquivo não identificado para este formulário.");
        return;
    }
    // disparar o download programaticamente
    const link = document.createElement("a");
    link.href = nomeArquivo;
    link.download = nomeArquivo.split("/").pop();
    document.body.appendChild(link);
    link.click();
    link.remove();
    console.log("teste downloadBtn");
}

function selectFileBtn() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx, .xls";
    input.style.display = "none";

    document.body.appendChild(input);
    input.click();

    input.addEventListener("change", e => { // evento disparado quando o arquivo é selecionado
        const arquivo = e.target.files[0];
        if (arquivo) selectFileCallback(arquivo);
        input.remove();
    });

    console.log("Aguardando seleção do arquivo");
}

function generateBtn() {
    //TODO - implementar a lógica do download dos arquivos 
    console.log("teste generateBtn");
}

/****************************************************************************************/
/** FUNÇÕES AUXILIARES*/
/****************************************************************************************/

// TODO (Dominique) - criar aqui as funções de validação das planilhas dentre outras...
function verificaTipoFormulario() {
    const indice = indexSelect.value;        // "CPO-D" ou "ceo-d"
    const distribuicao = distSelect.value;   // "TOTAL", "COMPONENTE", etc.
    // CEOD
    if (indice === "ceo-d") {
        if (distribuicao === "TOTAL") return tipoFormulario.CEOD_TOTAL;
        return tipoFormulario.CEOD_POR_COMP;
    }
    // CPOD
    if (indice === "CPO-D") {
        if (distribuicao === "TOTAL") return tipoFormulario.CPOD_TOTAL;
        return tipoFormulario.CPOD_POR_COMP;
    }

    return null;
}

//FUNÇÃO PARA VERIFICAR O TIPO DA PLANILHA SELECIONADA 
function identificarTipoPlanilha(dadosMatriz) {

    if (!dadosMatriz || dadosMatriz.length === 0) {
        return null;
    }

    const header = dadosMatriz[0];
    const linhas = dadosMatriz.slice(1);

    //IDENTIFICAR CEOD ou CPOD

    // coluna "Código"
    const indexCodigo = header.findIndex(h =>
        String(h).toLowerCase().includes("código")
    );

    if (indexCodigo === -1) {
        console.error("Coluna 'Código' não encontrada");
        return null;
    }

    // conta colunas numéricas após "Código"
    const colunasNumericas = header
        .slice(indexCodigo + 1)
        .filter(h => /^\d+$/.test(h));

    let tipoIndice = null;

    if (colunasNumericas.length === QTD_COLUNAS_CEOD) {
        tipoIndice = "CEOD";
    } else if (colunasNumericas.length === QTD_COLUNAS_CPOD) {
        tipoIndice = "CPOD";
    } else {
        console.error("Quantidade de colunas inválida:", colunasNumericas.length);
        return null;
    }

    //IDENTIFICAR TOTAL ou POR_COMP

    // linhas válidas da coluna Código
    const linhasCodigo = linhas
        .map(l => String(l[0]).toLowerCase())
        .filter(v => v && !v.includes("particip"));

    // verifica presença de termos agregados
    const possuiTotais = linhasCodigo.some(v =>
        v.includes("cariado") ||
        v.includes("perdido") ||
        v.includes("obturado")
    );

    const tipoDistribuicao = possuiTotais
        ? "POR_COMP"
        : "TOTAL";
    // RETORNO FINAL
    if (tipoIndice === "CEOD" && tipoDistribuicao === "TOTAL")
        return tipoFormulario.CEOD_TOTAL;

    if (tipoIndice === "CEOD" && tipoDistribuicao === "POR_COMP")
        return tipoFormulario.CEOD_POR_COMP;

    if (tipoIndice === "CPOD" && tipoDistribuicao === "TOTAL")
        return tipoFormulario.CPOD_TOTAL;

    if (tipoIndice === "CPOD" && tipoDistribuicao === "POR_COMP")
        return tipoFormulario.CPOD_POR_COMP;

    return null;
}

//FUNÇÃO PARA FORMATAR OS DADOS DA PLANILHA
function formataPlanilha(dados, tpFormPlanilha) {

    const header = dados[0];
    const linhas = dados.slice(1);

    const colunas = header
        .map((h, i) => /^\d+$/.test(h) ? i : null)
        .filter(i => i !== null);

    let totalParticipantes = null;

    for (const linha of linhas) {
        if (String(linha[0]).toLowerCase().includes("particip")) {
            for (const i of colunas) {
                if (linha[i] !== "") {
                    totalParticipantes = parseInt(linha[i]);
                    break;
                }
            }
        }
    }

    const data = [];

    const isTotal =
        tpFormPlanilha === tipoFormulario.CEOD_TOTAL ||
        tpFormPlanilha === tipoFormulario.CPOD_TOTAL;

    if (isTotal) {
        // ===== TOTAL =====
        const linhaTotal = linhas.find(l =>
            l[0] && String(l[0]).toLowerCase().includes("total")
        );

        for (const colIndex of colunas) {
            let valor = linhaTotal?.[colIndex] ?? "";

            valor = valor === ""
                ? ""
                : Number(
                    parseFloat(String(valor).replace(",", "."))
                        .toFixed(2)
                );

            data.push(isNaN(valor) ? "" : valor);
        }

    } else {
        // ===== POR COMPONENTE =====
        for (const colIndex of colunas) {
            for (const linha of linhas) {

                if (String(linha[0]).toLowerCase().includes("particip")) continue;

                let valor = linha[colIndex];

                if (valor === "") {
                    data.push("");
                } else {
                    valor = parseFloat(
                        String(valor).replace(",", ".").replace(/"/g, "")
                    );
                    data.push(isNaN(valor) ? "" : Number(valor.toFixed(2)));
                }
            }
        }
    }

    return {
        tipo: tipoFormularioDescricao[tpFormPlanilha],
        totalParticipantes,
        data
    };
}

/** Esta função é invocada automaticamente depois que o usuário
* chama a função 'selectFileBtn()', seleciona o arquivo e clica em OK
*/
function selectFileCallback(file) {

    const tpFormTela = verificaTipoFormulario();
    if (!tpFormTela) {
        alert("Tipo de formulário não identificado na tela.");
        return;
    }

    const reader = new FileReader();

    reader.onload = e => {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const dadosMatriz = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            blankrows: true
        });
        //============================================================================
        // Validar estrutura da planilha aqui
        //valida a planilha APÓS leitura
        const tpFormPlanilha = identificarTipoPlanilha(dadosMatriz);
        if (!tpFormPlanilha) {
            alert("Planilha inválida ou não reconhecida.");
            return;
        }
        //compara planilha × formulário
        if (tpFormPlanilha !== tpFormTela) {
            alert(
                `Formulário incompatível!\n\n` +
                `• Formulário selecionado na tela: ${tipoFormularioDescricao[tpFormTela]}\n` +
                `• Formulário identificado na planilha: ${tipoFormularioDescricao[tpFormPlanilha]}`
            );
            return;
        }
        //============================================================================
        //Formatar os dados da planilha
        const planilha = formataPlanilha(dadosMatriz, tpFormPlanilha);

        console.log("Objeto final", planilha);
    };

    reader.readAsArrayBuffer(file);
}