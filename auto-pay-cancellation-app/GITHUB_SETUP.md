# 📤 GitHub Setup & Upload Guide

## Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Production Studio - Professional Animation & Video Editor"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create new repository:
   - **Name**: `production-studio`
   - **Description**: "Professional Animation & Video Production Suite"
   - **Visibility**: Public (or Private)
   - **Initialize**: No (already initialized locally)
3. Click "Create repository"

## Step 3: Add Remote & Push

```bash
# Add remote origin
git remote add origin https://github.com/yourusername/production-studio.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Step 4: Configure GitHub Pages (Optional)

```bash
git checkout --orphan gh-pages
git rm -rf .
echo "# Production Studio Docs" > README.md
git add README.md
git commit -m "Initial gh-pages"
git push -u origin gh-pages
git checkout main
```

## Step 5: Enable GitHub Features

### Actions (CI/CD)
- ✅ Already configured in `.github/workflows/build-deploy.yml`
- Auto-builds and pushes Docker images

### Discussions
1. Go to Repository Settings
2. Enable "Discussions"
3. Create categories (Q&A, Ideas, etc.)

### Wiki
1. Go to Repository Settings
2. Enable "Wikis"
3. Create initial wiki pages

### Issues
1. Go to Repository Settings
2. Create issue templates
3. Create issue labels

## Step 6: Set Repository Topics

In Repository Settings → Options:
- Add topics: `animation`, `video-editor`, `production`, `docker`, `react`, `ffmpeg`

## Step 7: Create Branches

```bash
# Development branch
git checkout -b develop
git push -u origin develop

# Staging branch
git checkout -b staging
git push -u origin staging
```

## Step 8: Set Branch Protection

1. Go to Repository Settings → Branches
2. Add rule for `main` branch:
   - Require pull request reviews
   - Require status checks
   - Include admins

3. Add rule for `develop` branch:
   - Require at least 1 review

## Step 9: Add Collaborators

1. Go to Repository Settings → Manage Access
2. Click "Invite a collaborator"
3. Enter GitHub username and permissions

## Step 10: Configure Deploy Keys (for CI/CD)

1. Go to Repository Settings → Deploy Keys
2. Add deployment public key if needed

## Step 11: Enable Security Features

### Secret Scanning
Settings → Security → Secret scanning (auto-enabled for public repos)

### Dependabot
1. Settings → Security & analysis
2. Enable "Dependabot alerts"
3. Enable "Dependabot security updates"

### Code Scanning
1. Settings → Security & analysis
2. Enable "Code scanning"
3. Choose rule set (default or custom)

## Step 12: Create Release

```bash
# Tag version
git tag v1.0.0 -m "Production Studio v1.0.0"

# Push tags
git push origin v1.0.0

# Or create release from GitHub UI:
# 1. Go to Releases
# 2. Click "Draft a new release"
# 3. Tag: v1.0.0
# 4. Release title: Production Studio v1.0.0
# 5. Add release notes
# 6. Publish
```

## Step 13: Add Badges to README

Update README.md with badges:

```markdown
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/production-studio)](https://github.com/yourusername/production-studio/stargazers)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-v20+-blue.svg)](https://www.docker.com)
```

## Step 14: Set Up GitHub Pages for Documentation

```bash
mkdir docs
cd docs

# Create index.md
cat > index.md << 'EOF'
# Production Studio Documentation

Welcome to Production Studio documentation.

## Getting Started
- [Installation](installation.md)
- [Quick Start](quickstart.md)

## Guides
- [User Guide](user-guide.md)
- [Developer Guide](developer-guide.md)
- [Deployment](../DEPLOYMENT.md)
EOF

git add .
git commit -m "Add documentation site"
git push origin main
```

Then in Settings → Pages:
- Source: Deploy from a branch
- Branch: main
- Folder: /docs
- Save

## Step 15: Add Workflow Status Badge

Update README.md:

```markdown
[![Build & Deploy](https://github.com/yourusername/production-studio/workflows/Build%20&%20Deploy/badge.svg)](https://github.com/yourusername/production-studio/actions)
```

## Step 16: Configure Code Owners (Optional)

Create `.github/CODEOWNERS`:

```
# Backend
/backend/ @yourusername

# Frontend
/frontend/ @yourusername

# Documentation
*.md @yourusername

# Docker
Dockerfile @yourusername
docker-compose.yml @yourusername
```

## Step 17: Set Up Issue Labels

1. Go to Labels
2. Create custom labels:
   - `bug` (Red)
   - `feature` (Blue)
   - `documentation` (Green)
   - `good first issue` (Purple)
   - `help wanted` (Orange)

## Step 18: Create Discussions Categories

1. Go to Discussions → Settings
2. Create categories:
   - **Announcements** - Important updates
   - **General** - General discussion
   - **Ideas** - Feature requests
   - **Polls** - Community polls
   - **Show and tell** - Share your work

## Step 19: Add Contributing Guidelines

Already created in `.github/CONTRIBUTING.md`

## Step 20: Final Verification

```bash
# Verify all files are committed
git status

# Check remote
git remote -v

# Push any remaining changes
git push origin main

# Create a test PR
git checkout -b test-pr
git commit --allow-empty -m "Test PR"
git push origin test-pr
# Create PR on GitHub
# Merge and delete branch
```

## Additional GitHub Features

### Auto-merge
Settings → Pull Requests → Enable auto-merge

### Squash merge
Settings → Pull Requests → Allow squash merging

### Delete head branches
Settings → Pull Requests → Automatically delete head branches

## Docker Registry Setup

### Docker Hub

```bash
# Login
docker login

# Tag image
docker tag production-studio:latest yourusername/production-studio:latest
docker tag production-studio:latest yourusername/production-studio:v1.0.0

# Push
docker push yourusername/production-studio:latest
docker push yourusername/production-studio:v1.0.0
```

### GitHub Container Registry

```bash
# Login
echo $CR_PAT | docker login ghcr.io -u yourusername --password-stdin

# Tag image
docker tag production-studio:latest ghcr.io/yourusername/production-studio:latest
docker tag production-studio:latest ghcr.io/yourusername/production-studio:v1.0.0

# Push
docker push ghcr.io/yourusername/production-studio:latest
docker push ghcr.io/yourusername/production-studio:v1.0.0
```

## Summary Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] Branches created (develop, staging)
- [ ] Branch protection enabled
- [ ] CI/CD workflow configured
- [ ] Badges added to README
- [ ] Topics added to repository
- [ ] Issues & discussions enabled
- [ ] Contributing guidelines in place
- [ ] License file added (MIT)
- [ ] Deployment documentation complete
- [ ] Docker images pushed to registry
- [ ] README completed
- [ ] First release tagged
- [ ] Documentation site configured

## Next Steps

1. Share repository link
2. Invite collaborators
3. Create first issues
4. Promote project on social media
5. Gather feedback
6. Plan features based on issues

---

**Your Production Studio is now on GitHub! 🚀**

Share the link: `https://github.com/yourusername/production-studio`
