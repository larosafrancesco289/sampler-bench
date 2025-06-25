from llama_cpp import Llama

class ModelRunner:
    def __init__(self, model_path: str, n_ctx: int = 2048):
        """
        Load a quantized GGUF model from the given path using llama.cpp.
        """
        self.model = Llama(model_path=model_path, n_ctx=n_ctx)

    def generate(self, prompt: str, params: dict) -> str:
        """
        Generate text from the model using the specified sampler parameters.
        Example of params: {"temperature": 1.0, "top_p": 0.9}
        """
        response = self.model(
            prompt,
            max_tokens=200,
            stop=["\n\n"],
            **params
        )
        return response["choices"][0]["text"]