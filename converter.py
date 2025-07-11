
import os
import fitz  # PyMuPDF
import shutil
from pathlib import Path
from PIL import Image
from docx import Document
from pptx import Presentation
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
from moviepy.editor import VideoFileClip


def convert_docx_to_txt(docx_path, txt_path):
    doc = Document(docx_path)
    with open(txt_path, 'w', encoding='utf-8') as f:
        for para in doc.paragraphs:
            f.write(para.text + "\n")


def convert_docx_to_html(docx_path, html_path):
    doc = Document(docx_path)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('<html><body>\n')
        for para in doc.paragraphs:
            f.write(f'<p>{para.text}</p>\n')
        f.write('</body></html>')


def convert_images(input_path, output_path, out_format):
    with Image.open(input_path) as img:
        rgb = img.convert('RGB')
        rgb.save(output_path, out_format.upper())


def merge_pdfs(pdf_list, output_path):
    merger = PdfMerger()
    for pdf in pdf_list:
        merger.append(pdf)
    merger.write(output_path)
    merger.close()


def delete_pdf_pages(pdf_path, pages_to_delete, output_path):
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    for i in range(len(reader.pages)):
        if i not in pages_to_delete:
            writer.add_page(reader.pages[i])
    with open(output_path, "wb") as f:
        writer.write(f)


def extract_images_from_pdf(pdf_path, output_folder):
    pdf_file = fitz.open(pdf_path)
    for page_index in range(len(pdf_file)):
        for img_index, img in enumerate(pdf_file[page_index].get_images(full=True)):
            xref = img[0]
            base_image = pdf_file.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            with open(output_folder / f"page{page_index+1}_img{img_index+1}.{image_ext}", "wb") as img_file:
                img_file.write(image_bytes)


def convert_video_to_audio(video_path, audio_path):
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(audio_path)


def convert_pptx_to_pdf_placeholder(pptx_path, pdf_path):
    # Placeholder for real implementation (e.g., with COM or LibreOffice)
    shutil.copy(pptx_path, pdf_path)

