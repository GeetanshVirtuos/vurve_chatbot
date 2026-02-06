import re
import sys
from pathlib import Path


def clean_text(input_path):
    """
    Remove parentheses ( ), forward slashes /, and numbers from a text file.
    Saves the output in the same folder with '_cleaned' suffix.
    """
    # Read the input file
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File '{input_path}' not found.")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove numbers, parentheses, and forward slashes
    cleaned_content = re.sub(r'[0-9()/]', '', content)
    
    # Optional: Clean up multiple spaces to single space
    cleaned_content = re.sub(r' +', ' ', cleaned_content)
    
    # Create output filename in the same folder
    output_file = input_file.parent / f"{input_file.stem}_cleaned{input_file.suffix}"
    
    # Save the cleaned content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    print(f"✓ Cleaned text saved to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = input("Enter the path to the text file: ")
    
    clean_text(file_path)
