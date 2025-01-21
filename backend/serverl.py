import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from PIL import Image
import io
from dotenv import load_dotenv
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure allowed extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Get API key from environment variable
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")

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

        # Prepare the payload for Groq API
        payload = {
            "model": "llama-3.2-90b-vision-preview",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Analyze this receipt and respond ONLY with these exact details in this format: \n{\n\"name_of_establishment\": \"name of store/restaurant\",\n\"currency\": \"$\" or any other,\n\"items\": [\n{\n\"name\": \"item name\",\n\"quantity\": number,\n\"price_per_item\": price,\n\"total_price\": quantity * price\n}\n],\n\"number_of_items\": total count of unique items,\n\"subtotal\": subtotal amount,\n\"tax\": tax amount or \"NA\" if none,\n\"tip\": tip amount or \"NA\" if none,\n\"additional_charges\": additional charges or \"NA\" if none,\n\"total\": final total amount\n}\n\nOnly include information you can clearly see.\nUse \"NA\" for missing values.\nFormat all prices as decimal numbers without currency symbols.\nKeep item names exactly as written on receipt.\nIf a value does not exist or cannot be parsed, return \"NA\" for it.\nMaintain the exact order of fields in the JSON structure. and give back only and only json nothing else just json"},
                {"role": "user", "content": f"![receipt](data:image/jpeg;base64,{img_str})"}
            ]
        }

        # Send request to Groq API
        response = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json'
            },
            json=payload
        )

        # Check for successful response
        if response.status_code != 200:
            return jsonify({'error': 'Failed to get response from Groq API'}), response.status_code

        # Parse the response
        response_data = response.json()
        if 'choices' in response_data and len(response_data['choices']) > 0:
            model_response = response_data['choices'][0]['message']['content']

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
            return jsonify({'error': 'Invalid response from Groq API'}), 500

    except Exception as e:
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
