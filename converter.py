# converter.py
import os
import subprocess
from pathlib import Path
from PIL import Image
from PyPDF2 import PdfMerger, PdfReader, PdfWriter

def convert_docx_to_pdf_alternative(input_file, output_dir):
    """Alternative method for DOCX to PDF conversion when LibreOffice is not available"""
    try:
        from docx2pdf import convert
        output_file = os.path.join(output_dir, f"{Path(input_file).stem}.pdf")
        convert(input_file, output_file)
        return output_file
    except ImportError:
        raise Exception("docx2pdf not installed. Please install LibreOffice or docx2pdf for document conversion.")
    except Exception as e:
        raise Exception(f"Failed to convert DOCX to PDF: {str(e)}")

def check_libreoffice_available():
    """Check if LibreOffice is available on the system"""
    soffice_paths = [
        'soffice',
        'libreoffice',
        r'C:\Program Files\LibreOffice\program\soffice.exe',
        r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
    ]
    
    for soffice_path in soffice_paths:
        try:
            subprocess.run([soffice_path, '--version'], 
                         check=True, capture_output=True, timeout=10)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return False

def convert_to_pdf_libreoffice(input_file, output_dir):
    try:
        # Try different LibreOffice executable names based on platform
        soffice_paths = [
            'soffice',  # Linux/Mac default
            'libreoffice',  # Alternative name
            r'C:\Program Files\LibreOffice\program\soffice.exe',  # Windows default install
            r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',  # Windows x86
        ]
        
        for soffice_path in soffice_paths:
            try:
                subprocess.run([
                    soffice_path,
                    '--headless',
                    '--convert-to', 'pdf',
                    '--outdir', output_dir,
                    input_file
                ], check=True, timeout=60)
                return  # Success, exit function
            except (subprocess.CalledProcessError, FileNotFoundError):
                continue  # Try next path
        
        # If all paths failed, raise an exception
        raise Exception("LibreOffice not found. Please install LibreOffice for document conversion.")
    except subprocess.TimeoutExpired:
        raise Exception("LibreOffice conversion timed out.")

def convert_image(input_path, output_path, to_format):
    try:
        with Image.open(input_path) as im:
            # Convert to RGB if necessary for PDF format
            if to_format.lower() == 'pdf':
                if im.mode != 'RGB':
                    im = im.convert('RGB')
            im.save(output_path, to_format.upper())
    except Exception as e:
        raise Exception(f"Failed to convert image {input_path}: {str(e)}")

def pdf_to_images(pdf_path, output_dir):
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise Exception("PyMuPDF (fitz) not installed. Please install it for PDF to image conversion.")

    try:
        doc = fitz.open(pdf_path)
        if len(doc) == 0:
            raise Exception("PDF file appears to be empty or corrupted.")
            
        for page_num in range(len(doc)):
            pix = doc.load_page(page_num).get_pixmap()
            out_path = os.path.join(output_dir, f"{Path(pdf_path).stem}_page{page_num+1}.png")
            pix.save(out_path)
        doc.close()
    except Exception as e:
        raise Exception(f"Failed to convert PDF to images: {str(e)}")

def remove_pages_from_pdf(input_pdf, output_pdf, pages_to_remove):
    try:
        reader = PdfReader(input_pdf)
        if len(reader.pages) == 0:
            raise Exception("PDF file appears to be empty.")
            
        writer = PdfWriter()
        for i in range(len(reader.pages)):
            if (i+1) not in pages_to_remove:
                writer.add_page(reader.pages[i])
        
        if len(writer.pages) == 0:
            raise Exception("All pages would be removed. Please select fewer pages to delete.")
            
        with open(output_pdf, 'wb') as f:
            writer.write(f)
    except Exception as e:
        raise Exception(f"Failed to remove pages from PDF: {str(e)}")

def split_pdf(input_pdf, output_dir):
    try:
        reader = PdfReader(input_pdf)
        if len(reader.pages) == 0:
            raise Exception("PDF file appears to be empty.")
            
        for i, page in enumerate(reader.pages):
            writer = PdfWriter()
            writer.add_page(page)
            output_filename = f"{Path(input_pdf).stem}_page_{i + 1}.pdf"
            output_path = os.path.join(output_dir, output_filename)
            with open(output_path, "wb") as f:
                writer.write(f)
    except Exception as e:
        raise Exception(f"Failed to split PDF: {str(e)}")

