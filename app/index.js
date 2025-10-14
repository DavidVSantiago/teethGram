//CODIGO PARA BAIXAR PLANILHA
document.addEventListener("DOMContentLoaded", () => {
  const planilhas = {
    "CPO-D": {
      "TOTAL": "planilhas/Total-cpo-d.xlsx",
      "COMPONENTE": "planilhas/PComp-cpo-d.xlsx",
      "CARIADO":"planilhas/PComp-cpo-d.xlsx",
      "OBTURADO":"planilhas/PComp-cpo-d.xlsx",
      "PERDIDO":"planilhas/PComp-cpo-d.xlsx"
    },
    "ceo-d": {
      "TOTAL": "planilhas/Total-ceo-d.xlsx",
      "COMPONENTE": "planilhas/PComp-ceo-d.xlsx",
      "CARIADO":"planilhas/PComp-ceo-d.xlsx",
      "OBTURADO":"planilhas/PComp-ceo-d.xlsx",
      "PERDIDO":"planilhas/PComp-ceo-d.xlsx"
    }
  };

  const downloadBtn = document.getElementById("downloadBtn");
  const indexSelect = document.getElementById("indexSelect");
  const distSelect = document.getElementById("distSelect");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const indice = indexSelect.value;
      const distribuicao = distSelect.value;

      const caminhoArquivo = planilhas[indice]?.[distribuicao];

      if (caminhoArquivo) {
        const link = document.createElement("a");
        link.href = caminhoArquivo;
        link.download = caminhoArquivo.split("/").pop();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Planilha não encontrada para esta combinação de Índice e Distribuição.");
      }
    });
  }
});
//FIM CODIGO BAIXAR PLANILHA
