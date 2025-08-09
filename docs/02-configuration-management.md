# 🔧 Centralized Configuration Management

## Overview

RapidTriageME uses a centralized configuration system based on the `.project` file, making it easy to manage repository URLs, domain settings, and other project-wide configurations from a single source of truth.

## 📋 The .project File

The `.project` file is the central configuration source for the entire project:

```bash
PROJECT_NAME=RapidTriageME
REPOSITORY_URL=https://github.com/YarlisAISolutions/rapidtriageME
PROVIDER=CLOUDFLARE
REGION=GLOBAL
DOMAIN=rapidtriage.me
DESCRIPTION=Remote Browser Tools MCP Platform for AI-powered browser triage and debugging
```

## 🚀 Benefits of Centralized Configuration

### 1. **Single Source of Truth**
- All project metadata in one place
- No need to update multiple files when changing repository URLs
- Consistent configuration across all components

### 2. **Easy Updates**
- Change repository URL once in `.project`
- Run update script to propagate changes
- Automatic updates to all documentation and code

### 3. **Cross-Language Support**
- JavaScript/Node.js: `config/project.js`
- Python/MkDocs: `config/project.py`
- Shell Scripts: Direct sourcing of `.project`

## 📦 Configuration Modules

### JavaScript/Node.js Module

```javascript
// Import configuration
const config = require('./config/project');

// Use in your code
console.log(`Repository: ${config.repositoryUrl}`);
console.log(`Domain: ${config.domain}`);

// Use utility functions
const cloneUrl = config.getGitCloneUrl();
const issuesUrl = config.getIssuesUrl();
```

### Python Module

```python
# Import configuration
from config.project import PROJECT_NAME, REPOSITORY_URL, DOMAIN

# Use in MkDocs or Python scripts
print(f"Project: {PROJECT_NAME}")
print(f"Documentation: https://docs.{DOMAIN}")
```

### Shell Scripts

```bash
# Source .project file
source .project

# Use variables directly
echo "Repository: $REPOSITORY_URL"
echo "Domain: $DOMAIN"
```

## 🔄 Updating Repository URLs

### Quick Update Process

1. **Edit .project file**
```bash
nano .project
# Change REPOSITORY_URL to new value
```

2. **Run update script**
```bash
./scripts/update-repository-urls.sh
```

3. **Review and commit changes**
```bash
git diff
git add -A
git commit -m "Update repository URLs"
git push origin main
```

### What Gets Updated

The update script automatically changes:
- All markdown documentation files (`*.md`)
- MkDocs configuration (`mkdocs.yml`, `mkdocs-simple.yml`)
- Package.json files
- HTML files in the built documentation
- Any other files containing the old repository URL

## 🛠️ Configuration API

### JavaScript API

```javascript
const config = require('./config/project');

// Basic properties
config.projectName        // "RapidTriageME"
config.repositoryUrl      // "https://github.com/YarlisAISolutions/rapidtriageME"
config.githubOrg         // "YarlisAISolutions"
config.githubRepo        // "rapidtriageME"
config.domain            // "rapidtriage.me"
config.docsUrl           // "https://docs.rapidtriage.me"

// Utility functions
config.getGitCloneUrl()   // Returns git clone URL
config.getIssuesUrl()     // Returns GitHub issues URL
config.getRawContentUrl(branch, filepath) // Returns raw file URL
```

### Python API

```python
from config.project import *

# Properties
PROJECT_NAME     # "RapidTriageME"
REPOSITORY_URL   # "https://github.com/YarlisAISolutions/rapidtriageME"
GITHUB_ORG       # "YarlisAISolutions"
GITHUB_REPO      # "rapidtriageME"
DOMAIN           # "rapidtriage.me"
DOCS_URL         # "https://docs.rapidtriage.me"

# MkDocs configuration dict
MKDOCS_CONFIG    # Pre-configured mkdocs settings
```

## 📝 Adding New Configuration

### Step 1: Update .project

Add new configuration to `.project`:
```bash
echo "NEW_SETTING=value" >> .project
```

### Step 2: Update JavaScript Module

Edit `config/project.js`:
```javascript
module.exports = {
  // ... existing config
  newSetting: projectConfig.NEW_SETTING || 'default',
}
```

### Step 3: Update Python Module

Edit `config/project.py`:
```python
NEW_SETTING = _config.get('NEW_SETTING', 'default')
```

## 🔍 Configuration Validation

### Validate .project File

```bash
# Check if all required fields are present
./scripts/validate-config.sh
```

### Test Configuration Loading

```javascript
// JavaScript
node -e "console.log(require('./config/project'))"
```

```python
# Python
python config/project.py
```

## 📊 Configuration in Different Environments

### Development
```bash
# .project.dev (optional override)
REPOSITORY_URL=https://github.com/yourfork/rapidtriageME
DOMAIN=localhost:3000
```

### Staging
```bash
# .project.staging
DOMAIN=staging.rapidtriage.me
```

### Production
```bash
# .project (default)
DOMAIN=rapidtriage.me
```

### Loading Environment-Specific Config

```bash
# Load specific environment
export PROJECT_ENV=staging
source .project.$PROJECT_ENV || source .project
```

## 🚨 Troubleshooting

### Configuration Not Loading

```bash
# Check file exists and is readable
ls -la .project
cat .project

# Validate syntax
grep -E "^[A-Z_]+=.*$" .project
```

### Updates Not Applying

```bash
# Clear any cached builds
rm -rf site/ dist/ build/

# Force rebuild
npm run build
mkdocs build --clean
```

### Script Permissions

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

## 🎯 Best Practices

1. **Always use .project** for project-wide settings
2. **Run update script** after changing repository URLs
3. **Commit .project changes** with your code changes
4. **Document new settings** in this file
5. **Use environment-specific files** for different deployments

## 📚 Examples

### Example: Changing Repository Owner

```bash
# 1. Update .project
sed -i '' 's|YarlisAISolutions|NewOrg|g' .project

# 2. Run update script
./scripts/update-repository-urls.sh

# 3. Commit changes
git add -A
git commit -m "Transfer repository to NewOrg"
```

### Example: Adding API Endpoint Configuration

```bash
# 1. Add to .project
echo "API_ENDPOINT=https://api.rapidtriage.me" >> .project

# 2. Use in JavaScript
const config = require('./config/project');
fetch(config.apiEndpoint + '/health');

# 3. Use in Python
from config.project import API_ENDPOINT
requests.get(f"{API_ENDPOINT}/health")
```

## 🔗 Related Files

- `.project` - Main configuration file
- `config/project.js` - JavaScript configuration module
- `config/project.py` - Python configuration module
- `scripts/update-repository-urls.sh` - URL update script
- `scripts/validate-config.sh` - Configuration validator

## 🆘 Support

For configuration issues:
1. Check this documentation
2. Review `.project` file syntax
3. Run validation scripts
4. Open an issue on GitHub

---

**Configuration is now centralized and easy to manage!** 🎉

Simply edit `.project` and run the update script whenever you need to change project-wide settings.