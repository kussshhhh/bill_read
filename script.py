import moondream as md
from PIL import Image
from pathlib import Path
import json
import os

def analyze_receipts():
    # Paths
    model_path = "./moondream-2b-int8.mf"
    image_dir = "images.cv_4javrql7ppkcofef7pzky/data/train/receipt"
    num_images = 10  # Set to analyze first 10 images
    
    # Verify paths exist
    if not os.path.exists(model_path):
        print(f"Error: Model not found at {model_path}")
        return
    if not os.path.exists(image_dir):
        print(f"Error: Image directory not found at {image_dir}")
        return

    try:
        # Initialize model
        print("Loading model...")
        model = md.vl(model=model_path)
        
        # Get list of image files
        image_files = sorted(Path(image_dir).glob('*.[jp][pn][g]'))[:num_images]
        all_receipts = []

        # Process each image
        for idx, image_path in enumerate(image_files, 1):
            print(f"\n{'='*50}")
            print(f"Processing receipt {idx}/{num_images}: {image_path}")
            print(f"{'='*50}")
            
            try:
                # Load and encode image
                image = Image.open(image_path)
                encoded_image = model.encode_image(image)
                
                # Structured prompt
                prompt = """
                Analyze this receipt and provide the details in JSON format. If you cannot read or determine any value, use "NA". Format:
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
                """
                
                # Get model's response
                print("Analyzing receipt...")
                response = model.query(encoded_image, prompt)
                
                # Check if response is a dictionary and has 'answer' key
                if isinstance(response, dict) and 'answer' in response:
                    response_text = response['answer']
                else:
                    print("Unexpected response format")
                    response_text = str(response)
                
                print("\nRaw model response:")
                print(response_text)
                
                try:
                    # Handle case where response is just "NA"
                    if response_text.strip().upper() == '"NA"' or response_text.strip().upper() == 'NA':
                        receipt_data = {
                            "name_of_establishment": "NA",
                            "currency": "NA",
                            "items": [],
                            "number_of_items": 0,
                            "subtotal": "NA",
                            "tax": "NA",
                            "tip": "NA",
                            "additional_charges": "NA",
                            "total": "NA"
                        }
                    else:
                        # Try to parse as JSON
                        receipt_data = json.loads(response_text)
                    
                    # Add metadata
                    receipt_data["receipt_id"] = idx
                    receipt_data["image_path"] = str(image_path)
                    all_receipts.append(receipt_data)
                    
                    print("\nStructured data extracted successfully")
                    print(json.dumps(receipt_data, indent=2))
                    
                except json.JSONDecodeError as e:
                    print(f"\nFailed to parse JSON: {str(e)}")
                    # Create fallback structure
                    fallback_data = {
                        "receipt_id": idx,
                        "image_path": str(image_path),
                        "name_of_establishment": "NA",
                        "currency": "NA",
                        "items": [],
                        "number_of_items": 0,
                        "subtotal": "NA",
                        "tax": "NA",
                        "tip": "NA",
                        "additional_charges": "NA",
                        "total": "NA",
                        "raw_response": response_text
                    }
                    all_receipts.append(fallback_data)
                    print("\nFallback data created")
                    
            except Exception as e:
                print(f"Error processing image: {str(e)}")
                continue

        # Save all results to JSON file
        output_file = "receipt_analysis.json"
        with open(output_file, "w") as f:
            json.dump(all_receipts, f, indent=2)
        
        print(f"\n{'='*50}")
        print(f"Analysis complete. Processed {len(all_receipts)} receipts")
        print(f"Results saved to: {output_file}")
        print(f"{'='*50}")
        
        return all_receipts

    except Exception as e:
        print(f"Fatal error: {str(e)}")
        return None

if __name__ == "__main__":
    receipts = analyze_receipts()