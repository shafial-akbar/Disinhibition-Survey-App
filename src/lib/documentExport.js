/**
 * One-click PDF + Word (.doc) document generator with full English & Bengali Unicode support.
 * Uses an offscreen high-DPI A4 canvas to render text (including Noto Sans Bengali shaping)
 * into a genuine binary PDF-1.4 document, alongside a formatted Microsoft Word (.doc) file.
 */

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generates a Microsoft Word (.doc) Blob from structured document sections.
 */
export function buildWordDocumentBlob({ title, subtitle, badge, sections = [], footerNote = '' }) {
  const sectionHtml = sections
    .map(sec => {
      const paragraphs = (sec.paragraphs || [])
        .map(
          p =>
            `<p style="margin:6pt 0;font-size:11pt;line-height:1.6;color:#1e2c40;">${escapeHtml(
              p
            )}</p>`
        )
        .join('');

      const bullets =
        Array.isArray(sec.bullets) && sec.bullets.length > 0
          ? `<ul style="margin:6pt 0 6pt 18pt;padding:0;color:#1e2c40;font-size:11pt;line-height:1.6;">${sec.bullets
              .map(b => `<li style="margin:4pt 0;">${escapeHtml(b)}</li>`)
              .join('')}</ul>`
          : '';

      const highlight = sec.highlight
        ? `<p style="margin:8pt 0 2pt;padding:8pt 10pt;background:#eef3fd;border-left:3pt solid #2b52b0;font-weight:bold;font-size:10.5pt;color:#1d3b82;">${escapeHtml(
            sec.highlight
          )}</p>`
        : '';

      return `
        <div style="margin-bottom:14pt;padding:12pt 14pt;border:1pt solid #dde4ef;border-radius:6pt;background:#fbfcfe;">
          <h3 style="margin:0 0 6pt;font-size:13pt;color:#0f1a2c;font-family:'Manrope','Noto Sans Bengali',Arial,sans-serif;">
            ${escapeHtml(sec.heading)}
          </h3>
          ${paragraphs}
          ${bullets}
          ${highlight}
        </div>
      `;
    })
    .join('\n');

  const html = `\ufeff<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: 21cm 29.7cm;
      margin: 2cm;
    }
    body {
      font-family: 'DM Sans', 'Noto Sans Bengali', 'Nirmala UI', Arial, sans-serif;
      color: #111c2d;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div style="margin-bottom:16pt;padding:14pt 16pt;background:#f2f6ff;border-left:4pt solid #2b52b0;">
    ${
      badge
        ? `<div style="font-size:9pt;font-weight:bold;color:#23479e;letter-spacing:1px;margin-bottom:4pt;">${escapeHtml(
            badge
          )}</div>`
        : ''
    }
    <h1 style="margin:0;font-size:17pt;color:#0f1a2c;line-height:1.35;">${escapeHtml(title)}</h1>
    ${
      subtitle
        ? `<p style="margin:6pt 0 0;font-size:11pt;color:#253449;">${escapeHtml(subtitle)}</p>`
        : ''
    }
  </div>
  ${sectionHtml}
  ${
    footerNote
      ? `<p style="margin-top:16pt;font-size:9.5pt;color:#46566e;text-align:center;">${escapeHtml(
          footerNote
        )}</p>`
      : ''
  }
</body>
</html>`;

  return new Blob([html], { type: 'application/msword;charset=utf-8' });
}

/**
 * Wraps text lines to fit within maxWidth on a 2D canvas context.
 */
function wrapCanvasLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!word) continue;
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Packs an array of A4 JPEG page byte arrays into a valid multi-page binary PDF-1.4 Blob.
 */
