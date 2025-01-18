import os
import json
import re

def clean_json_file(file_path):
    """
    Clean a file containing JSON by removing backticks and language indicators,
    keeping only the valid JSON content.
    
    Args:
        file_path (str): Path to the JSON file to clean
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Remove markdown-style code blocks (```json and ```)
        content = re.sub(r'```\s*json\s*', '', content)
        content = re.sub(r'```', '', content)
        
        # Find the first { or [ and last } or ]
        json_start = min(
            content.find('{') if content.find('{') != -1 else float('inf'),
            content.find('[') if content.find('[') != -1 else float('inf')
        )
        json_end = max(content.rfind('}'), content.rfind(']')) + 1
        
        if json_start == float('inf') or json_end <= 0:
            print(f"No valid JSON found in {file_path}")
            return
        
        # Extract just the JSON part
        json_content = content[json_start:json_end]
        
        # Validate that it's valid JSON
        json.loads(json_content)  # This will raise an exception if invalid
        
        # Write the cleaned content back to the file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(json_content)
        
        print(f"Successfully cleaned {file_path}")
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {str(e)}")
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")

def process_directory(directory_path):
    """
    Process all JSON files in the given directory.
    
    Args:
        directory_path (str): Path to the directory containing JSON files
    """
    for filename in os.listdir(directory_path):
        if filename.endswith('.json'):
            file_path = os.path.join(directory_path, filename)
            print(f"Processing {filename}...")
            clean_json_file(file_path)

if __name__ == "__main__":
    # Get the directory path from user input
    directory = input("Enter the directory path containing JSON files: ")
    
    
    if os.path.isdir(directory):
        process_directory(directory)
    else:
        print("Invalid directory path!")