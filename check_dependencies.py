#!/usr/bin/env python3
"""
Installation helper script for FileToolsWeb dependencies
"""

import subprocess
import sys
import os

def check_libreoffice():
    """Check if LibreOffice is available"""
    try:
        import converter
        return converter.check_libreoffice_available()
    except:
        return False

def install_libreoffice_instructions():
    """Print instructions for installing LibreOffice"""
    print("LibreOffice is not installed or not accessible from the command line.")
    print("\nTo install LibreOffice:")
    print("1. Download LibreOffice from: https://www.libreoffice.org/download/download/")
    print("2. Run the installer with administrator privileges")
    print("3. During installation, make sure to select 'Add to PATH' if available")
    print("4. After installation, restart your command prompt/terminal")
    print("\nAlternatively, you can use the built-in docx2pdf converter for DOCX files only.")

def main():
    print("FileToolsWeb Dependency Checker")
    print("=" * 40)
    
    # Check LibreOffice
    print("Checking LibreOffice...")
    if check_libreoffice():
        print("✓ LibreOffice is available")
    else:
        print("✗ LibreOffice is not available")
        install_libreoffice_instructions()
    
    print("\n" + "=" * 40)
    print("Dependency check completed!")

if __name__ == "__main__":
    main()