function buildPdfFromJpegPages(pages) {
  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;

  const pushString = str => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = bytes => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  // Object numbering:
  // 1: Catalog
  // 2: Pages
  // For each page i (0..N-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imageObjId = 5 + i * 3
  const totalObjects = 2 + pages.length * 3;
  const offsets = new Array(totalObjects + 1).fill(0);

  pushString('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  offsets[1] = offset;
  pushString('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  const kidsRefs = pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  offsets[2] = offset;
  pushString(
    `2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${pages.length} >>\nendobj\n`
  );

  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;

  pages.forEach((page, i) => {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imageObjId = 5 + i * 3;
    const imgName = `/Im${i + 1}`;

    const contentStream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n${imgName} Do\nQ\n`;
    const contentBytes = encoder.encode(contentStream);

    // Page object
    offsets[pageObjId] = offset;
    pushString(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${pageWidthPt} ${pageHeightPt} ] /Resources << /XObject << ${imgName} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    // Content stream object
    offsets[contentObjId] = offset;
    pushString(`${contentObjId} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushString('\nendstream\nendobj\n');

    // Image XObject
    offsets[imageObjId] = offset;
    pushString(
      `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`
    );
    pushBytes(page.bytes);
    pushString('\nendstream\nendobj\n');
  });

  const xrefOffset = offset;
  pushString(`xref\n0 ${totalObjects + 1}\n`);
  pushString('0000000000 65535 f \n');
  for (let objId = 1; objId <= totalObjects; objId += 1) {
    const padded = String(offsets[objId]).padStart(10, '0');
    pushString(`${padded} 00000 n \n`);
  }

  pushString(
    `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Renders structured document sections onto high-DPI A4 canvases (supporting English + Bengali fonts)
 * and returns a genuine binary PDF Blob.
 */
export function buildPdfDocumentBlob({ title, subtitle, badge, sections = [], footerNote = '' }) {
  const canvasWidth = 1240;
  const canvasHeight = 1754;
  const marginX = 90;
  const marginY = 90;
  const contentWidth = canvasWidth - marginX * 2;
  const fontStack = `'DM Sans', "Noto Sans Bengali", Arial, sans-serif`;

  const canvases = [];
  let currentCanvas = null;
  let ctx = null;
  let cursorY = marginY;

  const startNewPage = () => {
    currentCanvas = document.createElement('canvas');
    currentCanvas.width = canvasWidth;
    currentCanvas.height = canvasHeight;
    ctx = currentCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.textBaseline = 'top';
    cursorY = marginY;
    canvases.push(currentCanvas);
  };

  const ensureSpace = neededHeight => {
    if (cursorY + neededHeight > canvasHeight - marginY) {
      startNewPage();
    }
  };

  startNewPage();

  // Header Banner
  ctx.font = `700 28px ${fontStack}`;
  const titleLines = wrapCanvasLines(ctx, title, contentWidth - 56);
  ctx.font = `500 20px ${fontStack}`;
  const subtitleLines = subtitle ? wrapCanvasLines(ctx, subtitle, contentWidth - 56) : [];

  const bannerHeight =
    (badge ? 34 : 0) +
    titleLines.length * 40 +
    (subtitleLines.length ? subtitleLines.length * 30 + 12 : 0) +
    44;

  ctx.fillStyle = '#f2f6ff';
  ctx.fillRect(marginX, cursorY, contentWidth, bannerHeight);
  ctx.fillStyle = '#2b52b0';
  ctx.fillRect(marginX, cursorY, 8, bannerHeight);

  let innerY = cursorY + 22;
  if (badge) {
    ctx.font = `800 16px ${fontStack}`;
    ctx.fillStyle = '#23479e';
    ctx.fillText(badge, marginX + 28, innerY);
    innerY += 30;
  }

  ctx.font = `800 28px ${fontStack}`;
  ctx.fillStyle = '#0f1a2c';
  titleLines.forEach(line => {
    ctx.fillText(line, marginX + 28, innerY);
    innerY += 40;
  });

  if (subtitleLines.length > 0) {
    innerY += 6;
    ctx.font = `500 20px ${fontStack}`;
    ctx.fillStyle = '#253449';
    subtitleLines.forEach(line => {
      ctx.fillText(line, marginX + 28, innerY);
      innerY += 30;
    });
  }

  cursorY += bannerHeight + 28;

  // Sections
  sections.forEach(sec => {
    ctx.font = `700 22px ${fontStack}`;
    const headingLines = wrapCanvasLines(ctx, sec.heading, contentWidth - 48);

    ctx.font = `500 19px ${fontStack}`;
    const paraBlocks = (sec.paragraphs || []).map(p =>
      wrapCanvasLines(ctx, p, contentWidth - 48)
    );

    const bulletBlocks = (sec.bullets || []).map(b =>
      wrapCanvasLines(ctx, `• ${b}`, contentWidth - 64)
    );

    ctx.font = `700 18.5px ${fontStack}`;
    const highlightLines = sec.highlight
      ? wrapCanvasLines(ctx, sec.highlight, contentWidth - 64)
      : [];

    const totalParaLines = paraBlocks.reduce((acc, lines) => acc + lines.length, 0);
    const totalBulletLines = bulletBlocks.reduce((acc, lines) => acc + lines.length, 0);

    const boxHeight =
      36 +
      headingLines.length * 32 +
      totalParaLines * 29 +
      paraBlocks.length * 10 +
      totalBulletLines * 29 +
      bulletBlocks.length * 8 +
      (highlightLines.length > 0 ? highlightLines.length * 28 + 26 : 0);

    ensureSpace(boxHeight + 20);

    ctx.fillStyle = '#fbfcfe';
    ctx.fillRect(marginX, cursorY, contentWidth, boxHeight);
    ctx.strokeStyle = '#dde4ef';
    ctx.lineWidth = 2;
    ctx.strokeRect(marginX, cursorY, contentWidth, boxHeight);

    let secY = cursorY + 18;
    ctx.font = `800 22px ${fontStack}`;
    ctx.fillStyle = '#0f1a2c';
    headingLines.forEach(line => {
      ctx.fillText(line, marginX + 24, secY);
      secY += 32;
    });

    secY += 4;
    ctx.font = `500 19px ${fontStack}`;
    ctx.fillStyle = '#1e2c40';
    paraBlocks.forEach(lines => {
      lines.forEach(line => {
        ctx.fillText(line, marginX + 24, secY);
        secY += 29;
      });
      secY += 10;
    });

    bulletBlocks.forEach(lines => {
      lines.forEach((line, idx) => {
        ctx.fillText(line, marginX + (idx === 0 ? 28 : 44), secY);
        secY += 29;
      });
      secY += 8;
    });

    if (highlightLines.length > 0) {
      const hlBoxH = highlightLines.length * 28 + 16;
      ctx.fillStyle = '#eef3fd';
      ctx.fillRect(marginX + 24, secY, contentWidth - 48, hlBoxH);
      ctx.fillStyle = '#1d3b82';
      ctx.font = `700 18.5px ${fontStack}`;
      let hlY = secY + 8;
      highlightLines.forEach(line => {
        ctx.fillText(line, marginX + 36, hlY);
        hlY += 28;
      });
    }

    cursorY += boxHeight + 20;
  });

  if (footerNote) {
    ensureSpace(50);
    ctx.font = `600 17px ${fontStack}`;
    ctx.fillStyle = '#46566e';
    ctx.fillText(footerNote, marginX, cursorY + 10);
  }

  const jpegPages = canvases.map(canvas => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return {
      width: canvas.width,
      height: canvas.height,
      bytes: dataUrlToUint8Array(dataUrl),
    };
  });

  return buildPdfFromJpegPages(jpegPages);
}

/**
 * Downloads BOTH the PDF (.pdf) and Word (.doc) files in a single click.
 */
export function downloadPdfAndWord(docConfig) {
  const filenameBase = docConfig.filenameBase || 'document';
  const wordBlob = buildWordDocumentBlob(docConfig);
  const pdfBlob = buildPdfDocumentBlob(docConfig);

  triggerBlobDownload(pdfBlob, `${filenameBase}.pdf`);
  setTimeout(() => {
    triggerBlobDownload(wordBlob, `${filenameBase}.doc`);
  }, 180);
}
