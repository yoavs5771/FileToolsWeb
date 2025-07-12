from flask import Flask, render_template, request, jsonify
from converter import convert_files
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['RESULT_FOLDER'] = 'results'

# ודא שהתיקיות קיימות
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/convert', methods=['POST'])
def convert():
    try:
        # קבצי קלט
        files = request.files.getlist('files[]')
        if not files or not any(file.filename for file in files):
            print("❌ לא הועלו קבצים")
            return jsonify({'success': False, 'message': 'No files uploaded'})

        # פורמטים
        formats = request.form.getlist('formats[]')
        if not formats:
            print("❌ לא נבחרו פורמטים")
            return jsonify({'success': False, 'message': 'No output formats selected'})

        # נתיב תיקיית יעד
        output_dir = app.config['RESULT_FOLDER']

        # שמירת קבצים
        input_paths = []
        for file in files:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            input_paths.append(file_path)

        print("📂 קבצים לשמירה:", input_paths)
        print("🎯 פורמטים נבחרים:", formats)

        # המרה
        success, details = convert_files(input_paths, output_dir, formats)

        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'message': details})

    except Exception as e:
        print("⚠️ שגיאה:", str(e))
        return jsonify({'success': False, 'message': str(e)})


if __name__ == '__main__':
    app.run(debug=True)
