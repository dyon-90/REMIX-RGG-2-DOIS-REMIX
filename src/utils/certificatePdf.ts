import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads an A4 Landscape PDF from an HTML element
 */
export async function downloadCertificatePDF(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  try {
    // Clone or capture with explicit sizing
    const canvas = await html2canvas(element, {
      scale: 2.5, // High resolution for crisp printing
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // A4 Landscape format: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar certificado em PDF:', error);
    throw error;
  }
}

/**
 * Triggers clean browser printing for a certificate element
 */
export function printCertificateElement(element: HTMLElement): void {
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';

  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Clone styles and markup
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(style => style.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Imprimir Certificado</title>
      ${styles}
      <style>
        @page {
          size: A4 landscape;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .certificate-print-container {
          width: 297mm;
          height: 210mm;
          box-sizing: border-box;
          page-break-inside: avoid;
          page-break-after: avoid;
        }
      </style>
    </head>
    <body>
      <div class="certificate-print-container">
        ${element.outerHTML}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
            setTimeout(function() {
              window.frameElement.remove();
            }, 1000);
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  doc.close();
}

/**
 * Formats student name for standardized file names
 */
export function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
}
