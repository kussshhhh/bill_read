import os
import json
import moondream as md
from PIL import Image

# Initialize with API key
model = md.vl(api_key="")


# Folder path containing the images
folder_path = "/images.cv_4javrql7ppkcofef7pzky/data/train/receipt"

# Get the list of all files in the folder and filter for images
image_files = [f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]

# Limit to the first 10 images
image_files = image_files[:10]

# Open a file to write the results
with open("receipt_analysis_results.json", "w") as result_file:
    # Iterate over the images
    for image_file in image_files:
        # Full path to the image
        image_path = os.path.join(folder_path, image_file)

        # Open the image
        image = Image.open(image_path)
        encoded_image = model.encode_image(image)  # Encode image

        # Query the receipt with the specified prompt
        response = model.query(encoded_image, 
                                   "Analyze this receipt and respond ONLY with these exact details in this format: {\"name_of_establishment\": \"name of store/restaurant\", \"currency\": \"$\" or any other, \"items\": [{\"name\": \"item name\", \"quantity\": number, \"price_per_item\": price, \"total_price\": quantity * price}], \"number_of_items\": total count of unique items, \"subtotal\": subtotal amount, \"tax\": tax amount or \"NA\" if none, \"tip\": tip amount or \"NA\" if none, \"additional_charges\": additional charges or \"NA\" if none, \"total\": final total amount}. Only include information you can clearly see. Use \"NA\" for missing values. Format all prices as decimal numbers without currency symbols. Keep item names exactly as written on receipt. and give back json. If a value does not exist or cannot be parsed, return \"na\" for it."
                               )["answer"]

        # Check if the response is valid JSON
        try:
            json_response = json.loads(response)
            is_json = True
        except json.JSONDecodeError:
            json_response = response
            is_json = False

        # Print the result and indicate if it's valid JSON
        print(f"Response for {image_file}:")
        print(json_response)
        print(f"Is this a valid JSON? {is_json}")

        # Write the response to the file (including the filename for reference)
        result_file.write(f"Response for {image_file}:\n")
        result_file.write(json.dumps(json_response, indent=4) + "\n\n")

print("Analysis complete. Results written to receipt_analysis_results.json")
