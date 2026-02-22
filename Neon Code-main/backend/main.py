from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import tempfile
import os

app = FastAPI()

# Allow frontend (React) to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str


@app.post("/run")
def run_code(data: CodeRequest):
    # Create a temporary python file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as temp:
        temp.write(data.code.encode("utf-8"))
        temp_path = temp.name

    try:
        # Run the python file
        result = subprocess.run(
            ["python", temp_path],
            capture_output=True,
            text=True,
            timeout=5
        )

        output = result.stdout
        error = result.stderr

        if error:
            return {"output": error}

        return {"output": output if output else "Program ran with no output"}

    except Exception as e:
        return {"output": str(e)}

    finally:
        os.remove(temp_path)