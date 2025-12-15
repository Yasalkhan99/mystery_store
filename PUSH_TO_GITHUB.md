# Push Code to GitHub Repository

## Steps to Push Code to https://github.com/Yasalkhan99/mystery_store

### Option 1: Using PowerShell Script (Windows)
```powershell
cd C:\Users\User\Downloads\availcoupon-main\availcoupon-main
.\push-to-github.ps1
```

### Option 2: Using Bash Script (Linux/Mac/Git Bash)
```bash
cd C:\Users\User\Downloads\availcoupon-main\availcoupon-main
bash push-to-github.sh
```

### Option 3: Manual Commands

Open terminal in the project directory and run:

```bash
# Navigate to project directory
cd C:\Users\User\Downloads\availcoupon-main\availcoupon-main

# Initialize Git (if not already initialized)
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Converted Firebase to Supabase"

# Add remote repository
git remote add origin https://github.com/Yasalkhan99/mystery_store.git

# Set branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

### Authentication

If you get authentication errors, you may need to:

1. **Use Personal Access Token (PAT):**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate a new token with `repo` permissions
   - Use token as password when prompted

2. **Or use SSH:**
   ```bash
   git remote set-url origin git@github.com:Yasalkhan99/mystery_store.git
   git push -u origin main
   ```

### Troubleshooting

- **If remote already exists:**
  ```bash
  git remote remove origin
  git remote add origin https://github.com/Yasalkhan99/mystery_store.git
  ```

- **If you need to force push (be careful!):**
  ```bash
  git push -u origin main --force
  ```

- **Check git status:**
  ```bash
  git status
  git remote -v
  ```

