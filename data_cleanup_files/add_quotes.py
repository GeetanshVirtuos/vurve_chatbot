import sys
from pathlib import Path


def add_quotes_to_csv(input_path):
    """
    Add quotes around the text before the comma in each line.
    Converts: text, label
    To: "text", label
    """
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File '{input_path}' not found.")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    quoted_lines = []
    for line in lines:
        line = line.strip()
        if ',' in line:
            # Split at the first comma
            text, label = line.split(',', 1)
            # Add quotes around the text
            quoted_line = f'"{text}",{label}\n'
            quoted_lines.append(quoted_line)
        else:
            # Keep line as is if no comma
            quoted_lines.append(line + '\n')
    
    # Create output filename
    output_file = input_file.parent / f"{input_file.stem}_quoted{input_file.suffix}"
    
    # Save the result
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(quoted_lines)
    
    print(f"✓ Converted {len(quoted_lines)} lines")
    print(f"✓ Saved to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = input("Enter the path to the file: ")
    
    add_quotes_to_csv(file_path)
