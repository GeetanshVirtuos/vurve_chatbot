import sys
from pathlib import Path


def remove_hi_hello_lines(input_path):
    """
    Remove lines that contain only 'Hi' or 'Hello' (with optional whitespace).
    Saves the output in the same folder with '_filtered' suffix.
    """
    # Read the input file
    input_file = Path(input_path)
    
    if not input_file.exists():
        print(f"Error: File '{input_path}' not found.")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Filter out lines that are only "Hi" or "Hello"
    filtered_lines = []
    removed_count = 0
    
    for line in lines:
        stripped = line.strip()
        # Skip lines that are exactly "Hi" or "Hello"
        if stripped.lower() in ['hi', 'hello']:
            removed_count += 1
            continue
        filtered_lines.append(line)
    
    # Join the filtered lines
    filtered_content = ''.join(filtered_lines)
    
    # Create output filename in the same folder
    output_file = input_file.parent / f"{input_file.stem}_filtered{input_file.suffix}"
    
    # Save the filtered content
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(filtered_content)
    
    print(f"✓ Removed {removed_count} lines containing only 'Hi' or 'Hello'")
    print(f"✓ Filtered text saved to: {output_file}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = input("Enter the path to the text file: ")
    
    remove_hi_hello_lines(file_path)
