const btnSalvarImagem = document.getElementById("btn-save-image");

btnSalvarImagem.addEventListener("click", () => {
  const section = document.getElementById("section-to-image");

  html2canvas(section).then((canvas) => {
    // Converte o canvas em uma imagem
    const imagem = canvas.toDataURL("image/png");

    //criar um link para download
    const link = document.createElement("a");
    link.href = imagem;
    link.download = "histograma.png"; //nome do arquivo
    link.click();  // Simula o clique para baixar a imagem
  });
});
