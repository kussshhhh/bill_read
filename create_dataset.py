import os
import base64
import time
from groq import Groq

# Groq API configuration
API_KEY = ""  # Replace with your Groq API key

# Updated Prompt Template
PROMPT_TEMPLATE = """
 Analyze this receipt and respond ONLY with these exact details in this format:
                {
                    "name_of_establishment": "name of store/restaurant",
                    "currency": "$" or any other,
                    "items": [
                        {
                            "name": "item name",
                            "quantity": number,
                            "price_per_item": price,
                            "total_price": quantity * price
                        }
                    ],
                    "number_of_items": total count of unique items,
                    "subtotal": subtotal amount,
                    "tax": tax amount or "NA" if none,
                    "tip": tip amount or "NA" if none,
                    "additional_charges": additional charges or "NA" if none,
                    "total": final total amount
                }
                
                Only include information you can clearly see. Use "NA" for missing values.
                Format all prices as decimal numbers without currency symbols.
                Keep item names exactly as written on receipt. and give back json

If a value does not exist or cannot be parsed, return "na" for it.
Return **only** this JSON format with no additional text.
only JSON nothing else
only json(very very important)
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
                if request_count >= 14:
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
                            {"type": "text", "text": PROMPT_TEMPLATE},
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
                    temperature=0.6,
                    max_completion_tokens=1024,
                    # top_p=1,
                    stream=False,
                    # response_format={"type": "json_object"},
                    stop=None,
                )
                print(response)
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
image_folder_path = ""
json_folder_path = ""

process_receipt_images(image_folder_path, json_folder_path)
