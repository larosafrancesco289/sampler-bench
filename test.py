from backend.model_runner import ModelRunner

model_runner = ModelRunner("/Users/francescolarosa/Other/LLMs/Mistral-Nemo-Instruct-2407.Q4_K_M.gguf")

response = model_runner.generate("Hello, how are you?", {"temperature": 0.5, "top_p": 0.9})
print(response)