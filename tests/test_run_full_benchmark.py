from scripts.run_full_benchmark import extract_config_settings


def test_extract_config_settings_parses_prompts_samplers_reps():
    cfg = {
        'benchmark_config': {
            'experimental_design': {
                'prompts': {
                    'a': {'text': 'P1'},
                    'b': {'text': 'P2'},
                },
                'samplers': ['s1', 's2'],
                'repetitions_per_prompt_per_sampler': 3,
            }
        }
    }

    prompts, samplers, reps = extract_config_settings(cfg)
    assert prompts == ['P1', 'P2']
    assert samplers == ['s1', 's2']
    assert reps == 3


