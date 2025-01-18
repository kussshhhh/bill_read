import os

def create_empty_json_files(image_folder):
    # Get the parent directory of the image folder
    parent_dir = os.path.dirname(image_folder)
    
    # Create the sibling folder for JSON files
    json_folder = os.path.join(parent_dir, os.path.basename(image_folder) + "_json")
    os.makedirs(json_folder, exist_ok=True)
    
    # Loop through all files in the image folder
    for filename in os.listdir(image_folder):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            # Create an empty JSON file path with the same name as the image
            json_path = os.path.join(json_folder, f"{os.path.splitext(filename)[0]}.json")
            
            # Create an empty JSON file
            with open(json_path, 'w') as json_file:
                json_file.write("{}")  # Write empty JSON content
    
    print(f"Empty JSON files created in: {json_folder}")

# Example usage:
# Replace 'path_to_image_folder' with the path to your folder containing receipt images
image_folder_path = "/home/kush/cooking/bill_read/images.cv_4javrql7ppkcofef7pzky/data/val/receipt"  # Update this path
create_empty_json_files(image_folder_path)
