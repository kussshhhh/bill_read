import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from PIL import Image
import io
from dotenv import load_dotenv
import base64
import google.generativeai as genai 

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Get API key from environment variable
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

# Configure the Gemini API client
genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

initial_prompt = """
Analyze this receipt and respond ONLY with these exact details in this format:
{
    "name_of_establishment": "name of store/restaurant",
    "currency": "$" or "rupees" any other,
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
Maintain the exact order of fields in the JSON structure.
Ensure that the total amount matches the sum of subtotal, tax, tip, and additional charges.
Respond with only the JSON object, nothing else.
"""

# Function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_json(text):
    # Find the first { and last }
    start = text.find('{')
    end = text.rfind('}')
    
    if start == -1 or end == -1:
        raise ValueError("No JSON object found in response")
        
    # Extract everything between first { and last }
    json_str = text[start:end + 1]
    
    # Validate it's valid JSON
    return json.loads(json_str)

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
        image = Image.open(file) 
      
        # Send request to Gemini API
        response = model.generate_content([
            initial_prompt,
            image
        ])
        # Check for successful response
        if response.status_code != 200:
            return jsonify({'error': 'Failed to get response from Gemini Pro API'}), response.status_code

        try:
            json_response = extract_json(response.text)
            return jsonify(json_response)
        except (json.JSONDecodeError, ValueError) as e:
            return jsonify({
                'error' : 'Failed to parse response as json',
                'raw_response': response.text
            }) , 500

    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
