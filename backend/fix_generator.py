from llm_engine.fix_engine import generate_fix as llm_generate_fix


def generate_fix(vuln):
    """Generate a fix using the LLM fix engine."""
    try:
        return llm_generate_fix(vuln)
    except Exception as e:
        return {
            "fixed_code": "",
            "explanation": f"Failed to generate fix via LLM: {e}",
            "confidence": "0%"
        }
