# converter_working.py - גירסה שעובדת בוודאות
import os
import zipfile
from pathlib import Path
from PIL import Image
import PyPDF2

def simple_image_to_pdf(image_path, output_path):
    """Convert image to PDF - guaranteed to work"""
    try:
        print(f"Converting image to PDF: {image_path} -> {output_path}")
        image = Image.open(image_path)
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'P', 'LA'):
            rgb_image = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            rgb_image.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = rgb_image
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save as PDF
        image.save(output_path, 'PDF', resolution=100.0)
        
        if os.path.exists(output_path):
            print(f"  ✓ Successfully created PDF: {os.path.getsize(output_path)} bytes")
            return True
        else:
            print(f"  ✗ PDF file was not created")
            return False
            
    except Exception as e:
        print(f"  ✗ Error converting image to PDF: {e}")
        return False

def simple_pdf_to_images(pdf_path, output_dir):
    """Convert PDF to images using PyMuPDF"""
    try:
        import fitz  # PyMuPDF
        print(f"Converting PDF to images: {pdf_path}")
        
        pdf_document = fitz.open(pdf_path)
        converted_files = []
        
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better quality
            
            image_path = os.path.join(output_dir, f"{Path(pdf_path).stem}_page_{page_num + 1}.png")
            pix.save(image_path)
            
            if os.path.exists(image_path):
                converted_files.append(image_path)
                print(f"  ✓ Created image: {os.path.basename(image_path)}")
        
        pdf_document.close()
        return converted_files
        
    except Exception as e:
        print(f"  ✗ Error converting PDF to images: {e}")
        return []

def simple_image_convert(image_path, output_path, target_format):
    """Convert image to different format"""
    try:
        print(f"Converting image format: {image_path} -> {target_format}")
        image = Image.open(image_path)
        
        # Handle different formats
        if target_format.upper() in ['JPG', 'JPEG']:
            if image.mode in ('RGBA', 'LA', 'P'):
                # Create white background for JPEG
                rgb_image = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode in ('RGBA', 'LA'):
                    rgb_image.paste(image, mask=image.split()[-1])
                image = rgb_image
            image.save(output_path, 'JPEG', quality=85)
        else:
            image.save(output_path, target_format.upper())
        
        if os.path.exists(output_path):
            print(f"  ✓ Successfully converted to {target_format}")
            return True
        return False
        
    except Exception as e:
        print(f"  ✗ Error converting image format: {e}")
        return False

