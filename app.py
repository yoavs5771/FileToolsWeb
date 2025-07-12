from flask import Flask, render_template, request, send_file, redirect, url_for, flash
import os
from werkzeug.utils import secure_filename
from pathlib import Path
from converter import convert_file

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'converted'
ALLOWED_EXTENSIONS = {'docx', 'pptx', 'pdf', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'txt', 'html'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.secret_key = 'secret!'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)

        file = request.files['file']
        output_format = request.form.get('format')

        if file.filename == '' or not output_format:
            flash('Please select file and output format')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(input_path)

            try:
                output_path = convert_file(input_path, output_format, app.config['OUTPUT_FOLDER'])
                return send_file(output_path, as_attachment=True)
            except Exception as e:
                flash(f"Conversion error: {e}")
                return redirect(request.url)

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
