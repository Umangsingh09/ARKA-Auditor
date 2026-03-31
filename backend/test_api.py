#!/usr/bin/env python3
"""
Test script to validate the ARKA-Auditor API endpoints
"""
import requests
import json
import sys

BASE_URL = "http://127.0.0.1:5000"

def test_analyze_endpoint():
    """Test the /analyze endpoint"""
    print("🧪 Testing /analyze endpoint...")

    test_data = {
        "repo_url": "https://github.com/octocat/Hello-World",
        "token": "fake_token_for_testing"
    }

    try:
        response = requests.post(f"{BASE_URL}/analyze", json=test_data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ /analyze endpoint working")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        else:
            print(f"❌ /analyze endpoint failed: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ /analyze endpoint error: {e}")

def test_generate_fix_endpoint():
    """Test the /generate-fix endpoint"""
    print("\n🧪 Testing /generate-fix endpoint...")

    test_data = {
        "repo_url": "https://github.com/octocat/Hello-World",
        "vulnerability": "Test vulnerability"
    }

    try:
        response = requests.post(f"{BASE_URL}/generate-fix", json=test_data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ /generate-fix endpoint working")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        else:
            print(f"❌ /generate-fix endpoint failed: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ /generate-fix endpoint error: {e}")

def test_create_pr_endpoint():
    """Test the /create-pr endpoint"""
    print("\n🧪 Testing /create-pr endpoint...")

    test_data = {
        "repo_url": "https://github.com/octocat/Hello-World",
        "token": "fake_token_for_testing",
        "fix": "Test fix content"
    }

    try:
        response = requests.post(f"{BASE_URL}/create-pr", json=test_data, timeout=10)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ /create-pr endpoint working")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        else:
            print(f"❌ /create-pr endpoint failed: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ /create-pr endpoint error: {e}")

if __name__ == "__main__":
    print("🚀 Starting ARKA-Auditor API tests...")
    print("=" * 50)

    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print("✅ Backend server is running")
    except requests.exceptions.RequestException:
        print("❌ Backend server is not running. Please start it first with: python app.py")
        sys.exit(1)

    # Run tests
    test_analyze_endpoint()
    test_generate_fix_endpoint()
    test_create_pr_endpoint()

    print("\n" + "=" * 50)
    print("🎉 API testing complete!")