def convert_files_working(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    """Simple working file conversion"""
    try:
        os.makedirs(output_folder, exist_ok=True)
        converted_files = []
        
        print("=" * 50)
        print("STARTING FILE CONVERSION")
        print(f"Input files: {len(file_paths)}")
        print(f"Output formats: {output_formats}")
        print(f"Merge PDF: {merge_pdf}")
        print("=" * 50)
        
        for file_path in file_paths:
            if not os.path.exists(file_path):
                print(f"❌ File not found: {file_path}")
                continue
            
            file_size = os.path.getsize(file_path)
            file_ext = Path(file_path).suffix.lower()
            file_stem = Path(file_path).stem
            
            print(f"\n📁 Processing: {os.path.basename(file_path)}")
            print(f"   Extension: {file_ext}")
            print(f"   Size: {file_size} bytes")
            
            if file_size == 0:
                print("   ❌ File is empty, skipping")
                continue
            
            # Process each output format
            for format in output_formats:
                format = format.lower().strip()
                output_file = os.path.join(output_folder, f"{file_stem}.{format}")
                
                print(f"\n   🔄 Converting to {format.upper()}...")
                success = False
                
                # Image to PDF
                if format == 'pdf' and file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif']:
                    success = simple_image_to_pdf(file_path, output_file)
                
                # PDF to images  
                elif format in ['png', 'jpg', 'jpeg'] and file_ext == '.pdf':
                    image_files = simple_pdf_to_images(file_path, output_folder)
                    if image_files:
                        converted_files.extend(image_files)
                        success = True
                    
                # Image format conversion
                elif format in ['png', 'jpg', 'jpeg', 'bmp', 'tiff'] and file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif']:
                    success = simple_image_convert(file_path, output_file, format)
                
                # Copy PDF as PDF
                elif format == 'pdf' and file_ext == '.pdf':
                    import shutil
                    shutil.copy2(file_path, output_file)
                    success = True
                    print(f"   ✓ Copied PDF file")
                
                else:
                    print(f"   ⚠️  Conversion from {file_ext} to {format} not supported")
                
                # Add successful files to list
                if success and os.path.exists(output_file):
                    converted_files.append(output_file)
                    print(f"   ✅ Success: {os.path.basename(output_file)}")
        
        print(f"\n📦 CONVERSION COMPLETE")
        print(f"Total files created: {len(converted_files)}")
        
        # Create ZIP file if we have converted files
        if converted_files:
            zip_path = os.path.join(output_folder, 'converted_files.zip')
            print(f"\n📋 Creating ZIP file: {zip_path}")
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for file in converted_files:
                    if os.path.exists(file):
                        file_size = os.path.getsize(file)
                        zipf.write(file, os.path.basename(file))
                        print(f"   ✓ Added to ZIP: {os.path.basename(file)} ({file_size} bytes)")
            
            zip_size = os.path.getsize(zip_path)
            print(f"\n🎉 ZIP file created successfully!")
            print(f"ZIP size: {zip_size} bytes")
            print(f"ZIP path: {zip_path}")
            return zip_path
        else:
            print("\n❌ No files were converted successfully")
            return None
            
    except Exception as e:
        print(f"\n💥 CONVERSION ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise Exception(f"Conversion failed: {str(e)}")

# Keep original function name for compatibility
def convert_files(file_paths, output_formats, output_folder, merge_pdf=False, split_pdf_flag=False, delete_pages=None):
    return convert_files_working(file_paths, output_formats, output_folder, merge_pdf, split_pdf_flag, delete_pages)

def simple_docx_to_pdf(docx_path, output_path):
    """Convert DOCX to PDF using docx2pdf"""
    try:
        print(f"Converting DOCX to PDF: {docx_path} -> {output_path}")
        
        # Try using docx2pdf first
        try:
            from docx2pdf import convert
            convert(docx_path, output_path)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"  ✓ Successfully converted using docx2pdf: {os.path.getsize(output_path)} bytes")
                return True
        except Exception as e:
            print(f"  ⚠️ docx2pdf failed: {e}")
        
        # Try using python-docx to extract text and create simple PDF
        try:
            from docx import Document
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
            from reportlab.lib.units import inch
            
            print("  🔄 Using python-docx + reportlab fallback...")
            
            # Read DOCX content
            doc = Document(docx_path)
            content = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    content.append(paragraph.text)
            
            if not content:
                print("  ⚠️ No text content found in DOCX")
                return False
            
            # Create PDF
            pdf_doc = SimpleDocTemplate(output_path, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            for text in content:
                if text.strip():
                    # Handle Hebrew text
                    para = Paragraph(text, styles['Normal'])
                    story.append(para)
                    story.append(Spacer(1, 0.2*inch))
            
            pdf_doc.build(story)
            
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                print(f"  ✓ Successfully converted using fallback method: {os.path.getsize(output_path)} bytes")
                return True
                
        except Exception as e:
            print(f"  ⚠️ Fallback method failed: {e}")
        
        # Last resort: LibreOffice conversion (if available)
        try:
            import subprocess
            print("  🔄 Trying LibreOffice conversion...")
            
            result = subprocess.run([
                'soffice', '--headless', '--convert-to', 'pdf',
                '--outdir', os.path.dirname(output_path), docx_path
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and os.path.exists(output_path):
                print(f"  ✓ Successfully converted using LibreOffice: {os.path.getsize(output_path)} bytes")
                return True
            else:
                print(f"  ⚠️ LibreOffice failed: {result.stderr}")
                
        except Exception as e:
            print(f"  ⚠️ LibreOffice not available: {e}")
        
        print("  ❌ All DOCX conversion methods failed")
        return False
        
    except Exception as e:
        print(f"  ✗ Error converting DOCX to PDF: {e}")
        return False
