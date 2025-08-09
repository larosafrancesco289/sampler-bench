from backend.api.quality_api import SamplerBenchAPI


def test_evaluate_quality_multi_judge_path(monkeypatch):
    api = SamplerBenchAPI()

    class DummyConsensus:
        overall_score = 6.0
        overall_std = 0.4
        summary = "ok"
        evaluation_time = 1.2
        judge_models = ["a", "b"]
        judge_count = 2
        consensus_method = "average"

        class CS:
            criterion = "narrative_structure"
            mean_score = 6.0
            std_score = 0.5
            consensus_strength = 0.8

        criterion_scores = [CS()]

    class DummyJudge:
        def evaluate_text(self, **kwargs):
            return DummyConsensus()

    api.judge = DummyJudge()

    out = api.evaluate_quality("text", "prompt", {})
    assert out["success"] is True
    assert out["overall_score"] == 6.0
    assert out["overall_std"] == 0.4
    assert out["criterion_scores"][0]["criterion"] == "narrative_structure"


def test_evaluate_quality_single_judge_path(monkeypatch):
    api = SamplerBenchAPI()

    class S:
        criterion = "narrative_coherence"
        score = 5.0
        reasoning = ""

    class DummySJ:
        overall_score = 5.0
        criterion_scores = [S()]
        summary = "ok"
        evaluation_time = 0.9

    class DummyJudge:
        def judge_text(self, *args, **kwargs):
            return DummySJ()

    api.judge = DummyJudge()
    out = api.evaluate_quality("text", "prompt", {})
    assert out["success"] is True
    assert out["overall_score"] == 5.0
    assert out["criterion_scores"][0]["criterion"] == "narrative_coherence"


