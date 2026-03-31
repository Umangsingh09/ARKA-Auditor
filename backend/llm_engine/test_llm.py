def generate_fix(vulnerability):
    return f"""
    Vulnerability: {vulnerability}

    Fix:
    Use parameterized queries instead of raw SQL queries.
    Example:
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    """

if __name__ == "__main__":
    print(generate_fix("SQL Injection in login.py"))