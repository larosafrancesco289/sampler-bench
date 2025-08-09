import types
import sys


def pytest_sessionstart(session):
    # Stub external modules that may not be present during tests
    if 'openai' not in sys.modules:
        dummy_openai = types.ModuleType('openai')

        class OpenAI:
            def __init__(self, *args, **kwargs):
                pass

            class chat:
                class completions:
                    @staticmethod
                    def create(*args, **kwargs):
                        class Choice:
                            class Message:
                                content = '{"overall_score": 5.0, "criterion_scores": {}}'

                            message = Message()

                        class Response:
                            choices = [Choice()]

                        return Response()

        dummy_openai.OpenAI = OpenAI
        sys.modules['openai'] = dummy_openai

    if 'dotenv' not in sys.modules:
        dummy_dotenv = types.ModuleType('dotenv')

        def load_dotenv(*args, **kwargs):
            return None

        dummy_dotenv.load_dotenv = load_dotenv
        sys.modules['dotenv'] = dummy_dotenv


