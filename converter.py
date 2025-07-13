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

def split_pdf(input_pdf, output_dir):
    reader = PdfReader(input_pdf)
    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)
        output_filename = f"{Path(input_pdf).stem}_page_{i + 1}.pdf"
        output_path = os.path.join(output_dir, output_filename)
        with open(output_path, "wb") as f:
            writer.write(f)

def convert_files(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    import zipfile
    os.makedirs(output_folder, exist_ok=True)
    converted_pdfs = []
    converted_files_for_zip = []

    for file_path in file_paths:
        ext = Path(file_path).suffix.lower()
        filename = Path(file_path).stem

        # PDF Tools operations
        if ext == '.pdf':
            processed_path = file_path
            if delete_pages:
                temp_path = os.path.join(output_folder, f"{filename}_deleted.pdf")
                remove_pages_from_pdf(processed_path, temp_path, delete_pages)
                processed_path = temp_path
                converted_files_for_zip.append(processed_path)

            if split_pdf_flag:
                split_pdf(processed_path, output_folder)
                # Add split files to zip
                for i in range(len(PdfReader(processed_path).pages)):
                    split_file = os.path.join(output_folder, f"{filename}_page_{i + 1}.pdf")
                    if os.path.exists(split_file):
                        converted_files_for_zip.append(split_file)
                continue # Move to next file

            file_path = processed_path # Use the processed file for further conversions

        for fmt in output_formats:
            fmt = fmt.lower()
            out_file = os.path.join(output_folder, f"{filename}.{fmt}")

            if fmt == 'pdf':
                if ext in ['.docx', '.pptx', '.xlsx', '.odt', '.ods']:
                    convert_to_pdf_libreoffice(file_path, output_folder)
                    converted_pdf = os.path.join(output_folder, f"{filename}.pdf")
                    converted_pdfs.append(converted_pdf)
                    converted_files_for_zip.append(converted_pdf)

                elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                    image_pdf = os.path.join(output_folder, f"{filename}.pdf")
                    convert_image(file_path, image_pdf, 'pdf')
                    converted_pdfs.append(image_pdf)
                    converted_files_for_zip.append(image_pdf)

            elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext == '.pdf':
                pdf_to_images(file_path, output_folder)
                # Add converted images to zip
                for i in range(len(PdfReader(file_path).pages)):
                    img_file = os.path.join(output_folder, f"{filename}_page{i+1}.png")
                    if os.path.exists(img_file):
                        converted_files_for_zip.append(img_file)

            elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                convert_image(file_path, out_file, fmt)
                converted_files_for_zip.append(out_file)

    if merge_pdf and converted_pdfs:
        merger = PdfMerger()
        for pdf in converted_pdfs:
            merger.append(pdf)
        merged_path = os.path.join(output_folder, "merged_output.pdf")
        merger.write(merged_path)
        merger.close()
        converted_files_for_zip.append(merged_path)

    # Create a zip file with all generated files
    if converted_files_for_zip:
        zip_path = os.path.join(output_folder, 'converted_files.zip')
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in set(converted_files_for_zip):
                if os.path.exists(file):
                    zipf.write(file, os.path.basename(file))
        return zip_path
    
    return None
