from backend.api.quality_api import SamplerBenchAPI


def test_top_n_sigma_parameter_pass_through(monkeypatch):
    api = SamplerBenchAPI()
    api.models = {
        'm': {
            'port': 5001,
            'inference_engine': 'koboldcpp'
        }
    }
    api.generator_config = {'port': 5001, 'name': 'm', 'inference_engine': 'koboldcpp'}

    # Provide a sampler preset with top_n_sigma
    api.samplers = {
        'standard_sigma': {
            'description': 'd',
            'sampler': 'top_n_sigma',
            'parameters': {
                'temperature': 1.5,
                'top_n_sigma': 1.0,
                'max_tokens': 10
            }
        }
    }

    captured = {}

    def fake_post(url, json, timeout):
        captured['payload'] = json
        class R:
            status_code = 200
            def json(self):
                return {'results': [{'text': 'x'}]}
        return R()

    import backend.api.quality_api as qa
    monkeypatch.setattr(qa, 'requests', type('R', (), {'post': staticmethod(fake_post)}))

    res = api.generate_single_sample('p', 'standard_sigma', max_length=10)
    assert res['success'] is True
    # Ensure parameter is forwarded
    assert captured['payload'].get('top_n_sigma') == 1.0


