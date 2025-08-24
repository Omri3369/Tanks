# CI/CD Setup Guide

## GitHub Actions CI/CD Pipeline

This repository uses GitHub Actions for continuous integration and deployment.

### Pipeline Features

1. **Automatic Testing** - Runs on every push and pull request
2. **Security Scanning** - Checks for npm vulnerabilities
3. **Server Validation** - Ensures the server starts correctly
4. **Auto-deployment** - Deploys to Render on master branch pushes

### Required GitHub Secrets

To enable automatic deployment to Render, add these secrets to your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `RENDER_API_KEY`: Your Render API key (get from Render dashboard → Account Settings → API Keys)
   - `RENDER_SERVICE_ID`: Your Render service ID (found in your service URL: srv-XXXX)

### Workflow Triggers

- **Push to master/dev**: Runs tests and deploys (master only)
- **Pull requests**: Runs tests only
- **Manual trigger**: Can be triggered from Actions tab

### Local Testing

Before pushing, you can test locally:
```bash
# Install dependencies
npm ci

# Check for vulnerabilities
npm audit

# Start server
npm start
```