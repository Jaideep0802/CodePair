# Online Interview Application

A real-time collaborative coding and video calling application for online interviews.

## Features

- **Real-time Collaborative Code Editor**: Multiple users can edit code simultaneously
- **Video Calling**: One-on-one video chat with WebRTC
- **Multi-language Support**: C++ and Java programming languages
- **Code Execution**: Run code using Judge0 API with real-time output
- **Single Room System**: One room ID for both coding and video features

## Setup Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Judge0 API (Required for Code Execution)

1. Go to [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Sign up for a free account
3. Subscribe to the free plan (1000 requests/month)
4. Copy your API key from the RapidAPI dashboard
5. Open `frontend/src/config.js`
6. Replace `"YOUR_RAPIDAPI_KEY_HERE"` with your actual API key:

```javascript
export const config = {
  RAPIDAPI_KEY: "your_actual_api_key_here",
  // ... rest of config
};
```

### 3. Start the Application

```bash
# Start the backend server (Terminal 1)
cd backend
node server.js

# Start the frontend development server (Terminal 2)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## How to Use

1. **Create/Join a Room**:
   - Enter a room ID or click "Start New Meeting" to generate one
   - Share the room ID with your interview partner

2. **Collaborative Coding**:
   - Select your preferred language (C++ or Java)
   - Write code in the editor
   - Changes are synchronized in real-time with other participants
   - Click "Run Code" to execute your code

3. **Video Calling**:
   - Click "Start Video Call" to enable camera and microphone
   - Video chat supports up to 2 participants per room

## Technical Details

### Backend (Node.js + Socket.IO)
- Real-time communication using WebSockets
- Separate room management for code editing and video calls
- Code editing: Unlimited participants
- Video calls: Maximum 2 participants

### Frontend (React + Vite)
- Monaco Editor for code editing
- WebRTC for video calling
- Real-time collaboration using Socket.IO client

### Code Execution (Judge0 API)
- Supports C++ and Java
- Real-time compilation and execution
- Detailed output including errors, execution time, and memory usage

## API Configuration

The application uses Judge0 CE API through RapidAPI for code execution. The free plan includes:
- 1000 requests per month
- Support for multiple programming languages
- Real-time compilation and execution

## Troubleshooting

### Code Execution Issues
- Ensure you have configured your RapidAPI key in `frontend/src/config.js`
- Check your RapidAPI subscription status
- Verify your internet connection

### Video Call Issues
- Allow camera and microphone permissions in your browser
- Check if your browser supports WebRTC
- Ensure both participants are in the same room

### Connection Issues
- Make sure both backend and frontend servers are running
- Check if port 3000 and 5173 are available
- Verify your firewall settings

## Development

### Adding New Languages
To add support for additional programming languages:

1. Update `frontend/src/config.js` with the new language configuration
2. Add the language to `LANGUAGE_CONFIGS` in `frontend/src/components/Editor.jsx`
3. Update the language selector dropdown

### Customizing the UI
- Styles are inline for simplicity
- Modify the JSX components to change the appearance
- Update the layout in `frontend/src/App.jsx`

## License

This project is open source and available under the MIT License.
