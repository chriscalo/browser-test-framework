# Using JavaScript packages directly from GitHub

## From the browser, load a JavaScript module from a tag in a GitHub repo

### From a public GitHub repo
Tag a version:  
```bash
git tag v0.1.0
git push origin v0.1.0
```  

### From the browser
Reference by tag:  
```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/chriscalo/browser-test-framework@v1.0.0/index.js"
></script>
```  

To update, push a new tag and then update the version in the URL.  

---

## From any Node.js project, install a GitHub package (private or public)

### Publish on GitHub Packages

`package.json`:
```json
{
  "name": "@chriscalo/sh-cmd-tag",
  "version": "0.1.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

Manually publish from your machine:  
```bash
npm version patch
npm publish
```

Automatically publish from CI:  
```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions workflow (`.github/workflows/release.yaml`):  
```yaml
name: release
on:
  push:
    tags: ["v*.*.*"]
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://npm.pkg.github.com
          scope: "@chriscalo"
      - run: npm ci && npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Visibility (private or public): set in **GitHub → Packages → (your package) → Package settings**.

Note: installing from GitHub Packages requires auth even for public packages.

### From a Node.js application

`.npmrc`:  
```
@chriscalo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

Authenticate and install:  
```bash
gh auth login --scopes "read:packages"
export NPM_TOKEN="$(gh auth token)"

npm install @chriscalo/sh-cmd-tag
npm update @chriscalo/sh-cmd-tag
```

(To persist, add the `export NPM_TOKEN=...` line to your shell profile.)

---

## Publish a package publicly for anyone

### Publish  
```bash
npm version patch
npm publish --access public
```  

### From a Node.js application
Install:  
```bash
npm install @chriscalo/browser-test-framework
```  

### From the browser
Load from CDN (after publishing to npm):  
```html
<script
  type="module"
  src="https://unpkg.com/@chriscalo/browser-test-framework@1.0.0"
></script>
```

Or from GitHub directly (available now):  
```html
<script
  type="module"
  src="https://cdn.jsdelivr.net/gh/chriscalo/browser-test-framework@v1.0.0/index.js"
></script>
```  
