import "./App.css";
import logo from "./assets/logo.png";
import Editor from "@monaco-editor/react";
import { useState, useRef, useEffect } from "react";

/* ================= Templates ================= */

const templates = {
  python: `a = 10
b = 20
print(a + b)`,

  javascript: `console.log(10 + 20);`,

  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << 10 + 20;
  return 0;
}`,

  c: `#include <stdio.h>

int main() {
  printf("%d", 10 + 20);
  return 0;
}`,

  java: `class Main {
  public static void main(String[] args) {
    System.out.println(10 + 20);
  }
}`
};

const STORAGE_KEY = "cloud_code_editor_state";

function App() {

  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  const isMobile = window.innerWidth <= 768;

  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  /* ================= States ================= */

  const [language, setLanguage] = useState(saved?.language || "python");

  const [files, setFiles] = useState(
    saved?.files || [{ id: 1, name: "main.py", code: templates.python }]
  );

  const [output, setOutput] = useState("// Ready");
  const [isRunning, setIsRunning] = useState(false);
  const [editorWidth, setEditorWidth] = useState(saved?.editorWidth || 65);

  const activeFile = files[0];


  /* ================= Persist ================= */

  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, files, editorWidth })
    );

  }, [language, files, editorWidth]);


  /* ================= Run ================= */

  const runCode = async () => {

    if (!activeFile.code.trim()) {
      setOutput("⚠ Write some code first");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running...\n");

    try {

      const langMap = {
        python: "python3",
        javascript: "javascript",
        cpp: "cpp",
        c: "c",
        java: "java"
      };

      const res = await fetch("https://emkc.org/api/v2/piston/execute", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          language: langMap[language],
          version: "*",

          files: [
            { content: activeFile.code }
          ]

        })

      });


      const data = await res.json();

      let result = "";

      if (data.run?.stdout) result += data.run.stdout;

      if (data.run?.stderr) result += "\n❌ Error:\n" + data.run.stderr;

      if (!result) result = "⚠ No output";

      setOutput(result);

    } catch {

      setOutput("❌ Server error");

    }

    setIsRunning(false);
  };


  /* ================= Language ================= */

  const changeLanguage = (lang) => {

    const ext = {
      python: "py",
      javascript: "js",
      cpp: "cpp",
      c: "c",
      java: "java"
    };

    setLanguage(lang);

    setFiles([{
      id: 1,
      name: `main.${ext[lang]}`,
      code: templates[lang]
    }]);

    setOutput("// Ready");
  };


  const updateCode = (value) => {
    setFiles([{ ...activeFile, code: value }]);
  };


  /* ================= Resize ================= */

  const onMouseDown = () => {

    if (isMobile) return;

    isDragging.current = true;
  };


  const onMouseMove = (e) => {

    if (isMobile || !isDragging.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const w = ((e.clientX - rect.left) / rect.width) * 100;

    if (w > 30 && w < 80) setEditorWidth(w);
  };


  const onMouseUp = () => (isDragging.current = false);


  /* ================= UI ================= */

  return (

    <div className="app" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>


      {/* ===== Top Bar ===== */}

      <div className="topbar">

        <div className="brand">

          <img src={logo} alt="logo" className="brand-logo" />

          <span className="brand-text">CodeDeck</span>

        </div>


        <div className="topbar-right">

          <select
            className="lang-select"
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
          >

            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="java">Java</option>

          </select>


          {!isMobile && (

            <button className="run-btn" onClick={runCode}>
              {isRunning ? "Running..." : "Run"}
            </button>

          )}

        </div>

      </div>


      {/* ===== Main ===== */}

      <div className="main" ref={containerRef}>


        <div className="editor-area">

          <Editor

            height="100%"
            language={language}
            theme="vs-dark"
            value={activeFile.code}
            onChange={updateCode}

            onMount={(editor) => {

              editorRef.current = editor;


              /* Enable native context menu */
              editor.updateOptions({
                contextmenu: true
              });


              /* Add clipboard actions */

              editor.addAction({
                id: "cut",
                label: "Cut",
                run: () => {
                  editor.trigger("keyboard", "editor.action.clipboardCutAction");
                }
              });

              editor.addAction({
                id: "copy",
                label: "Copy",
                run: () => {
                  editor.trigger("keyboard", "editor.action.clipboardCopyAction");
                }
              });

              editor.addAction({
                id: "paste",
                label: "Paste",
                run: () => {
                  editor.trigger("keyboard", "editor.action.clipboardPasteAction");
                }
              });

              editor.addAction({
                id: "selectAll",
                label: "Select All",
                run: () => {
                  editor.trigger("keyboard", "editor.action.selectAll");
                }
              });

            }}

            options={{

              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              contextmenu: true

            }}

          />

        </div>


        {!isMobile && (

          <div className="resize-bar" onMouseDown={onMouseDown} />

        )}


        <div
          className="output-area"
          style={!isMobile ? { width: `${100 - editorWidth}%` } : {}}
        >

          <pre>{output}</pre>

        </div>

      </div>

    </div>

  );
}

export default App;
