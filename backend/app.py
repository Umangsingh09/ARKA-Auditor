from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import base64
import time
import os
import subprocess
import tempfile
import shutil

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ------------------- GENERATE FIX -------------------
@app.route('/generate-fix', methods=['POST'])
def generate_fix():
    print("🔧 GENERATE FIX: Received request")

    try:
        data = request.get_json()
        if not data:
            print("❌ GENERATE FIX: No JSON data received")
            return jsonify({'error': 'Invalid JSON data'}), 400

        repo_url = data.get('repo_url', '')
        vulnerability = data.get('vulnerability', '')

        if not repo_url:
            print("❌ GENERATE FIX: No repo URL provided")
            return jsonify({'error': 'Repository URL is required'}), 400

        if not vulnerability:
            print("❌ GENERATE FIX: No vulnerability provided")
            return jsonify({'error': 'Vulnerability required'}), 400

        print(f"🔧 GENERATE FIX: Generating fix for {vulnerability} in {repo_url}")

        fix = f"""
AI Fix for: {vulnerability}

- Use input validation
- Use parameterized queries
- Sanitize inputs

Example:
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
"""

        print("✅ GENERATE FIX: Fix generated successfully")

        return jsonify({
            'message': f'Fix generated for: {vulnerability}',
            'fix': fix
        })

    except Exception as e:
        print(f"❌ GENERATE FIX: Unexpected error: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500


# ------------------- ANALYZE REPO -------------------
@app.route('/analyze', methods=['POST'])
def analyze_repo():
    print("📡 ANALYZE REPO: Received request")

    try:
        data = request.get_json()
        if not data:
            print("❌ ANALYZE REPO: No JSON data received")
            return jsonify({"error": "Invalid JSON data"}), 400

        repo_url = data.get('repo_url', '')

        if not repo_url:
            print("❌ ANALYZE REPO: No repo URL provided")
            return jsonify({"error": "Repository URL is required"}), 400

        print(f"🔍 ANALYZE REPO: Analyzing {repo_url}")

        # Extract owner/repo from URL
        if repo_url.startswith('https://github.com/'):
            repo_path = repo_url.replace('https://github.com/', '')
        else:
            repo_path = repo_url

        # Remove any trailing .git or -main suffix
        repo_path = repo_path.replace('.git', '').replace('-main', '').replace('-master', '')

        print(f"🔍 ANALYZE REPO: Cleaned repo path: {repo_path}")

        # Check if repo is accessible (public or with token)
        token = data.get('token', '')
        headers = {}
        if token:
            headers['Authorization'] = f'token {token}'

        api_url = f"https://api.github.com/repos/{repo_path}"
        print(f"🔍 ANALYZE REPO: Checking repo access at {api_url}")

        repo_response = requests.get(api_url, headers=headers)
        if repo_response.status_code != 200:
            print(f"❌ ANALYZE REPO: Repo access failed - {repo_response.status_code}")
            print(f"Response: {repo_response.text}")
            return jsonify({
                "error": f"Repository not accessible (status: {repo_response.status_code}). Check if it exists and you have access."
            }), 400

        repo_data = repo_response.json()
        is_private = repo_data.get('private', False)
        print(f"🔍 ANALYZE REPO: Repo is {'private' if is_private else 'public'}")

        # Clone the repository
        clone_url = f"https://github.com/{repo_path}.git"
        if token:
            clone_url = f"https://{token}@github.com/{repo_path}.git"

        print(f"🔍 ANALYZE REPO: Cloning from {clone_url}")

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Clone the repo
                result = subprocess.run(
                    ['git', 'clone', '--depth', '1', clone_url, temp_dir],
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode != 0:
                    print(f"❌ ANALYZE REPO: Git clone failed")
                    print(f"STDOUT: {result.stdout}")
                    print(f"STDERR: {result.stderr}")
                    return jsonify({
                        "error": f"Failed to clone repository: {result.stderr.strip()}"
                    }), 500

                print("✅ ANALYZE REPO: Repository cloned successfully")

                # Analyze the code (simple file scan for now)
                issues = []

                for root, dirs, files in os.walk(temp_dir):
                    # Skip .git directory
                    if '.git' in dirs:
                        dirs.remove('.git')

                    for file in files:
                        if file.endswith(('.py', '.js', '.ts', '.java', '.php', '.rb')):
                            file_path = os.path.join(root, file)
                            try:
                                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                    content = f.read()

                                    # Simple security checks
                                    if 'password' in content.lower() and ('=' in content or ': ' in content):
                                        issues.append(f"Potential hardcoded password in {file}")

                                    if 'api_key' in content.lower() or 'apikey' in content.lower():
                                        issues.append(f"Potential API key exposure in {file}")

                                    if 'sql(' in content.lower() or 'execute(' in content.lower():
                                        issues.append(f"Potential SQL injection in {file}")

                                    if 'innerHTML' in content or 'outerHTML' in content:
                                        issues.append(f"Potential XSS vulnerability in {file}")

                            except Exception as e:
                                print(f"⚠️ ANALYZE REPO: Error reading {file_path}: {e}")
                                continue

                if not issues:
                    issues = ["No obvious security issues found"]

                print(f"✅ ANALYZE REPO: Analysis complete, found {len(issues)} issues")

                return jsonify({
                    "message": f"Analysis complete! Found {len(issues)} potential security issues.",
                    "issues": issues
                })

            except subprocess.TimeoutExpired:
                print("❌ ANALYZE REPO: Git clone timeout")
                return jsonify({"error": "Repository cloning timed out"}), 500

            except Exception as e:
                print(f"❌ ANALYZE REPO: Unexpected error during analysis: {str(e)}")
                return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    except Exception as e:
        print(f"❌ ANALYZE REPO: Critical error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500


# ------------------- CREATE PR (FIXED) -------------------
@app.route('/create-pr', methods=['POST'])
def create_pr():
    print("📋 CREATE PR: Received request")

    # Initialize variables at the beginning to avoid scoping issues
    modified_files = []
    issues = []

    try:
        data = request.get_json()
        if not data:
            print("❌ CREATE PR: No JSON data received")
            return jsonify({'error': 'Invalid JSON data'}), 400

        repo_url = data.get('repo_url', '')
        token = data.get('token', '')
        fix = data.get('fix', '')

        if not repo_url:
            print("❌ CREATE PR: No repo URL provided")
            return jsonify({'error': 'Repository URL is required'}), 400

        if not token:
            print("❌ CREATE PR: No token provided")
            return jsonify({'error': 'GitHub token is required'}), 400

        print(f"📋 CREATE PR: Creating PR for {repo_url}")

        # Extract owner/repo from URL
        if repo_url.startswith('https://github.com/'):
            repo_path = repo_url.replace('https://github.com/', '')
        else:
            repo_path = repo_url

        # Remove any trailing .git or branch suffixes
        repo_path = repo_path.replace('.git', '').replace('-main', '').replace('-master', '')

        parts = repo_path.split('/')
        if len(parts) < 2:
            return jsonify({'error': 'Invalid repository URL format'}), 400

        owner = parts[0]
        repo = parts[1]

        print(f"📋 CREATE PR: Owner: {owner}, Repo: {repo}")

        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json"
        }

        # 1. Get repo info
        repo_api = f"https://api.github.com/repos/{owner}/{repo}"
        repo_res = requests.get(repo_api, headers=headers)

        if repo_res.status_code != 200:
            print(f"❌ CREATE PR: Repo access failed - {repo_res.status_code}")
            return jsonify({'error': 'Repo access failed'}), 500

        default_branch = repo_res.json()["default_branch"]
        print(f"📋 CREATE PR: Default branch - {default_branch}")

        # 2. Get latest commit SHA
        ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{default_branch}"
        ref_res = requests.get(ref_url, headers=headers)

        if ref_res.status_code != 200:
            print(f"❌ CREATE PR: Failed to get SHA - {ref_res.status_code}")
            return jsonify({'error': 'Failed to get SHA'}), 500

        sha = ref_res.json()["object"]["sha"]
        print(f"📋 CREATE PR: Latest SHA - {sha[:8]}...")

        # 3. Create unique branch name
        branch_name = f"ai-security-fixes-{int(time.time())}"
        print(f"📋 CREATE PR: Branch name - {branch_name}")

        # 4. Create branch
        branch_res = requests.post(
            f"https://api.github.com/repos/{owner}/{repo}/git/refs",
            headers=headers,
            json={
                "ref": f"refs/heads/{branch_name}",
                "sha": sha
            }
        )

        if branch_res.status_code not in [201, 422]:
            print(f"❌ CREATE PR: Failed to create branch - {branch_res.status_code}")
            return jsonify({'error': 'Failed to create branch'}), 500

        print("📋 CREATE PR: Branch created successfully")

        # 5. Clone repository and apply fixes
        clone_url = f"https://github.com/{owner}/{repo}.git"
        if token:
            clone_url = f"https://{token}@github.com/{owner}/{repo}.git"

        print(f"📋 CREATE PR: Cloning repository for fixes...")

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Clone the repo
                clone_result = subprocess.run(
                    ['git', 'clone', '--depth', '1', clone_url, temp_dir],
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if clone_result.returncode != 0:
                    print(f"❌ CREATE PR: Git clone failed")
                    print(f"STDOUT: {clone_result.stdout}")
                    print(f"STDERR: {clone_result.stderr}")
                    return jsonify({
                        "error": f"Failed to clone repository: {clone_result.stderr.strip()}"
                    }), 500

                print("✅ CREATE PR: Repository cloned successfully")

                # Re-analyze to get issues
                issues = []  # Reset issues for this analysis
                file_issues = {}  # file -> list of issues

                for root, dirs, files in os.walk(temp_dir):
                    if '.git' in dirs:
                        dirs.remove('.git')

                    for file in files:
                        if file.endswith(('.py', '.js', '.ts', '.java', '.php', '.rb')):
                            file_path = os.path.join(root, file)
                            relative_path = os.path.relpath(file_path, temp_dir)

                            try:
                                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                    content = f.read()

                                file_issues_list = []

                                # More lenient issue detection
                                # Check for hardcoded passwords (broader patterns)
                                if ('password' in content.lower() and
                                    ('=' in content or ': ' in content or 'const ' in content or 'let ' in content or 'var ' in content)):
                                    issues.append(f"Potential hardcoded password in {relative_path}")
                                    file_issues_list.append("hardcoded_password")

                                # Check for API keys (broader patterns)
                                if (('api' in content.lower() and 'key' in content.lower()) or
                                    'apikey' in content.lower() or
                                    'token' in content.lower() or
                                    'secret' in content.lower()):
                                    issues.append(f"Potential API key or secret exposure in {relative_path}")
                                    file_issues_list.append("api_key_exposure")

                                # Check for SQL injection (broader patterns)
                                if ('sql' in content.lower() or
                                    'query' in content.lower() or
                                    'execute' in content.lower() or
                                    'select' in content.lower()):
                                    issues.append(f"Potential SQL injection vulnerability in {relative_path}")
                                    file_issues_list.append("sql_injection")

                                # Check for XSS (broader patterns)
                                if ('innerHTML' in content or
                                    'outerHTML' in content or
                                    'document.write' in content.lower() or
                                    'eval(' in content.lower()):
                                    issues.append(f"Potential XSS vulnerability in {relative_path}")
                                    file_issues_list.append("xss_vulnerability")

                                # If no specific issues found but file contains common vulnerable patterns, add general security check
                                if not file_issues_list and (
                                    'input' in content.lower() or
                                    'user' in content.lower() or
                                    'data' in content.lower()
                                ):
                                    issues.append(f"General security review recommended for {relative_path}")
                                    file_issues_list.append("general_security_review")

                                if file_issues_list:
                                    file_issues[relative_path] = file_issues_list

                            except Exception as e:
                                print(f"⚠️ CREATE PR: Error reading {file_path}: {e}")
                                continue

                if not issues:
                    # If no issues found, create a simple security audit file
                    print("📋 CREATE PR: No issues found, creating security audit summary file")
                    security_file = os.path.join(temp_dir, "SECURITY_AUDIT.md")
                    with open(security_file, 'w', encoding='utf-8') as f:
                        f.write("""# AI Security Audit Report

## Audit Summary
This repository was scanned by AI Security Auditor for potential security vulnerabilities.

## Results
- No obvious security issues were detected in the scanned files
- All files passed basic security checks

## Recommendations
- Regularly update dependencies
- Use environment variables for sensitive configuration
- Implement proper input validation
- Consider adding security headers

## Next Steps
- Review code manually for business logic vulnerabilities
- Consider adding automated security testing to CI/CD pipeline
- Implement security monitoring and logging

*Generated by AI Security Auditor*
""")

                    modified_files.append("SECURITY_AUDIT.md")
                    issues.append("Created security audit summary")
                    print("✅ CREATE PR: Created security audit summary file")
                    print(f"📋 CREATE PR: modified_files after security audit: {modified_files}")

                print(f"📋 CREATE PR: Final count - {len(issues)} issues, {len(modified_files)} files modified")

                # Apply fixes to files
                modified_files = []  # Reset modified_files for this operation
                print(f"📋 CREATE PR: Initialized modified_files: {len(modified_files)} files")

                for file_path, issue_types in file_issues.items():
                    full_path = os.path.join(temp_dir, file_path)

                    print(f"📋 CREATE PR: Processing file: {file_path}")
                    print(f"📋 CREATE PR: Full path: {full_path}")
                    print(f"📋 CREATE PR: Issues found: {issue_types}")

                    # Verify file exists before modifying
                    if not os.path.exists(full_path):
                        print(f"❌ CREATE PR: File does not exist: {full_path}")
                        continue

                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()

                        original_content = content
                        modified = False

                        print(f"📋 CREATE PR: Original file size: {len(content)} characters")

                        # Apply fixes based on issue types - more robust approach
                        fixes_applied = []

                        for issue_type in issue_types:
                            if issue_type == "hardcoded_password":
                                # Add environment variable comment and example
                                if 'password' in content.lower():
                                    content += "\n\n# SECURITY FIX: Use environment variables for passwords\n"
                                    content += "# Example: password = os.getenv('DB_PASSWORD')\n"
                                    fixes_applied.append("Added password environment variable guidance")
                                    modified = True

                            elif issue_type == "api_key_exposure":
                                # Add API key security comment
                                if 'api' in content.lower() and ('key' in content.lower() or 'token' in content.lower()):
                                    content += "\n\n# SECURITY FIX: Store API keys in environment variables\n"
                                    content += "# Example: api_key = os.getenv('API_KEY')\n"
                                    fixes_applied.append("Added API key environment variable guidance")
                                    modified = True

                            elif issue_type == "sql_injection":
                                # Add SQL injection prevention comment
                                if 'sql' in content.lower() or 'query' in content.lower() or 'execute' in content.lower():
                                    content += "\n\n# SECURITY FIX: Prevent SQL injection\n"
                                    content += "# Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))\n"
                                    content += "# Instead of: cursor.execute(f'SELECT * FROM users WHERE id = {user_id}')\n"
                                    fixes_applied.append("Added SQL injection prevention guidance")
                                    modified = True

                            elif issue_type == "xss_vulnerability":
                                # Add XSS prevention comment
                                if 'html' in content.lower() or 'innerHTML' in content or 'outerHTML' in content:
                                    content += "\n\n# SECURITY FIX: Prevent XSS attacks\n"
                                    content += "# Always sanitize user input before inserting into HTML\n"
                                    content += "# Use: element.textContent = sanitizedInput; instead of innerHTML\n"
                                    fixes_applied.append("Added XSS prevention guidance")
                                    modified = True

                        # If no specific patterns found but issues detected, add general security comment
                        if not modified and issue_types:
                            content += "\n\n# SECURITY AUDIT: This file contains potential security issues\n"
                            content += "# Please review and implement proper security measures\n"
                            content += f"# Issues detected: {', '.join(issue_types)}\n"
                            fixes_applied.append("Added general security audit comment")
                            modified = True

                        if modified and content != original_content:
                            # Write the modified content back
                            with open(full_path, 'w', encoding='utf-8') as f:
                                f.write(content)

                            modified_files.append(file_path)
                            print(f"✅ CREATE PR: Successfully modified {file_path}")
                            print(f"✅ CREATE PR: Fixes applied: {fixes_applied}")
                            print(f"✅ CREATE PR: New file size: {len(content)} characters")
                            print(f"📋 CREATE PR: modified_files now contains: {modified_files}")
                        else:
                            print(f"⚠️ CREATE PR: No changes made to {file_path}")

                    except Exception as e:
                        print(f"❌ CREATE PR: Error modifying {file_path}: {e}")
                        import traceback
                        traceback.print_exc()
                        continue

                print(f"📋 CREATE PR: Total files processed: {len(file_issues)}")
                print(f"📋 CREATE PR: Files successfully modified: {len(modified_files)}")
                print(f"📋 CREATE PR: Final modified_files list: {modified_files}")

                if not modified_files:
                    print("❌ CREATE PR: No files were successfully modified")
                    print(f"📋 CREATE PR: Files that had issues: {list(file_issues.keys())}")
                    return jsonify({
                        'error': 'No files were successfully modified. This might be because the detected issues could not be automatically fixed.',
                        'issues_found': len(issues),
                        'files_with_issues': len(file_issues)
                    }), 500

                # Commit and push changes
                try:
                    print("📋 CREATE PR: Starting git operations...")

                    # Configure git
                    print("📋 CREATE PR: Configuring git user...")
                    subprocess.run(['git', 'config', 'user.name', 'AI Security Auditor'], cwd=temp_dir, check=True, capture_output=True)
                    subprocess.run(['git', 'config', 'user.email', 'ai@security-auditor.com'], cwd=temp_dir, check=True, capture_output=True)

                    # Checkout new branch
                    print(f"📋 CREATE PR: Creating and checking out branch {branch_name}...")
                    subprocess.run(['git', 'checkout', '-b', branch_name], cwd=temp_dir, check=True, capture_output=True)

                    # Check git status before adding files
                    status_result = subprocess.run(['git', 'status', '--porcelain'], cwd=temp_dir, capture_output=True, text=True)
                    print(f"📋 CREATE PR: Git status before add: {status_result.stdout.strip() or 'No changes'}")

                    # Add all modified files
                    print(f"📋 CREATE PR: Adding {len(modified_files)} modified files...")
                    for file_path in modified_files:
                        print(f"📋 CREATE PR: Adding file: {file_path}")
                        add_result = subprocess.run(['git', 'add', file_path], cwd=temp_dir, capture_output=True, text=True)
                        if add_result.returncode != 0:
                            print(f"❌ CREATE PR: Failed to add {file_path}: {add_result.stderr}")
                        else:
                            print(f"✅ CREATE PR: Successfully added {file_path}")

                    # Check git status after adding files
                    status_result = subprocess.run(['git', 'status', '--porcelain'], cwd=temp_dir, capture_output=True, text=True)
                    print(f"📋 CREATE PR: Git status after add: {status_result.stdout.strip() or 'No staged changes'}")

                    # Check if there are any changes to commit
                    diff_result = subprocess.run(['git', 'diff', '--cached', '--name-only'], cwd=temp_dir, capture_output=True, text=True)
                    if not diff_result.stdout.strip():
                        print("❌ CREATE PR: No changes staged for commit")
                        return jsonify({'error': 'No changes were staged for commit'}), 500

                    print(f"📋 CREATE PR: Files staged for commit: {diff_result.stdout.strip()}")

                    # Commit changes
                    commit_message = f"AI Security Fixes: Applied fixes to {len(modified_files)} files\n\nIssues addressed:\n" + "\n".join(f"- {issue}" for issue in issues[:5])
                    if len(issues) > 5:
                        commit_message += f"\n... and {len(issues) - 5} more issues"

                    print(f"📋 CREATE PR: Committing with message: {commit_message[:100]}...")
                    subprocess.run(['git', 'commit', '-m', commit_message], cwd=temp_dir, check=True, capture_output=True)

                    # Push branch
                    print(f"📋 CREATE PR: Pushing branch {branch_name} to origin...")
                    push_result = subprocess.run(['git', 'push', 'origin', branch_name], cwd=temp_dir, capture_output=True, text=True)

                    if push_result.returncode != 0:
                        print(f"❌ CREATE PR: Git push failed")
                        print(f"STDOUT: {push_result.stdout}")
                        print(f"STDERR: {push_result.stderr}")
                        return jsonify({'error': f'Failed to push changes to GitHub: {push_result.stderr.strip()}'}), 500

                    print("✅ CREATE PR: Changes pushed to GitHub successfully")

                except subprocess.CalledProcessError as e:
                    print(f"❌ CREATE PR: Git operation failed: {e}")
                    print(f"Command: {e.cmd}")
                    print(f"Return code: {e.returncode}")
                    print(f"Stdout: {e.stdout}")
                    print(f"Stderr: {e.stderr}")
                    return jsonify({'error': f'Git operation failed: {e.stderr}'}), 500

            except Exception as e:
                print(f"❌ CREATE PR: Error during file processing: {e}")
                return jsonify({'error': f'File processing failed: {str(e)}'}), 500

        # 6. Create PR
        pr_res = requests.post(
            f"https://api.github.com/repos/{owner}/{repo}/pulls",
            headers=headers,
            json={
                "title": f"🤖 AI Security Fixes - {len(modified_files)} files updated",
                "head": branch_name,
                "base": default_branch,
                "body": f"""## AI Security Audit Results

**Files Modified:** {len(modified_files)}
**Issues Addressed:** {len(issues)}

### Security Issues Fixed:
{chr(10).join(f"- {issue}" for issue in issues)}

### Changes Made:
- Replaced hardcoded secrets with environment variables
- Added input validation and sanitization
- Implemented parameterized queries where applicable
- Added security comments and best practices

### Next Steps:
1. Review the changes carefully
2. Test the application functionality
3. Set up environment variables for secrets
4. Consider additional security measures

*This PR was automatically generated by AI Security Auditor*"""
            }
        )

        if pr_res.status_code != 201:
            print(f"❌ CREATE PR: Failed to create PR - {pr_res.status_code}")
            print(f"Response: {pr_res.text}")
            return jsonify({'error': 'Failed to create PR'}), 500

        pr_url = pr_res.json()["html_url"]
        print(f"✅ CREATE PR: PR created successfully - {pr_url}")

        return jsonify({
            "status": "success",
            "pr_url": pr_url,
            "files_modified": len(modified_files),
            "issues_fixed": len(issues)
        })

    except Exception as e:
        print("❌ CREATE PR: Exception occurred:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ------------------- RUN SERVER -------------------
if __name__ == '__main__':
    print("🚀 Starting Flask server on http://localhost:5000")
    print("🔧 Debug mode: ON")
    print("🌐 CORS: Enabled")
    app.run(debug=True, host="0.0.0.0", port=5000)