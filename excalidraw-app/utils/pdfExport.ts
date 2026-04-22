export const printImageAsPdf = (dataUrl: string, title = "EduDraw") => {
  const win = window.open("", "_blank");
  if (!win) {
    alert("Permití las ventanas emergentes para exportar el PDF.");
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; background: #fff; }
    .page { display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; padding: 10mm; }
    img { max-width: 100%; height: auto; display: block; }
    @page { margin: 10mm; size: auto; }
    @media print { .page { padding: 0; } img { width: 100%; } }
  </style>
</head>
<body>
  <div class="page">
    <img src="${dataUrl}" onload="window.focus(); window.print();" />
  </div>
</body>
</html>`);
  win.document.close();
};

export const printSvgAsPdf = (svgEl: SVGSVGElement, title = "EduDraw") => {
  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
  printImageAsPdf(dataUrl, title);
};
