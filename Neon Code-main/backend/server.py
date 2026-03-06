from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import tempfile
import os

app = Flask(__name__)
CORS(app)


@app.route("/run", methods=["POST"])
def run_code():
    data = request.json

    language = data.get("language")
    code = data.get("code")

    if not code:
        return jsonify({"error": "No code provided"}), 400

    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=get_extension(language)) as f:
            f.write(code.encode())
            filename = f.name

        # Run command
        command = get_command(language, filename)

        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=5
        )

        output = result.stdout + result.stderr

        os.remove(filename)

        return jsonify({"output": output})

    except Exception as e:
        return jsonify({"error": str(e)})


def get_extension(lang):
    return {
        "python": ".py",
        "javascript": ".js",
        "c": ".c",
        "cpp": ".cpp",
        "java": ".java"
    }.get(lang, ".txt")


def get_command(lang, filename):

    if lang == "python":
        return ["py", filename]

    if lang == "javascript":
        return ["node", filename]

    if lang == "c":
        exe = filename + ".exe"
        subprocess.run(["gcc", filename, "-o", exe])
        return [exe]

    if lang == "cpp":
        exe = filename + ".exe"
        subprocess.run(["g++", filename, "-o", exe])
        return [exe]

    if lang == "java":
        subprocess.run(["javac", filename])
        return ["java", filename.replace(".java", "")]

    return ["py", filename]


if __name__ == "__main__":
    app.run(port=5000, debug=True)