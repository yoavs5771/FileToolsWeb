# converter_simple.py - גירסה פשוטה שעובדת
import os
import zipfile
from pathlib import Path
from PIL import Image
import PyPDF2
import fitz  # PyMuPDF

def convert_docx_to_pdf(docx_path, output_path):
    """Convert DOCX to PDF using docx2pdf"""
    try:
        from docx2pdf import convert
        convert(docx_path, output_path)
        return True
    except ImportError:
        print("docx2pdf not installed")
        return False
    except Exception as e:
        print(f"Error converting DOCX to PDF: {e}")
        return False

def convert_image_to_pdf(image_path, output_path):
    """Convert image to PDF"""
    try:
        image = Image.open(image_path)
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image.save(output_path, 'PDF')
        return True
    except Exception as e:
        print(f"Error converting image to PDF: {e}")
        return False

def convert_pdf_to_images(pdf_path, output_dir):
    """Convert PDF pages to images"""
    try:
        pdf_document = fitz.open(pdf_path)
        converted_files = []
        
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap()
            image_path = os.path.join(output_dir, f"{Path(pdf_path).stem}_page_{page_num + 1}.png")
            pix.save(image_path)
            converted_files.append(image_path)
        
        pdf_document.close()
        return converted_files
    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        return []

def convert_image_format(image_path, output_path, format):
    """Convert image to different format"""
    try:
        image = Image.open(image_path)
        if format.upper() == 'JPG' or format.upper() == 'JPEG':
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
        image.save(output_path, format.upper())
        return True
    except Exception as e:
        print(f"Error converting image format: {e}")
        return False

def merge_pdfs(pdf_paths, output_path):
    """Merge multiple PDFs"""
    try:
        merger = PyPDF2.PdfMerger()
        for pdf_path in pdf_paths:
            if os.path.exists(pdf_path):
                merger.append(pdf_path)
        
        with open(output_path, 'wb') as output_file:
            merger.write(output_file)
        merger.close()
        return True
    except Exception as e:
        print(f"Error merging PDFs: {e}")
        return False

def split_pdf(pdf_path, output_dir):
    """Split PDF into individual pages"""
    try:
        reader = PyPDF2.PdfReader(pdf_path)
        converted_files = []
        
        for i, page in enumerate(reader.pages):
            writer = PyPDF2.PdfWriter()
            writer.add_page(page)
            
            output_path = os.path.join(output_dir, f"{Path(pdf_path).stem}_page_{i + 1}.pdf")
            with open(output_path, 'wb') as output_file:
                writer.write(output_file)
            converted_files.append(output_path)
        
        return converted_files
    except Exception as e:
        print(f"Error splitting PDF: {e}")
        return []

def convert_files_simple(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    """Simple file conversion function"""
    try:
        os.makedirs(output_folder, exist_ok=True)
        converted_files = []
        pdf_files_for_merge = []

        print(f"Starting conversion:")
        print(f"  Files: {[os.path.basename(f) for f in file_paths]}")
        print(f"  Formats: {output_formats}")
        print(f"  Merge: {merge_pdf}, Split: {split_pdf_flag}")

        for file_path in file_paths:
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                continue

            file_ext = Path(file_path).suffix.lower()
            file_stem = Path(file_path).stem
            
            print(f"Processing: {os.path.basename(file_path)} (type: {file_ext})")

            # Handle PDF splitting first
            if file_ext == '.pdf' and split_pdf_flag:
                split_files = split_pdf(file_path, output_folder)
                converted_files.extend(split_files)
                continue  # Skip other conversions for split files

            # Convert to requested formats
            for format in output_formats:
                format = format.lower()
                output_file = os.path.join(output_folder, f"{file_stem}.{format}")
                
                success = False
                
                # Image to PDF
                if format == 'pdf' and file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
                    success = convert_image_to_pdf(file_path, output_file)
                    if success:
                        pdf_files_for_merge.append(output_file)
                
                # DOCX to PDF
                elif format == 'pdf' and file_ext == '.docx':
                    success = convert_docx_to_pdf(file_path, output_file)
                    if success:
                        pdf_files_for_merge.append(output_file)
                
                # PDF to images
                elif format in ['png', 'jpg', 'jpeg'] and file_ext == '.pdf':
                    image_files = convert_pdf_to_images(file_path, output_folder)
                    converted_files.extend(image_files)
                    success = len(image_files) > 0
                
                # Image format conversion
                elif format in ['png', 'jpg', 'jpeg', 'bmp', 'tiff'] and file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']:
                    success = convert_image_format(file_path, output_file, format)
                
                # Copy PDF as-is if requesting PDF from PDF
                elif format == 'pdf' and file_ext == '.pdf':
                    import shutil
                    shutil.copy2(file_path, output_file)
                    pdf_files_for_merge.append(output_file)
                    success = True
                
                if success and os.path.exists(output_file):
                    converted_files.append(output_file)
                    print(f"  ✓ Created: {os.path.basename(output_file)}")
                elif not success:
                    print(f"  ✗ Failed to convert to {format}")

        # Handle PDF merging
        if merge_pdf and pdf_files_for_merge:
            merged_file = os.path.join(output_folder, "merged_output.pdf")
            if merge_pdfs(pdf_files_for_merge, merged_file):
                converted_files.append(merged_file)
                print(f"  ✓ Merged PDFs into: {os.path.basename(merged_file)}")

        # Create ZIP file
        if converted_files:
            zip_path = os.path.join(output_folder, 'converted_files.zip')
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file in converted_files:
                    if os.path.exists(file):
                        zipf.write(file, os.path.basename(file))
                        print(f"  ✓ Added to ZIP: {os.path.basename(file)}")
            
            print(f"Created ZIP: {zip_path}")
            return zip_path
        else:
            print("No files were converted successfully")
            return None

    except Exception as e:
        print(f"Conversion error: {e}")
        raise Exception(f"Conversion failed: {str(e)}")

# Keep the original function name for compatibility
def convert_files(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    return convert_files_simple(file_paths, output_formats, output_folder, merge_pdf, split_pdf_flag, delete_pages)
