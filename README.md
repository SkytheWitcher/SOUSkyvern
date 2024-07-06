# Instructions to Run the WCAG Compliance Checker Application

## Prerequisites
1. Ensure you have **Node.js** and **npm** installed. You can download and install them from [nodejs.org](https://nodejs.org/).
2. Ensure you have **Git** installed. You can download and install it from [git-scm.com](https://git-scm.com/).

## Steps

### 1. Clone the Repository

Open your terminal or command prompt and clone the repository:

```sh
git clone <repository-url>
```

Replace `<repository-url>` with the actual URL of your repository.

### 2. Navigate to the Project Directory

Change into the project directory:

```sh
cd <repository-name>
```

Replace `<repository-name>` with the name of your project directory.

### 3. Install Backend Dependencies

Navigate to the backend directory and install the necessary dependencies:

```sh
cd backend
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the `backend` directory and add your Skyvern API key:

```sh
echo "API_KEY=<your-skyvern-api-key>" > .env
```

Replace `<your-skyvern-api-key>` with your actual Skyvern API key.

### 5. Start the Backend Server

Start the backend server:

```sh
npm start
```

### 6. Install Frontend Dependencies

Open a new terminal or command prompt window, navigate to the project directory, and install the frontend dependencies:

```sh
cd ../frontend
npm install
```

### 7. Start the Frontend Server

Start the frontend server:

```sh
npm start
```

### 8. Access the Application

Open your web browser and go to `http://localhost:3001` to access the WCAG Compliance Checker application.

## Summary of Commands

```sh
# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd <repository-name>

# Install backend dependencies
cd backend
npm install

# Set up environment variables
echo "API_KEY=<your-skyvern-api-key>" > .env

# Start the backend server
npm start

# Install frontend dependencies
cd ../frontend
npm install

# Start the frontend server
npm start
```

Open your web browser and go to `http://localhost:3001`.
