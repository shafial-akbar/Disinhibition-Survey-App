import { toPng } from 'html-to-image';

/**
 * Exports any chart container DOM node as a crisp high-DPI PNG image.
 */
export async function exportChartElementAsPng(domNode, filename = 'research_chart.png') {
  if (!domNode) {
    throw new Error('Chart container is not available for export.');
  }

  const dataUrl = await toPng(domNode, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return dataUrl;
}
