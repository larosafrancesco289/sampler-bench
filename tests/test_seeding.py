from scripts.run_benchmark import derive_seed


def test_derive_seed_is_deterministic():
    s1 = derive_seed(42, 'llama', 'min_p', 'prompt text', 1)
    s2 = derive_seed(42, 'llama', 'min_p', 'prompt text', 1)
    assert s1 == s2


def test_derive_seed_changes_with_identity():
    base = derive_seed(42, 'llama', 'min_p', 'prompt text', 1)
    # Changing any component should change seed
    assert base != derive_seed(43, 'llama', 'min_p', 'prompt text', 1)
    assert base != derive_seed(42, 'llamaX', 'min_p', 'prompt text', 1)
    assert base != derive_seed(42, 'llama', 'min_pX', 'prompt text', 1)
    assert base != derive_seed(42, 'llama', 'min_p', 'prompt text more', 1)
    assert base != derive_seed(42, 'llama', 'min_p', 'prompt text', 2)

