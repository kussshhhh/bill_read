import os
import base64
import time
from groq import Groq

# Groq API configuration
API_KEY = "your_groq_api_key"  # Replace with your Groq API key

# Updated Prompt Template
PROMPT_TEMPLATE = """
Extract the following information from the image and return it in this exact JSON format:
{
  "restaurant_name": "na",
  "bill_number": "na",
  "date": "na",
  "time": "na",
  "currency": "na",
  "items": [
    {
      "item_name": "na",
      "quantity": "na",
      "unit_price": "na",
      "total_price": "na"
    }
  ],
  "subtotal": "na",
  "tax_percentage": "na",
  "tip_percentage": "na",
  "tip_amount": "na",
  "additional_charges": "na",
  "tax_amount": "na",
  "total_amount": "na",
  "payment_method": "na",
  "table_number": "na"
}
If a value does not exist or cannot be parsed, return "na" for it.
"""

def encode_image(image_path):
    """Encode image to base64."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def process_receipt_images(image_folder, json_folder):
    """Process receipt images and save extracted information as JSON."""
    client = Groq(api_key=API_KEY)
    
    # Time tracking for rate-limiting
    request_count = 0
    start_time = time.time()

    # Loop through all image files in the image folder
    for filename in os.listdir(image_folder):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(image_folder, filename)
            json_path = os.path.join(json_folder, f"{os.path.splitext(filename)[0]}.json")
            
            try:
                # Check if 15 requests have been made in the last minute
                if request_count >= 15:
                    elapsed_time = time.time() - start_time
                    if elapsed_time < 60:
                        time.sleep(60 - elapsed_time)  # Sleep to stay within the rate limit
                    start_time = time.time()  # Reset the timer
                    request_count = 0  # Reset the request count
                
                # Encode the image to base64
                base64_image = encode_image(image_path)
                
                # Prepare the request payload
                messages = [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Extract receipt information in JSON format."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ]
                
                # Send the request to Groq API
                response = client.chat.completions.create(
                    model="llama-3.2-90b-vision-preview",
                    messages=messages,
                    temperature=1,
                    max_completion_tokens=1024,
                    top_p=1,
                    stream=False,
                    response_format={"type": "json_object"},
                    stop=None,
                )
                
                # Check for successful response
                if response and response.choices:
                    # Save the returned JSON directly to the file in the correct format
                    with open(json_path, 'w') as json_file:
                        json_file.write(response.choices[0].message.content)
                    
                    request_count += 1  # Increment the request count
                else:
                    print(f"Error processing {filename}: No response or choices.")
            
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

    print("Processing complete.")

# Example usage:
# Replace with the actual paths to your image and JSON folders
image_folder_path = "/path/to/your/images"
json_folder_path = "/path/to/your/jsons"

process_receipt_images(image_folder_path, json_folder_path)
