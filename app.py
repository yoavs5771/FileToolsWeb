from flask import Flask, request, render_template, send_file, redirect, url_for
from werkzeug.utils import secure_filename
from converter import *
from pathlib import Path
import tempfile
import os

app = Flask(__name__)
UPLOAD_FOLDER = tempfile.gettempdir()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/privacy")
def privacy():
    return render_template("privacy.html")

@app.route("/convert", methods=["POST"])
def convert():
    file = request.files.get("file")
    conversion_type = request.form.get("conversion")
    output_file = tempfile.NamedTemporaryFile(delete=False)

    if not file:
        return "No file uploaded"

    filename = secure_filename(file.filename)
    input_path = Path(UPLOAD_FOLDER) / filename
    file.save(input_path)
    out_path = Path(output_file.name)

    try:
        if conversion_type == "docx2txt":
            convert_docx_to_txt(input_path, out_path)
        elif conversion_type == "docx2html":
            convert_docx_to_html(input_path, out_path)
        elif conversion_type == "image2png":
            convert_images(input_path, out_path.with_suffix(".png"), "png")
        elif conversion_type == "video2audio":
            convert_video_to_audio(input_path, out_path.with_suffix(".mp3"))
        elif conversion_type == "extract_pdf_images":
            extract_dir = Path(UPLOAD_FOLDER) / "pdf_images"
            extract_dir.mkdir(exist_ok=True)
            extract_images_from_pdf(input_path, extract_dir)
            return f"Images extracted to: {extract_dir}"
        elif conversion_type == "delete_pdf_pages":
            delete_pdf_pages(input_path, [0], out_path)  # delete page 1 as example
        elif conversion_type == "pptx2pdf":
            convert_pptx_to_pdf_placeholder(input_path, out_path.with_suffix(".pdf"))
        else:
            return "Unknown conversion"

        return send_file(out_path, as_attachment=True)

    except Exception as e:
        return f"Error during conversion: {e}"

@app.route("/merge", methods=["POST"])
def merge():
    files = request.files.getlist("files")
    pdf_list = []
    for file in files:
        input_path = Path(UPLOAD_FOLDER) / secure_filename(file.filename)
        file.save(input_path)
        pdf_list.append(input_path)

    out_path = Path(UPLOAD_FOLDER) / "merged.pdf"
    merge_pdfs(pdf_list, out_path)
    return send_file(out_path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)

