# Skyvern Task Manager Backend

This project is the backend service for the Skyvern Task Manager application. It uses Express.js to create a RESTful API that interacts with the Skyvern API to initiate tasks and check their status.

## Project Structure

```
backend/
├── node_modules/
├── .env
├── package.json
├── server.js
└── README.md
```

### Files and Directories

- **node_modules/**: Contains the installed dependencies for the backend.
- **.env**: Environment variables file (e.g., to store your API key securely).
- **package.json**: Contains metadata about the backend project and its dependencies.
- **server.js**: Main server file containing the Express setup and API routes.
- **README.md**: This file, providing information about the backend setup and usage.

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd skyvern-task-manager/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend` directory and add your API key and port configuration:
   ```env
   API_KEY=your_skyvern_api_key
   PORT=3000
   ```

### Running the Server

To start the server, run:
```bash
npm start
```
The server will start and listen on the port specified in the `.env` file.

### API Endpoints

#### POST /initiate-task

Initiates a new task.

- **URL**: `/initiate-task`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
- **Body Parameters**:
  - `url` (string, required): The URL to be processed.
  - `navigation_goal` (string, optional): The navigation goal for the task.
  - `data_extraction_goal` (string, optional): The data extraction goal for the task.
  - `navigation_payload` (object, optional): Additional payload for navigation.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: `{ ...taskDetails }`
- **Error Response**:
  - **Code**: `500 Internal Server Error`
  - **Content**: `{ error: "Error message" }`

Example Request Body:
```json
{
  "url": "https://example.com",
  "navigation_goal": "Apply for a job",
  "data_extraction_goal": "Was the job application successful?",
  "navigation_payload": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### GET /task-status/:taskId

Fetches the status of a specific task.

- **URL**: `/task-status/:taskId`
- **Method**: `GET`
- **URL Parameters**:
  - `taskId` (string, required): The ID of the task to fetch the status for.
- **Success Response**:
  - **Code**: `200 OK`
  - **Content**: `{ ...taskStatus }`
- **Error Response**:
  - **Code**: `500 Internal Server Error`
  - **Content**: `{ error: "Error message" }`

### Dependencies

- **express**: For setting up the web server.
- **axios**: For making HTTP requests to the Skyvern API.
- **body-parser**: For parsing incoming request bodies.
- **cors****: For enabling Cross-Origin Resource Sharing.
- **dotenv**: For loading environment variables from a `.env` file.

### Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
API_KEY=your_skyvern_api_key
PORT=3000
```

- `API_KEY`: Your Skyvern API key.
- `PORT`: The port number on which the server will listen.

## License

This project is licensed under the MIT License.