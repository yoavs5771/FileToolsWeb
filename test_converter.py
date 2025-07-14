#!/usr/bin/env python3
"""
Test script for the converter module
"""

import os
import tempfile
from PIL import Image
import converter

def test_image_conversion():
    """Test image conversion functionality"""
    print("Testing image conversion...")
    
    # Create a temporary test image
    with tempfile.TemporaryDirectory() as temp_dir:
        test_image_path = os.path.join(temp_dir, "test.png")
        output_path = os.path.join(temp_dir, "test.jpg")
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img.save(test_image_path)
        
        try:
            converter.convert_image(test_image_path, output_path, 'jpg')
            if os.path.exists(output_path):
                print("✓ Image conversion test passed")
                return True
            else:
                print("✗ Image conversion test failed - output file not created")
                return False
        except Exception as e:
            print(f"✗ Image conversion test failed: {e}")
            return False

def test_libreoffice_availability():
    """Test LibreOffice availability"""
    print("Testing LibreOffice availability...")
    available = converter.check_libreoffice_available()
    print(f"LibreOffice available: {available}")
    return available

if __name__ == "__main__":
    print("Running converter tests...")
    print()
    
    # Test LibreOffice
    test_libreoffice_availability()
    print()
    
    # Test image conversion
    test_image_conversion()
    print()
    
    print("Tests completed!")
