import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportTableToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const doc = new jsPDF();

  doc.text(title, 14, 15);

  autoTable(doc, {
    startY: 20,
    head: [headers],
    body: rows,
  });

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
}
