import os
import subprocess
from pathlib import Path
from docx import Document
from pptx import Presentation
from PyPDF2 import PdfMerger, PdfReader, PdfWriter
from PIL import Image
import pdfkit

# === פונקציות בסיסיות ===
def convert_docx_to_txt(docx_path, output_path):
    doc = Document(docx_path)
    text = '\n'.join(p.text for p in doc.paragraphs)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)

def convert_docx_to_html(docx_path, output_path):
    doc = Document(docx_path)
    html = "<html><body>" + ''.join(f"<p>{p.text}</p>" for p in doc.paragraphs) + "</body></html>"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

def convert_docx_to_pdf(docx_path, output_path):
    try:
        subprocess.run([
            'libreoffice', '--headless', '--convert-to', 'pdf',
            '--outdir', str(Path(output_path).parent), docx_path
        ], check=True)
    except Exception as e:
        print("❌ LibreOffice DOCX to PDF failed:", e)

def convert_pptx_to_pdf(pptx_path, output_path):
    try:
        subprocess.run([
            'libreoffice', '--headless', '--convert-to', 'pdf',
            '--outdir', str(Path(output_path).parent), pptx_path
        ], check=True)
    except Exception as e:
        print("❌ LibreOffice PPTX to PDF failed:", e)

def convert_pptx_to_images(pptx_path, output_folder):
    prs = Presentation(pptx_path)
    for i, slide in enumerate(prs.slides):
        placeholder = os.path.join(output_folder, f"slide_{i+1}.txt")
        with open(placeholder, 'w', encoding='utf-8') as f:
            f.write(f"[Slide {i+1}] Placeholder text")

def convert_txt_to_pdf(txt_path, output_path):
    with open(txt_path, 'r', encoding='utf-8') as f:
        text = f.read()
    html = f"<html><body><pre>{text}</pre></body></html>"
    temp_html = Path(output_path).with_suffix('.html')
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html)
    pdfkit.from_file(str(temp_html), str(output_path))
    os.remove(temp_html)

def html_to_pdf(html_path, output_path):
    pdfkit.from_file(html_path, output_path)

def merge_pdfs(pdf_paths, output_path):
    merger = PdfMerger()
    for path in pdf_paths:
        merger.append(path)
    merger.write(output_path)
    merger.close()

def delete_pdf_pages(pdf_path, output_path, pages_to_delete):
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    total_pages = len(reader.pages)
    for i in range(total_pages):
        if i not in pages_to_delete:
            writer.add_page(reader.pages[i])
    with open(output_path, 'wb') as f:
        writer.write(f)

def image_to_pdf(image_path, output_path):
    img = Image.open(image_path)
    rgb = img.convert('RGB')
    rgb.save(output_path, 'PDF')

def image_to_image(image_path, output_path):
    img = Image.open(image_path)
    img.save(output_path)

# === כלי עזר ===
def get_output_path(input_path, output_ext, output_folder=None):
    base = Path(input_path).stem
    parent = Path(output_folder) if output_folder else Path(input_path).parent
    return str(parent / f"{base}.{output_ext}")

# === פונקציית־על ===
def convert_file(input_path, output_format, output_folder=None):
    input_path = Path(input_path)
    input_ext = input_path.suffix.lower()
    output_path = get_output_path(input_path, output_format, output_folder)

    if input_ext == '.docx':
        if output_format == 'pdf':
            convert_docx_to_pdf(str(input_path), str(output_path))
        elif output_format == 'txt':
            convert_docx_to_txt(str(input_path), str(output_path))
        elif output_format == 'html':
            convert_docx_to_html(str(input_path), str(output_path))
    elif input_ext == '.pptx':
        if output_format == 'pdf':
            convert_pptx_to_pdf(str(input_path), str(output_path))
        elif output_format in ['jpg', 'png']:
            os.makedirs(output_path, exist_ok=True)
            convert_pptx_to_images(str(input_path), str(output_path))
    elif input_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
        if output_format == 'pdf':
            image_to_pdf(str(input_path), str(output_path))
        else:
            image_to_image(str(input_path), str(output_path))
    elif input_ext == '.txt' and output_format == 'pdf':
        convert_txt_to_pdf(str(input_path), str(output_path))
    elif input_ext == '.html' and output_format == 'pdf':
        html_to_pdf(str(input_path), str(output_path))
    elif input_ext == '.pdf' and output_format == 'merge':
        raise NotImplementedError("Use merge_pdfs() separately.")
    else:
        raise ValueError(f"Unsupported conversion: {input_ext} → {output_format}")

    return str(output_path)
