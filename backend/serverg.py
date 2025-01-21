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

initial_prompt = """
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

        # Convert image to base64
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Prepare the payload for Gemini Pro API
        prompt = f"{initial_prompt}\n![receipt](data:image/jpeg;base64,{img_str})"

        # Send request to Gemini Pro API
        response = genai.chat(messages=prompt, model="gemini-pro-vision")

        # Check for successful response
        if response.status_code != 200:
            return jsonify({'error': 'Failed to get response from Gemini Pro API'}), response.status_code

        # Parse the response
        response_data = response.json()
        if 'candidates' in response_data and len(response_data['candidates']) > 0:
            model_response = response_data['candidates'][0]['content']['parts'][0]['text']

            # Remove triple backticks and any text before or after the JSON
            json_str = re.search(r'```(json)?\s*({.*})\s*```', model_response, re.DOTALL)
            if json_str:
                json_content = json_str.group(2)
                try:
                    json_response = json.loads(json_content)
                    return jsonify(json_response)
                except json.JSONDecodeError:
                    return jsonify({'error': 'Failed to parse model response as JSON', 'raw_response': model_response}), 500
            else:
                return jsonify({'error': 'No JSON object found in model response', 'raw_response': model_response}), 500
        else:
            return jsonify({'error': 'Invalid response from Gemini Pro API'}), 500

    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
