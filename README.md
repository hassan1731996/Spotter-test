# Spotter HOS Trip Planner

A comprehensive Hours of Service (HOS) Trip Planner and Compliance simulation tool. This application allows users to plan trucking routes, ensuring compliance with US DOT regulations (11h driving, 14h on-duty, 70h/8-day cycle).

## Features

*   **Route Planning**: Interactive map (Leaflet) with auto-complete search.
*   **HOS Engine**: Calculates drive time, on-duty time, and required breaks (30-min break, 10-hour reset).
*   **Compliance Dashboard**: Visualizes 70-hour cycle usage and upcoming violations.
*   **Log Sheet**: Generates a daily driver's log grid (SVG) resembling standard FMCSA paper logs.
*   **API Key Authentication**: Secure backend API access.

## Tech Stack

### Backend
*   **Language**: Python 3.12+
*   **Framework**: Django 6.0 + Django REST Framework (DRF)
*   **Documentation**: Swagger/OpenAPI (`drf-spectacular`)
*   **Type Checking**: `mypy`
*   **Linting/Formatting**: `ruff`, `black`, `isort`

### Frontend
*   **Language**: JavaScript (React 18)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **Maps**: `react-leaflet`, `leaflet`
*   **Linting/Formatting**: ESLint, Prettier

## Prerequisites

*   Python 3.12 or higher
*   Node.js v20+ and npm

## Setup & Installation

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create and activate a virtual environment (optional but recommended):
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Set up environment variables:
    Create a `.env` file in `backend/` (or rely on defaults for dev).
    ```env
    SECRET_KEY=your-secret-key
    DEBUG=True
    API_KEY=your-secret-api-key
    ```

5.  Run migrations:
    ```bash
    python manage.py migrate
    ```

6.  Start the server:
    ```bash
    python manage.py runserver
    ```
    The API will be available at `http://localhost:8000/`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd hos_frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in `hos_frontend/` with your backend URL and API Key:
    ```env
    VITE_API_BASE_URL=http://localhost:8000/api
    VITE_API_KEY=your-secret-api-key
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will successfully launch at the URL provided in the terminal (usually `http://localhost:5173`).

## Usage

1.  **Swagger Documentation**:
    Visit `http://localhost:8000/` to explore the API endpoints and schemas via Swagger UI.

2.  **Running Tests**:
    *   **Backend**: `python manage.py test`
    *   **Frontend**: `npm test`

3.  **Code formatting**:
    *   **Backend**: `isort . && black . && ruff check . --fix`
    *   **Frontend**: `npx prettier --write . && npm run lint -- --fix`

## API Authentication

All API requests require the `X-API-KEY` header.
*   **Development**: The default key is `your-secret-api-key`.
*   **Production**: Set a strong `API_KEY` in the backend `.env` and update the frontend `VITE_API_KEY`.
