from flask import Flask, render_template, request, send_file, jsonify
from werkzeug.utils import secure_filename
from converter import convert_files
import os
import uuid

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files')
    output_formats = request.form.getlist('formats[]')
    merge_pdf = request.form.get('merge', 'false') == 'true'
    delete_pages = request.form.get('delete_pages')

    delete_pages_list = None
    if delete_pages:
        try:
            delete_pages_list = [int(x.strip()) for x in delete_pages.split(',') if x.strip().isdigit()]
        except:
            pass

    saved_paths = []
    for file in files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        file.save(file_path)
        saved_paths.append(file_path)

    convert_files(
        file_paths=saved_paths,
        output_formats=output_formats,
        output_folder=OUTPUT_FOLDER,
        merge_pdf=merge_pdf,
        delete_pages=delete_pages_list
    )

    return jsonify({"success": True})

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
