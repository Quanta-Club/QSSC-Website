import requests
import json
from datetime import datetime

# --- Configuration ---
# Replace this with your Render URL once deployed.
# For local testing, your server should be running on port 3000.
BASE_URL = "http://localhost:3000" 

# --- Helper Function ---
def print_response(test_name, response):
    """Helper function to print formatted test results."""
    print(f"--- {test_name} ---")
    print(f"Status Code: {response.status_code}")
    try:
        # Pretty-print JSON response if possible
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
        print(f"Response Text: {response.text}")
    print("-" * (len(test_name) + 6) + "\n")


# --- Test Functions ---

def test_root_endpoint():
    """Tests the GET / endpoint."""
    try:
        response = requests.get(f"{BASE_URL}/")
        print_response("Test Root Endpoint (GET /)", response)
    except requests.exceptions.ConnectionError as e:
        print(f"Could not connect to the server at {BASE_URL}. Is it running?")
        print(f"Error: {e}")
        return False
    return True

def test_get_workshops():
    """Tests the GET /workshops endpoint."""
    response = requests.get(f"{BASE_URL}/workshops")
    print_response("Test Get Workshops (GET /workshops)", response)
    # Basic check to see if we got a list
    if response.status_code == 200 and isinstance(response.json(), list):
        print("SUCCESS: Workshop list received.\n")
    else:
        print("FAILURE: Did not receive a valid workshop list.\n")


def test_user_registration():
    """Tests the POST /register endpoint with various scenarios."""
    # 1. Successful registration
    unique_email = f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    user_data = {
        "username": "Test User",
        "email": unique_email
    }
    response_success = requests.post(f"{BASE_URL}/register", json=user_data)
    print_response("Test Successful Registration (POST /register)", response_success)

    # 2. Attempt to register the same email again (should fail)
    response_duplicate = requests.post(f"{BASE_URL}/register", json=user_data)
    print_response("Test Duplicate Email Registration (POST /register)", response_duplicate)
    if response_duplicate.status_code == 400:
        print("SUCCESS: Server correctly rejected duplicate email.\n")
    else:
        print("FAILURE: Server did not reject duplicate email correctly.\n")

    # 3. Attempt to register with invalid data (missing username)
    invalid_data = {
        "email": f"another_user_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    }
    response_invalid = requests.post(f"{BASE_URL}/register", json=invalid_data)
    print_response("Test Invalid Data Registration (POST /register)", response_invalid)
    if response_invalid.status_code == 400:
        print("SUCCESS: Server correctly rejected invalid data.\n")
    else:
        print("FAILURE: Server did not reject invalid data correctly.\n")

# --- Main Execution ---
if __name__ == "__main__":
    print("Starting API tests...")
    # First, check if the server is running at all
    if test_root_endpoint():
        test_get_workshops()
        test_user_registration()
    print("API tests complete.")

