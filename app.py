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

@app.route('/simple')
def simple_ui():
    return render_template('index_simple.html')

@app.route('/complex')
def complex_ui():
    return render_template('index.html')

@app.route('/privacy')
def privacy():
    return render_template('privacy_minimal.html')

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
    print("=== Convert endpoint called ===")
    
    if 'files' not in request.files:
        print("No files in request")
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('files')
    output_formats = request.form.getlist('formats[]')
    merge_pdf = request.form.get('merge', 'false') == 'true'
    split_pdf = request.form.get('split', 'false') == 'true'
    delete_pages = request.form.get('delete_pages')

    print(f"Received {len(files)} files")
    print(f"Output formats: {output_formats}")
    print(f"Merge PDF: {merge_pdf}")
    print(f"Split PDF: {split_pdf}")

    if not files or all(f.filename == '' for f in files):
        print("No files selected")
        return jsonify({"error": "No selected files"}), 400

    if not output_formats and not (merge_pdf or split_pdf or delete_pages):
        print("No action selected")
        return jsonify({"error": "No action selected. Please choose a format or a PDF tool."}), 400

    delete_pages_list = None
    if delete_pages:
        try:
            delete_pages_list = [int(x.strip()) for x in delete_pages.split(',') if x.strip().isdigit()]
        except:
            pass

    saved_paths = []
    for file in files:
        original_filename = file.filename
        filename = secure_filename(original_filename)
        
        # Make sure we keep the file extension
        if not filename:
            filename = "file"
        if '.' not in filename and '.' in original_filename:
            extension = original_filename.rsplit('.', 1)[1].lower()
            filename = f"{filename}.{extension}"
        
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4()}_{filename}")
        file.save(file_path)
        saved_paths.append(file_path)
        print(f"Saved file: {original_filename} -> {file_path}")

    print(f"Starting conversion with {len(saved_paths)} files...")
    
    try:
        output_zip_path = convert_files(
            file_paths=saved_paths,
            output_formats=output_formats,
            output_folder=OUTPUT_FOLDER,
            merge_pdf=merge_pdf,
            split_pdf_flag=split_pdf,
            delete_pages=delete_pages_list
        )
        
        print(f"Conversion result: {output_zip_path}")
        
        if output_zip_path and os.path.exists(output_zip_path) and os.path.getsize(output_zip_path) > 0:
            print(f"Sending file: {output_zip_path} (size: {os.path.getsize(output_zip_path)} bytes)")
            return send_file(output_zip_path, as_attachment=True, download_name='converted_files.zip')
        else:
            print("No output file generated or file is empty")
            return jsonify({"error": "No output file was generated. Please check your input files and try again."}), 400

    except Exception as e:
        error_message = str(e)
        
        # Provide more user-friendly error messages
        if "LibreOffice not found" in error_message:
            error_message = "Document conversion requires LibreOffice. Please install LibreOffice or use the alternative DOCX converter for DOCX files only."
        elif "PyMuPDF" in error_message:
            error_message = "PDF to image conversion requires PyMuPDF. Please check your installation."
        elif "Failed to convert" in error_message:
            error_message = f"Conversion failed: {error_message}"
        
        return jsonify({"error": error_message}), 500
    
    return jsonify({"error": "Conversion failed for an unknown reason."}), 500

@app.route('/download/<filename>')
def download_file(filename):
    return send_file(os.path.join(OUTPUT_FOLDER, filename), as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
