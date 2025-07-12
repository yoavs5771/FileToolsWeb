# converter.py
import os
import subprocess
from pathlib import Path
from PIL import Image
from PyPDF2 import PdfMerger, PdfReader, PdfWriter

def convert_to_pdf_libreoffice(input_file, output_dir):
    subprocess.run([
        'soffice',
        '--headless',
        '--convert-to', 'pdf',
        '--outdir', output_dir,
        input_file
    ], check=True)

def convert_image(input_path, output_path, to_format):
    with Image.open(input_path) as im:
        im.convert("RGB").save(output_path, to_format.upper())

def pdf_to_images(pdf_path, output_dir):
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("fitz (PyMuPDF) not installed")
        return

    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        pix = doc.load_page(page_num).get_pixmap()
        out_path = os.path.join(output_dir, f"{Path(pdf_path).stem}_page{page_num+1}.png")
        pix.save(out_path)
    doc.close()

def remove_pages_from_pdf(input_pdf, output_pdf, pages_to_remove):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    for i in range(len(reader.pages)):
        if (i+1) not in pages_to_remove:
            writer.add_page(reader.pages[i])
    with open(output_pdf, 'wb') as f:
        writer.write(f)

def convert_files(file_paths, output_formats, output_folder, merge_pdf=False, delete_pages=None):
    os.makedirs(output_folder, exist_ok=True)
    converted_pdfs = []

    for file_path in file_paths:
        ext = Path(file_path).suffix.lower()
        filename = Path(file_path).stem

        for fmt in output_formats:
            fmt = fmt.lower()
            out_file = os.path.join(output_folder, f"{filename}.{fmt}")

            if fmt == 'pdf':
                if ext in ['.docx', '.pptx', '.xlsx', '.odt', '.ods']:
                    convert_to_pdf_libreoffice(file_path, output_folder)
                    converted_pdf = os.path.join(output_folder, f"{filename}.pdf")
                    if delete_pages:
                        new_pdf = os.path.join(output_folder, f"{filename}_filtered.pdf")
                        remove_pages_from_pdf(converted_pdf, new_pdf, delete_pages)
                        converted_pdf = new_pdf
                    converted_pdfs.append(converted_pdf)

                elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                    image_pdf = os.path.join(output_folder, f"{filename}.pdf")
                    convert_image(file_path, image_pdf, 'pdf')
                    converted_pdfs.append(image_pdf)

            elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext == '.pdf':
                pdf_to_images(file_path, output_folder)

            elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                convert_image(file_path, out_file, fmt)

    if merge_pdf and converted_pdfs:
        merger = PdfMerger()
        for pdf in converted_pdfs:
            merger.append(pdf)
        merged_path = os.path.join(output_folder, "merged_output.pdf")
        merger.write(merged_path)
        merger.close()
