# CodePair - Collaborative Coding & Video Interviews

A real-time collaborative coding platform with video chat for online interviews and pair programming.

## Features

- **Real-time Code Editor**: Collaborative coding with Monaco Editor
- **Video Chat**: WebRTC-based video calling (max 2 participants)
- **Text Notes**: Shared text editor for questions and notes
- **Code Execution**: Run C++ and Java code using Judge0 API
- **Room-based**: Join rooms with unique IDs for private sessions

## Setup Instructions

### 1. Get RapidAPI Key

1. Go to [Judge0 CE on RapidAPI](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Click "Subscribe to Test" (Free tier available)
3. Copy your API key from the dashboard

### 2. Configure API Key

Edit `frontend/src/config.js` and replace `YOUR_RAPIDAPI_KEY_HERE` with your actual RapidAPI key:

```javascript
RAPIDAPI_KEY: "your_actual_api_key_here",
```

### 3. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Start the Application

```bash
# Start backend server (Terminal 1)
cd backend
npm start

# Start frontend development server (Terminal 2)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Usage

1. **Start a Meeting**: Click "Start New Meeting" to create a new room
2. **Join a Meeting**: Enter a room ID and click "Join Meeting"
3. **Share Room ID**: Copy the room ID and share it with your interview partner
4. **Code Together**: Write code in the collaborative editor
5. **Run Code**: Click "Run Code" to execute C++ or Java programs
6. **Video Chat**: Use the video chat panel for face-to-face communication
7. **Share Notes**: Use the text editor for questions and notes

## Supported Languages

- **C++** (C++17)
- **Java**

## Technical Stack

- **Frontend**: React, Vite, Monaco Editor, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO
- **Video**: WebRTC, STUN servers
- **Code Execution**: Judge0 CE API via RapidAPI

## Troubleshooting

### Code Execution Issues
- Ensure your RapidAPI key is correctly configured
- Check that you have an active subscription to Judge0 CE
- Verify the API key has proper permissions

### Video Chat Issues
- Allow camera and microphone permissions in your browser
- Check that both participants are in the same room
- Ensure stable internet connection for WebRTC

### Connection Issues
- Make sure both frontend and backend servers are running
- Check that ports 3000 and 5173 are available
- Verify firewall settings allow local connections

## License

MIT License
