import sys
from pathlib import Path


def remove_whitespace_and_blank_lines(input_path):
    """
    Remove extra white spaces and blank lines from a text file.
    Saves the output in the same folder with '_no_whitespace' suffix.
    """
    # Read the input file
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File '{input_path}' not found.")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Process lines: strip whitespace and remove blank lines
    cleaned_lines = []
    for line in lines:
        # Strip leading/trailing whitespace
        stripped_line = line.strip()
        # Only keep non-empty lines
        if stripped_line:
            cleaned_lines.append(stripped_line)
    
    # Join lines with newline
    cleaned_content = '\n'.join(cleaned_lines)
    
    # Create output filename in the same folder
    output_file = input_file.parent / f"{input_file.stem}_no_whitespace{input_file.suffix}"
    
    # Save the cleaned content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)
    
    print(f"✓ Cleaned text saved to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = input("Enter the path to the text file: ")
    
    remove_whitespace_and_blank_lines(file_path)
