import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { config, getJudge0Headers } from "../config";

// Connect to server
const socket = io("http://localhost:3000", { transports: ["websocket"] });

// Language configurations
const LANGUAGE_CONFIGS = {
  cpp: {
    id: config.LANGUAGES.cpp.id,
    name: config.LANGUAGES.cpp.name,
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    extension: config.LANGUAGES.cpp.extension
  },
  java: {
    id: config.LANGUAGES.java.id,
    name: config.LANGUAGES.java.name,
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    extension: config.LANGUAGES.java.extension
  }
};

function CollaborativeEditor({ roomId }) {
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false); // Prevent loop
  const [output, setOutput] = useState("Output will appear here...");
  const [selectedLanguage, setSelectedLanguage] = useState("cpp");
  const [isRunning, setIsRunning] = useState(false);

  // Handle editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;

    // Detect local changes
    editor.onDidChangeModelContent(() => {
      if (!isRemoteChange.current) {
        const code = editor.getValue();
        socket.emit("code-change", { roomId, code, language: selectedLanguage });
      }
    });
  };

  // Join room and listen for updates
  useEffect(() => {
    if (!roomId) return;

    socket.emit("join", { roomId });

    socket.on("code-change", ({ code, language }) => {
      if (editorRef.current && code !== editorRef.current.getValue()) {
        isRemoteChange.current = true; // Mark as remote change
        editorRef.current.setValue(code);
        if (language && language !== selectedLanguage) {
          setSelectedLanguage(language);
        }
        isRemoteChange.current = false; // Reset
      }
    });

    return () => {
      socket.off("code-change");
    };
  }, [roomId]);

  // Handle language change
  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    if (editorRef.current) {
      const currentCode = editorRef.current.getValue();
      const newDefaultCode = LANGUAGE_CONFIGS[newLanguage].defaultCode;
      
      // Always update the editor with the new language's default code
      isRemoteChange.current = true;
      editorRef.current.setValue(newDefaultCode);
      isRemoteChange.current = false;
      
      // Emit the language change to other participants
      socket.emit("code-change", { roomId, code: newDefaultCode, language: newLanguage });
    }
  };

  // Run code using Judge0 API
  const runCode = async () => {
    if (!editorRef.current) return;

    const code = editorRef.current.getValue();
    const languageConfig = LANGUAGE_CONFIGS[selectedLanguage];
    
    // Check if API key is configured
    if (!config.RAPIDAPI_KEY || config.RAPIDAPI_KEY === "YOUR_RAPIDAPI_KEY_HERE") {
      setOutput(`Error: Please configure your RapidAPI key in frontend/src/config.js`);
      return;
    }
    
    setIsRunning(true);
    setOutput("Running code...");

    try {
      // Create submission
      const createResponse = await fetch(`${config.JUDGE0_API.BASE_URL}/submissions`, {
        method: "POST",
        headers: getJudge0Headers(),
        body: JSON.stringify({
          language_id: languageConfig.id,
          source_code: code,
          stdin: ""
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create submission: ${createResponse.statusText}`);
      }

      const submission = await createResponse.json();
      const token = submission.token;

      // Poll for results
      let result = null;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const getResponse = await fetch(`${config.JUDGE0_API.BASE_URL}/submissions/${token}`, {
          headers: getJudge0Headers()
        });

        if (!getResponse.ok) {
          throw new Error(`Failed to get submission result: ${getResponse.statusText}`);
        }

        result = await getResponse.json();
        
        if (result.status && result.status.id > 2) { // Status > 2 means processing is complete
          break;
        }

        attempts++;
      }

      if (!result) {
        throw new Error("Timeout waiting for code execution");
      }

      // Format the output
      let outputText = "";
      
      if (result.stdout) {
        outputText += `Output:\n${result.stdout}\n\n`;
      }
      
      if (result.stderr) {
        outputText += `Errors:\n${result.stderr}\n\n`;
      }
      
      if (result.compile_output) {
        outputText += `Compilation:\n${result.compile_output}\n\n`;
      }
      
      if (result.message) {
        outputText += `Message:\n${result.message}\n\n`;
      }

      // Add execution info
      if (result.time) {
        outputText += `Execution time: ${result.time}s\n`;
      }
      
      if (result.memory) {
        outputText += `Memory used: ${result.memory}KB\n`;
      }

      if (result.status) {
        const statusDescriptions = {
          3: "Accepted",
          4: "Wrong Answer",
          5: "Time Limit Exceeded",
          6: "Compilation Error",
          7: "Runtime Error (SIGSEGV)",
          8: "Runtime Error (SIGXFSZ)",
          9: "Runtime Error (SIGFPE)",
          10: "Runtime Error (SIGABRT)",
          11: "Runtime Error (NZEC)",
          12: "Runtime Error (Other)",
          13: "Internal Error",
          14: "Exec Format Error"
        };
        
        const statusDesc = statusDescriptions[result.status.id] || `Status: ${result.status.description}`;
        outputText += `\nStatus: ${statusDesc}`;
      }

      setOutput(outputText || "No output.");

    } catch (err) {
      console.error("Code execution error:", err);
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Language Selector */}
      <div style={{ 
        padding: "8px", 
        backgroundColor: "#1f2937", 
        borderBottom: "1px solid #374151",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        <label style={{ color: "#fff", fontSize: "14px" }}>Language:</label>
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{
            padding: "4px 8px",
            backgroundColor: "#374151",
            color: "#fff",
            border: "1px solid #4b5563",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        >
          <option value="cpp">C++</option>
          <option value="java">Java</option>
        </select>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={selectedLanguage === "cpp" ? "cpp" : "java"}
          defaultValue={LANGUAGE_CONFIGS[selectedLanguage].defaultCode}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            wordWrap: "on",
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            cursorStyle: "line",
          }}
        />
      </div>

      {/* Run Button */}
      <div style={{ padding: "8px", backgroundColor: "#1f2937", borderTop: "1px solid #374151" }}>
        <button
          onClick={runCode}
          disabled={isRunning}
          style={{
            padding: "8px 16px",
            backgroundColor: isRunning ? "#6b7280" : "#2563eb",
            borderRadius: 4,
            color: "#fff",
            border: "none",
            cursor: isRunning ? "not-allowed" : "pointer",
            fontSize: "14px"
          }}
        >
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* Output */}
      <div
        style={{
          padding: "10px",
          backgroundColor: "#111",
          color: "#22c55e",
          fontFamily: "monospace",
          height: "120px",
          overflowY: "auto",
          borderTop: "1px solid #374151",
          fontSize: "12px",
          whiteSpace: "pre-wrap"
        }}
      >
        {output}
      </div>
    </div>
  );
}

export default CollaborativeEditor;
