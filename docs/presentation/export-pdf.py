"""Create an offline PDF of the reviewed slide renders.

The PDF preserves the 16:9 layout as images at 2x slide resolution.
Use the accompanying PPTX to edit native text and diagrams.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from pypdf import PdfReader

here = Path(__file__).resolve().parent
slides = sorted((here / ".build").glob("slide-??.png"))
if len(slides) != 14:
    raise ValueError(f"Expected 14 rendered slides, found {len(slides)}")
output = here / "output" / "TaskFlow-Karol-Scislowski.pdf"
output.parent.mkdir(exist_ok=True)
pdf = canvas.Canvas(str(output), pagesize=(960, 540))
pdf.setTitle("TaskFlow - obrona projektu")
pdf.setAuthor("Karol Scisłowski")
for image in slides:
    pdf.drawImage(str(image), 0, 0, width=960, height=540)
    pdf.showPage()
pdf.save()
reader = PdfReader(str(output))
assert len(reader.pages) == 14
assert all(tuple(float(v) for v in p.mediabox) == (0, 0, 960, 540) for p in reader.pages)
print(f"PDF: {len(reader.pages)} pages, 16:9, {output}")