def convert_files(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    import zipfile
    
    try:
        os.makedirs(output_folder, exist_ok=True)
        converted_pdfs = set()
        converted_files_for_zip = set()

        print(f"Starting conversion with:")
        print(f"  File paths: {file_paths}")
        print(f"  Output formats: {output_formats}")
        print(f"  Merge PDF: {merge_pdf}")
        print(f"  Split PDF: {split_pdf_flag}")
        print(f"  Delete pages: {delete_pages}")

        for file_path in file_paths:
            if not os.path.exists(file_path):
                print(f"Warning: File {file_path} does not exist, skipping...")
                continue
                
            ext = Path(file_path).suffix.lower()
            filename = Path(file_path).stem
            print(f"Processing file: {file_path} (extension: {ext})")

            # PDF Tools operations
            if ext == '.pdf':
                processed_path = file_path
                if delete_pages:
                    temp_path = os.path.join(output_folder, f"{filename}_deleted.pdf")
                    remove_pages_from_pdf(processed_path, temp_path, delete_pages)
                    processed_path = temp_path
                    converted_files_for_zip.add(processed_path)

                if split_pdf_flag:
                    split_pdf(processed_path, output_folder)
                    # Add split files to zip
                    reader = PdfReader(processed_path)
                    for i in range(len(reader.pages)):
                        split_file = os.path.join(output_folder, f"{filename}_page_{i + 1}.pdf")
                        if os.path.exists(split_file):
                            converted_files_for_zip.add(split_file)
                    continue # Move to next file

                file_path = processed_path # Use the processed file for further conversions

            for fmt in output_formats:
                fmt = fmt.lower()
                out_file = os.path.join(output_folder, f"{filename}.{fmt}")
                print(f"Converting to format: {fmt}, output file: {out_file}")

                if fmt == 'pdf':
                    if ext in ['.docx', '.pptx', '.xlsx', '.odt', '.ods']:
                        try:
                            # Try LibreOffice first
                            convert_to_pdf_libreoffice(file_path, output_folder)
                        except Exception as e:
                            # If LibreOffice fails and it's a DOCX file, try alternative method
                            if ext == '.docx':
                                try:
                                    convert_docx_to_pdf_alternative(file_path, output_folder)
                                except Exception as alt_e:
                                    raise Exception(f"Document conversion failed. LibreOffice error: {str(e)}. Alternative method error: {str(alt_e)}")
                            else:
                                raise e
                        
                        converted_pdf = os.path.join(output_folder, f"{filename}.pdf")
                        if os.path.exists(converted_pdf):
                            converted_pdfs.add(converted_pdf)
                            converted_files_for_zip.add(converted_pdf)

                    elif ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                        image_pdf = os.path.join(output_folder, f"{filename}.pdf")
                        convert_image(file_path, image_pdf, 'pdf')
                        if os.path.exists(image_pdf):
                            converted_pdfs.add(image_pdf)
                            converted_files_for_zip.add(image_pdf)

                elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext == '.pdf':
                    pdf_to_images(file_path, output_folder)
                    # Add converted images to zip
                    reader = PdfReader(file_path)
                    for i in range(len(reader.pages)):
                        img_file = os.path.join(output_folder, f"{filename}_page{i+1}.png")
                        if os.path.exists(img_file):
                            converted_files_for_zip.add(img_file)

                elif fmt in ['jpg', 'jpeg', 'png', 'bmp', 'tiff'] and ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']:
                    convert_image(file_path, out_file, fmt)
                    if os.path.exists(out_file):
                        converted_files_for_zip.add(out_file)

        if merge_pdf and converted_pdfs:
            merger = PdfMerger()
            for pdf in converted_pdfs:
                if os.path.exists(pdf):
                    merger.append(pdf)
            merged_path = os.path.join(output_folder, "merged_output.pdf")
            merger.write(merged_path)
            merger.close()
            converted_files_for_zip.add(merged_path)

        # Create a zip file with all generated files
        print(f"Files to zip: {list(converted_files_for_zip)}")
        if converted_files_for_zip:
            zip_path = os.path.join(output_folder, 'converted_files.zip')
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file in converted_files_for_zip:
                    if os.path.exists(file):
                        print(f"Adding to zip: {file}")
                        zipf.write(file, os.path.basename(file))
                    else:
                        print(f"File not found for zip: {file}")
            print(f"Created zip file: {zip_path}")
            return zip_path
        else:
            print("No files to zip - returning None")
        
        return None
        
    except Exception as e:
        raise Exception(f"Conversion failed: {str(e)}")
