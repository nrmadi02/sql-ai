const SVG_STYLE_PROPS = [
  "fill",
  "stroke",
  "stroke-width",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "color",
] as const;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gagal memuat gambar SVG"));
    image.src = src;
  });
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copyComputedSvgStyles(from: Element, to: Element): void {
  if (!(from instanceof SVGElement) || !(to instanceof SVGElement)) {
    return;
  }

  const computed = getComputedStyle(from);

  const fill = computed.getPropertyValue("fill");
  if (fill && fill !== "none" && !fill.includes("var(")) {
    to.setAttribute("fill", fill);
  }

  const stroke = computed.getPropertyValue("stroke");
  if (stroke && stroke !== "none" && !stroke.includes("var(")) {
    to.setAttribute("stroke", stroke);
  }

  for (const prop of SVG_STYLE_PROPS) {
    const value = computed.getPropertyValue(prop);
    if (!value || value === "none") continue;
    if (prop === "fill" || prop === "stroke") continue;
    to.style.setProperty(prop, value);
  }
}

function inlineSvgStyles(source: SVGElement, target: SVGElement): void {
  copyComputedSvgStyles(source, target);

  const sourceNodes = source.querySelectorAll("*");
  const targetNodes = target.querySelectorAll("*");
  const limit = Math.min(sourceNodes.length, targetNodes.length);

  for (let index = 0; index < limit; index += 1) {
    copyComputedSvgStyles(sourceNodes[index]!, targetNodes[index]!);
  }
}

function prepareSvgClone(root: HTMLElement): SVGElement {
  const svg = root.querySelector("svg.recharts-surface");
  if (!(svg instanceof SVGElement)) {
    throw new Error("Elemen SVG grafik tidak ditemukan");
  }

  const rect = svg.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 1);
  const height = Math.max(Math.round(rect.height), 1);

  const cloned = svg.cloneNode(true) as SVGElement;
  cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  cloned.setAttribute("width", String(width));
  cloned.setAttribute("height", String(height));
  cloned.setAttribute("viewBox", `0 0 ${width} ${height}`);
  inlineSvgStyles(svg, cloned);

  return cloned;
}

async function exportSvgElementToPng(
  root: HTMLElement,
  filename: string,
): Promise<void> {
  const cloned = prepareSvgClone(root);
  const svgString = new XMLSerializer().serializeToString(cloned);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = await loadImage(objectUrl);
    const scale = 2;
    const width = image.naturalWidth || cloned.clientWidth || root.clientWidth;
    const height =
      image.naturalHeight || cloned.clientHeight || root.clientHeight;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(width * scale, 1);
    canvas.height = Math.max(height * scale, 1);

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas tidak tersedia");
    }

    const background = getComputedStyle(root).backgroundColor;
    context.fillStyle =
      !background || background === "transparent" || background === "rgba(0, 0, 0, 0)"
        ? "#ffffff"
        : background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);

    downloadDataUrl(canvas.toDataURL("image/png"), filename);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function exportHtmlElementToPng(
  root: HTMLElement,
  filename: string,
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(root, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  downloadDataUrl(canvas.toDataURL("image/png"), filename);
}

export async function exportChartElementToPng(
  root: HTMLElement,
  filename: string,
): Promise<void> {
  const hasSvg = Boolean(root.querySelector("svg.recharts-surface"));

  if (hasSvg) {
    await exportSvgElementToPng(root, filename);
    return;
  }

  await exportHtmlElementToPng(root, filename);
}