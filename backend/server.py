from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import json
import moondream as md
from PIL import Image
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Get API key from environment variable
MOONDREAM_API_KEY = os.getenv('MOONDREAM_API_KEY')
if not MOONDREAM_API_KEY:
    raise ValueError("MOONDREAM_API_KEY environment variable is not set")

# Initialize Moondream model
model = md.vl(api_key=MOONDREAM_API_KEY)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

@app.route('/analyze_receipt', methods=['POST'])
def analyze_receipt():
    # Check if image file is present in request
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    
    # Check if file is empty
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Read image directly from request
        image_data = file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Encode image
        encoded_image = model.encode_image(image)
        
        # Query the receipt
        response = model.query(
            encoded_image,
          '''Analyze this receipt and respond ONLY with these exact details in this format: 
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
            
            Only include information you can clearly see.
            Use "NA" for missing values.
            Format all prices as decimal numbers without currency symbols.
            Keep item names exactly as written on receipt.
            If a value does not exist or cannot be parsed, return "NA" for it.
            Maintain the exact order of fields in the JSON structure. and give back only and only json nothing else just json'''
            
        )["answer"]
        
        # Try to parse the response as JSON
        print(response) 
        try:
            json_response = json.loads(response)
            return jsonify(json_response)
        except json.JSONDecodeError:
            return jsonify({'error': 'Failed to parse model response as JSON', 'raw_response': response}), 500
            
    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500
