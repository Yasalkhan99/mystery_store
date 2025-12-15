# Git Push Instructions - Mystery Store Repository

## Repository: https://github.com/Yasalkhan99/mystery_store

### Step-by-Step Commands

Open **PowerShell** or **Git Bash** in the project directory and run these commands:

```powershell
# 1. Navigate to project directory
cd C:\Users\User\Downloads\availcoupon-main\availcoupon-main

# 2. Initialize Git (if not already done)
git init

# 3. Check if remote already exists
git remote -v

# 4. If remote exists, remove it first
git remote remove origin

# 5. Add remote repository
git remote add origin https://github.com/Yasalkhan99/mystery_store.git

# 6. Add all files
git add .

# 7. Commit changes
git commit -m "Initial commit: Converted Firebase to Supabase - Complete coupon store with admin panel"

# 8. Set branch to main
git branch -M main

# 9. Push to GitHub (will prompt for authentication)
git push -u origin main
```

### Authentication Options

#### Option 1: Personal Access Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Copy the token
5. When prompted for password, paste the token

#### Option 2: GitHub CLI
```powershell
# Install GitHub CLI if not installed
# Then authenticate
gh auth login
git push -u origin main
```

#### Option 3: SSH (If you have SSH keys set up)
```powershell
git remote set-url origin git@github.com:Yasalkhan99/mystery_store.git
git push -u origin main
```

### Troubleshooting

#### If you get "remote origin already exists" error:
```powershell
git remote remove origin
git remote add origin https://github.com/Yasalkhan99/mystery_store.git
```

#### If you get "fatal: not a git repository":
```powershell
git init
```

#### If you get authentication errors:
- Make sure you're using a Personal Access Token (not password)
- Or set up SSH keys

#### If push fails due to large files:
```powershell
# Check file sizes
git ls-files | xargs ls -la | sort -k5 -rn | head -20

# If node_modules is being tracked, make sure .gitignore includes it
```

### Verify Push

After pushing, check:
- https://github.com/Yasalkhan99/mystery_store
- You should see all your files there

### Quick One-Liner (If everything is set up)

```powershell
cd C:\Users\User\Downloads\availcoupon-main\availcoupon-main; git init; git add .; git commit -m "Initial commit: Converted Firebase to Supabase"; git remote add origin https://github.com/Yasalkhan99/mystery_store.git; git branch -M main; git push -u origin main
```

