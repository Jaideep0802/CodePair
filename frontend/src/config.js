// Configuration file for API keys and settings
export const config = {
  // Hardcoded RapidAPI key for Judge0 CE
  RAPIDAPI_KEY: "2552141b9dmsh27a7611602b0bf9p1a0224jsn8ca0be7dd279", // Get your free key from: https://rapidapi.com/judge0-official/api/judge0-ce/
  
  // Judge0 API settings
  JUDGE0_API: {
    BASE_URL: "https://judge0-ce.p.rapidapi.com",
    HOST: "judge0-ce.p.rapidapi.com"
  },
  
  // Language configurations for Judge0
  LANGUAGES: {
    cpp: {
      id: 54, // C++17
      name: "C++",
      extension: "cpp"
    },
    java: {
      id: 62, // Java
      name: "Java", 
      extension: "java"
    }
  }
};

// Helper function to get API headers
export const getJudge0Headers = () => ({
  "Content-Type": "application/json",
  "X-RapidAPI-Key": config.RAPIDAPI_KEY,
  "X-RapidAPI-Host": config.JUDGE0_API.HOST
});
