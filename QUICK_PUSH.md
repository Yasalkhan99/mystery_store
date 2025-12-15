# Quick Push to GitHub

## Repository: https://github.com/Yasalkhan99/mystery_store.git

## Method 1: Double-click push.bat file
Simply double-click `push.bat` file in the project folder.

## Method 2: PowerShell Commands

Open PowerShell in this folder and run:

```powershell
git init
git remote remove origin 2>$null
git remote add origin https://github.com/Yasalkhan99/mystery_store.git
git add .
git commit -m "Initial commit: Converted Firebase to Supabase"
git branch -M main
git push -u origin main
```

## Method 3: Git Bash Commands

```bash
git init
git remote remove origin 2>/dev/null
git remote add origin https://github.com/Yasalkhan99/mystery_store.git
git add .
git commit -m "Initial commit: Converted Firebase to Supabase"
git branch -M main
git push -u origin main
```

## Authentication Required

When prompted:
- **Username:** `Yasalkhan99`
- **Password:** Your Personal Access Token (PAT)

### Get PAT Token:
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select `repo` scope
4. Copy and use as password

