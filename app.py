import moondream as md
from PIL import Image
from pathlib import Path
import json
import os

def analyze_receipts():
    # Paths
    model_path = "./moondream-0_5b-int8.mf"
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
                Analyze this receipt and respond ONLY with these exact details in this format:
                {
                    "store_name": "name of store/restaurant",
                    "items": [
                        {
                            "name": "item name",
                            "quantity": number,
                            "price_per_item": price,
                            "total_price": quantity × price
                        }
                    ],
                    "number_of_items": total count of unique items,
                    "subtotal": subtotal amount,
                    "tax": tax amount or "NA" if none,
                    "tip": tip amount or "NA" if none,
                    "total": final total amount
                }
                
                Only include information you can clearly see. Use "NA" for missing values.
                Format all prices as decimal numbers without currency symbols.
                Keep item names exactly as written on receipt.
                """
                
                # Get model's response
                print("Analyzing receipt...")
                response = model.query(encoded_image, prompt)["answer"]
                print("\nRaw model response:")
                print(response)
                
                try:
                    # Try to parse as JSON
                    receipt_data = json.loads(response)
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
                        "store_name": "NA",
                        "items": [],
                        "number_of_items": 0,
                        "subtotal": "NA",
                        "tax": "NA",
                        "tip": "NA",
                        "total": "NA",
                        "raw_response": response
                    }
                    all_receipts.append(fallback_data)
                    print("\nFallback data created:")
                    print(json.dumps(fallback_data, indent=2))
                    
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