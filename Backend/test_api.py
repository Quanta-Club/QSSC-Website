import os
import requests
import random
import string
import sys

# --- Configuration ---
# IMPORTANT: Replace this with the URL from your Render service.
# Example: "https://my-api-xxxx.onrender.com"
BASE_URL = os.environ.get("API_BASE_URL", "https://your-render-app-name.onrender.com")

def generate_random_string(length=8):
    """Generates a random alphanumeric string."""
    letters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(letters) for i in range(length))

def test_register_endpoint():
    """Tests the /register endpoint."""
    print("--- Running Register Test ---")
    
    random_suffix = generate_random_string()
    test_user = {
        "username": f"Test User {random_suffix}",
        "email": f"test.{random_suffix}@example.com"
    }
    
    print(f"Attempting to register user: {test_user['email']}")
    
    url = f"{BASE_URL}/register"
    try:
        response = requests.post(url, json=test_user, timeout=30)
        
        assert response.status_code == 201, f"Expected status 201, got {response.status_code}"
        data = response.json()
        
        assert "id" in data
        assert data["username"] == test_user["username"]
        assert data["email"] == test_user["email"]
        
        print("Register test passed.")
        
    except requests.exceptions.RequestException as e:
        raise AssertionError(f"API request failed: {e}") from e
    except AssertionError as e:
        print(f"Response Body: {response.text}")
        raise AssertionError(f"Register test failed: {e}") from e

def test_workshops_endpoint():
    """Tests the /workshops endpoint."""
    print("\n--- Running Workshops Test ---")
    
    url = f"{BASE_URL}/workshops"
    try:
        response = requests.get(url, timeout=30)
        
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        for workshop in data:
            assert "status" in workshop
            assert workshop["status"] in ["running", "upcoming", "passed"]
            
        print("Workshops test passed.")

    except requests.exceptions.RequestException as e:
        raise AssertionError(f"API request failed: {e}") from e
    except AssertionError as e:
        print(f"Response Body: {response.text}")
        raise AssertionError(f"Workshops test failed: {e}") from e


if __name__ == "__main__":
    if "your-render-app-name" in BASE_URL:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! ERROR: Please update the BASE_URL in test_api.py     !!!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        sys.exit(1)
    
    try:
        print(f"Testing API at: {BASE_URL}")
        test_register_endpoint()
        test_workshops_endpoint()
        print("\n✅ ALL TESTS PASSED")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)

