#!/usr/bin/env python3
"""
Startup script for the FastAPI backend server.
Run this from the project root directory.
"""

import uvicorn
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def main():
    """Start the FastAPI server."""
    print("🚀 Starting Sampler Benchmark API Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    print("🔍 Alternative docs at: http://localhost:8000/redoc")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        # Run the FastAPI server
        uvicorn.run(
            "backend.fastapi_server:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[str(project_root / "backend")],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 