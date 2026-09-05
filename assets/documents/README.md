# Resume downloads

The English DOCX is editable; the PDF is its Microsoft Word export, with matching A4 pagination, document tags, hyperlinks, and Page X of Y footers. Both files are published as static downloads. Browser printing remains available in English and Arabic.

To regenerate, use Python with `python-docx` installed:

```powershell
python scripts/build-resume-documents.py
powershell -File scripts/export-resume-pdf.ps1
```

The PDF export requires Microsoft Word on Windows. Review every PDF page after regeneration, check text extraction and links, and commit both files together. The website build copies these files; it does not require Python or Word in CI.

Use the file format requested by the employer. This layout avoids body tables, text boxes, graphics, and multi-column reading order, but ATS parsing varies by vendor and job-specific content still needs tailoring.
