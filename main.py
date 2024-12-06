# main.py

from flask import Flask, render_template, request, jsonify, send_from_directory
from scrape_jobs import scrape_jobs
import os

app = Flask(__name__)

# Route to serve the main page
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle the scraping process
@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.json

    # Extract parameters with default values
    search_term = data.get('search_term', '')
    google_search_term = data.get('google_search_term', '')
    results_wanted = int(data.get('results_wanted', 100))
    hours_old = int(data.get('hours_old', 500))
    location = data.get('location', '')
    country_indeed = data.get('country_indeed', '')

    # Run the scraper
    try:
        scrape_jobs(
            search_term=search_term,
            google_search_term=google_search_term,
            results_wanted=results_wanted,
            hours_old=hours_old,
            location=location,
            country_indeed=country_indeed
        )
        return jsonify({"status": "Scraping started"}), 202
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to download the CSV file
@app.route('/download', methods=['GET'])
def download_csv():
    csv_path = os.path.join(os.getcwd(), 'static', 'jobs.csv')
    if os.path.exists(csv_path):
        return send_from_directory(directory='static', path='jobs.csv', as_attachment=True)
    else:
        return jsonify({"error": "CSV file not found."}), 404

if __name__ == '__main__':
    # Fetch the port from the environment variable
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)