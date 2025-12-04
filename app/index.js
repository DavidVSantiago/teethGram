const tipoFormulario = { // simulação de ENUM em js
  CEOD_POR_COMP: 0,
  CEOD_TOTAL: 1,
  CPOD_POR_COMP: 2,
  CPOD_TOTAL: 3,
};

/*************************************************************************************** */
/** FUNÇÕES DOS BOTÕES DA TELA */
/*************************************************************************************** */
function downloadBtn(){

    let tpForm = verificaTipoFormulario();
    let nomeArquivo = "";
    switch (tpForm) {
        case tipoFormulario.CEOD_POR_COMP:
            // construir dinamicamente "nomeArquivo"
            break;
        case tipoFormulario.CEOD_TOTAL:
            // construir dinamicamente "nomeArquivo"
            break;
        case tipoFormulario.CPOD_POR_COMP:
            // construir dinamicamente "nomeArquivo"
            break;
        case tipoFormulario.CPOD_TOTAL:
            // construir dinamicamente "nomeArquivo"
            break;
    }

    // disparar o download programaticamente
    console.log("teste downloadBtn");
}

function selectFileBtn(){
    //TODO (Dominique) - implementar a lógica do download dos arquivos 
    // exibir a janela para carregar o arquivo
    console.log("teste selectFileBtn");
}

function generateBtn(){
    //TODO (Dominique) - implementar a lógica do download dos arquivos 
    console.log("teste generateBtn");
}

/*************************************************************************************** */
/** FUNÇÕES AUXILIARES */
/*************************************************************************************** */


// TODO (Dominique) - criar aqui as funções de validação das planilhas dentre outras...
function verificaTipoFormulario(){

    // capturar os compoennte
    // checar os valores e criar a lógica para determinar o tipo de formulario
    return tipoFormulario.CPOD_POR_COMP;
}

/** Esta função é invocada automaticamente depois que o usuário
 * chama a função 'selectFileBtn()', seleciona o arquivo e clica em OK
 */
function selectFileCallback(){
    // carregar o arquivo .xlsx
    // fazer as validações
    let tpForm = verificaTipoFormulario();
    // verificar o tipo de formulário e ver se a estrutura da planilha é condizente com o formulário atual
}   