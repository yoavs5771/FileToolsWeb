import os
import shutil
import uuid
from pathlib import Path
from flask import Flask, request, render_template, send_file, redirect, url_for, flash
from werkzeug.utils import secure_filename
from converter import *  # All your conversion functions should be in converter.py
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
from moviepy.editor import VideoFileClip

app = Flask(__name__)
app.secret_key = 'supersecretkey'
UPLOAD_FOLDER = Path("uploads")
OUTPUT_FOLDER = Path("outputs")

for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

# Allowed extensions
ALLOWED_EXTENSIONS = {"docx", "pptx", "pdf", "jpg", "jpeg", "png", "bmp", "tiff", "gif", "mp4", "avi", "mov", "mkv"}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        if 'file' not in request.files:
            flash("No file part")
            return redirect(request.url)

        file = request.files['file']
        if file.filename == '':
            flash("No selected file")
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            input_path = UPLOAD_FOLDER / filename
            file.save(input_path)

            target_format = request.form.get("format")
            action = request.form.get("action")  # convert / merge / delete_pages
            output_file = None

            stem = input_path.stem
            ext = input_path.suffix.lower().lstrip('.')
            output_path = OUTPUT_FOLDER / f"{stem}.{target_format}"

            try:
                if action == "convert":
                    if ext == "docx":
                        if target_format == "pdf":
                            convert_docx_to_pdf(str(input_path), str(output_path))
                        elif target_format == "txt":
                            convert_docx_to_txt(input_path, output_path)
                        elif target_format == "html":
                            convert_docx_to_html(input_path, output_path)

                    elif ext == "pptx" and target_format == "pdf":
                        convert_pptx_to_pdf(input_path, output_path)

                    elif ext in {"jpg", "jpeg", "png", "bmp", "tiff", "gif"}:
                        convert_image(input_path, output_path, target_format)

                    elif ext in {"mp4", "avi", "mov", "mkv"} and target_format in {"mp4", "avi", "mov", "mkv"}:
                        clip = VideoFileClip(str(input_path))
                        clip.write_videofile(str(output_path), codec='libx264')

                    elif ext == "pdf" and target_format == "pdf":
                        shutil.copy(input_path, output_path)

                    return send_file(output_path, as_attachment=True)

                elif action == "merge":
                    merger = PdfMerger()
                    pdf_files = request.files.getlist("merge_files")
                    for pdf in pdf_files:
                        temp_path = UPLOAD_FOLDER / secure_filename(pdf.filename)
                        pdf.save(temp_path)
                        merger.append(str(temp_path))
                    merged_path = OUTPUT_FOLDER / f"merged_{uuid.uuid4().hex}.pdf"
                    merger.write(str(merged_path))
                    merger.close()
                    return send_file(merged_path, as_attachment=True)

                elif action == "delete_pages":
                    pages_to_delete = request.form.get("pages").split(',')
                    pages_to_delete = [int(p.strip()) for p in pages_to_delete if p.strip().isdigit()]
                    reader = PdfReader(str(input_path))
                    writer = PdfWriter()
                    for i in range(len(reader.pages)):
                        if i not in pages_to_delete:
                            writer.add_page(reader.pages[i])
                    writer.write(str(output_path))
                    return send_file(output_path, as_attachment=True)

            except Exception as e:
                flash(f"Error: {str(e)}")
                return redirect(request.url)

    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
