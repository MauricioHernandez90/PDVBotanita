// src/utils/exportar.js
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Exporta datos a Excel (.xlsx)
 */
export function exportarXLSX(datos, columnas, nombreArchivo = 'reporte', tituloHoja = 'Datos') {
  const filas = datos.map((item) =>
    columnas.reduce((acc, col) => {
      acc[col.titulo] = col.valor(item)
      return acc
    }, {})
  )

  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, tituloHoja.slice(0, 31))
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`)
}

/**
 * Exporta datos a PDF con tabla
 */
export function exportarPDF(datos, columnas, titulo = 'Reporte', nombreArchivo = 'reporte', subtitulo = '') {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text(titulo, 14, 20)

  if (subtitulo) {
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(subtitulo, 14, 27)
  }

  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(
    `Generado: ${new Date().toLocaleString('es-MX')}`,
    doc.internal.pageSize.width - 14,
    20,
    { align: 'right' }
  )

  doc.setTextColor(0)

  autoTable(doc, {
    startY: subtitulo ? 33 : 28,
    head: [columnas.map((c) => c.titulo)],
    body: datos.map((item) => columnas.map((c) => c.valor(item))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [217, 119, 6] }
  })

  doc.save(`${nombreArchivo}.pdf`)
}

/**
 * Exporta a formato XLSX que el usuario puede subir a Google Sheets.
 */
export function exportarGoogleSheets(datos, columnas, nombreArchivo = 'reporte') {
  exportarXLSX(datos, columnas, nombreArchivo)
  alert(
    '✅ Archivo descargado.\n\n' +
    'Para abrirlo en Google Sheets:\n' +
    '1. Ve a drive.google.com\n' +
    '2. Clic en "Nuevo" → "Subir archivo"\n' +
    '3. Selecciona el archivo descargado\n' +
    '4. Clic derecho → "Abrir con Google Sheets"'
  )
}
