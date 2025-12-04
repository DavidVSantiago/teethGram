/*************************************************************************************** */
/** FUNÇÃO DE GERAÇÃO DO FORMULÁRIO */
/*************************************************************************************** */

document.addEventListener('DOMContentLoaded', function() {
    gerarFormulario();
});

function gerarFormulario(){
    let form_container = document.querySelector("#form-container");
    form_container.innerHTML = "Teste";
    /* TODO (william) - implementar a lógica de geração do formulário 
        - checar as opções dos campos e definir qual dos 4 formularios será gerado
        - a geração consiste em copiar o conteúdo de um dos 4 arquivos .html deste diretório e enchertar dentro da div #form-container (em index.html)
        - criar dentro da função as variáveis para apontar para os componentes*/

}

/*************************************************************************************** */
/** FUNÇÃO AUXILIARES */
/*************************************************************************************** */

