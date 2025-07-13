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

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/translations/<language>.json')
def get_translation(language):
    try:
        with open(f'translations/{language}.json', 'r', encoding='utf-8') as f:
            content = f.read()
        return content, 200, {'Content-Type': 'application/json; charset=utf-8'}
    except FileNotFoundError:
        return jsonify({"error": "Translation not found"}), 404

@app.route('/convert', methods=['POST'])
def convert():
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files')
    output_formats = request.form.getlist('formats[]')
    merge_pdf = request.form.get('merge', 'false') == 'true'
    split_pdf = request.form.get('split', 'false') == 'true'
    delete_pages = request.form.get('delete_pages')

    if not files or all(f.filename == '' for f in files):
        return jsonify({"error": "No selected files"}), 400

    if not output_formats and not (merge_pdf or split_pdf or delete_pages):
        return jsonify({"error": "No action selected. Please choose a format or a PDF tool."}), 400

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

    try:
        output_zip_path = convert_files(
            file_paths=saved_paths,
            output_formats=output_formats,
            output_folder=OUTPUT_FOLDER,
            merge_pdf=merge_pdf,
            split_pdf_flag=split_pdf,
            delete_pages=delete_pages_list
        )
        if output_zip_path and os.path.exists(output_zip_path):
             return send_file(output_zip_path, as_attachment=True, download_name='converted_files.zip')
        else:
             # אם אין קובץ להורדה, זה אומר שהפעולה בוצעה אך לא יצרה קובץ (למשל, רק פיצול)
             return jsonify({"success": True, "message": "Action completed, but no file to download."})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "Conversion failed for an unknown reason."}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
