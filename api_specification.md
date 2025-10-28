# AI Travel Planner - API Specification

This document outlines the API endpoints for the AI Travel Planner application, detailing how the frontend should interact with the backend.

## Base URL

The backend server runs on `http://localhost:3000`.

---

## Authentication

Authentication is handled via `httpOnly` cookies. After a successful sign-in, the backend sets an `access_token` and a `refresh_token` in the user's browser. All subsequent requests to protected endpoints must include these cookies.

### 1. User Signup

- **Endpoint:** `POST /auth/signup`
- **Description:** Registers a new user in the Supabase database.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "a_strong_password"
  }
  ```
- **Success Response (201 Created):**
  - Returns a user object provided by Supabase.
  ```json
  {
    "data": {
      "user": {
        "id": "...",
        "email": "user@example.com",
        // ... other user details
      },
      "session": null
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "Email and password are required."
  }
  ```
  or
  ```json
  {
    "error": "User already registered"
  }
  ```

### 2. User Sign-in

- **Endpoint:** `POST /auth/signin`
- **Description:** Authenticates an existing user and sets session cookies.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "a_strong_password"
  }
  ```
- **Success Response (200 OK):**
  - Sets `access_token` and `refresh_token` as `httpOnly` cookies.
  - Returns the user and session object from Supabase.
  ```json
  {
    "data": {
      "user": {
        "id": "...",
        "email": "user@example.com",
        // ... other user details
      },
      "session": {
        "access_token": "...",
        "refresh_token": "...",
        // ... other session details
      }
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "Invalid login credentials"
  }
  ```

---

## Protected API

These endpoints require a valid `access_token` cookie to be sent with the request.

### 1. Generate Travel Plan

- **Endpoint:** `POST /api/plan-trip`
- **Description:** Generates a new, personalized travel plan using AI, and saves it to the user's account.
- **Authentication:** Required (via session cookie).
- **Request Body:**
  ```json
  {
    "destination": "Tokyo, Japan",
    "duration": 7,
    "budget": 2000,
    "travelers": "2 adults",
    "preferences": "Interested in temples, technology, and local cuisine."
  }
  ```
- **Success Response (201 Created):**
  - Returns the newly created `trip_id` along with the AI-generated plan.
  ```json
  {
    "trip_id": "some-uuid-goes-here",
    "itinerary": [
      {
        "day": 1,
        "theme": "Arrival and Shinjuku Exploration",
        "activities": [
          {
            "time": "14:00",
            "activity_type": "Arrival",
            "description": "Arrive at Narita Airport (NRT), clear customs, and take the Narita Express to Shinjuku.",
            "location_name": "Shinjuku Station",
            "address": "Shinjuku, Tokyo, Japan"
          },
          // ... more activities
        ]
      },
      // ... more days
    ],
    "estimated_cost": {
      "flights": 800,
      "accommodation": 700,
      "activities": 300,
      "food": 200,
      "total": 2000
    }
  }
  ```
- **Error Responses:**
  - **400 Bad Request:** If required parameters are missing.
    ```json
    {
      "error": "Missing required travel parameters."
    }
    ```
  - **401 Unauthorized:** If the user is not authenticated.
    ```json
    {
      "error": "User not authenticated."
    }
    ```
  - **500 Internal Server Error:** If there is an issue with the AI generation or database insertion.
    ```json
    {
      "error": "Failed to create travel plan: [specific error message]"
    }
    ```
