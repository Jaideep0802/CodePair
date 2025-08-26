const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

console.log("🔑 API Key loaded?", !!API_KEY);

export const config = {

  RAPIDAPI_KEY: API_KEY,

  JUDGE0_API: {
    BASE_URL: "https://judge0-ce.p.rapidapi.com",
    HOST: "judge0-ce.p.rapidapi.com"
  },
  LANGUAGES: {
    cpp: { id: 54, name: "C++", extension: "cpp" },
    java: { id: 62, name: "Java", extension: "java" }
  }
};

export const getJudge0Headers = () => ({
  "Content-Type": "application/json",
  "X-RapidAPI-Key": config.RAPIDAPI_KEY,
  "X-RapidAPI-Host": config.JUDGE0_API.HOST,
});
