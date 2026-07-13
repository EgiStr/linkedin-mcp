# Contributing to LinkedIn MCP Server

Thank you for considering contributing! We welcome contributions from everyone.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## How to Contribute

### 1. Report Bugs & Request Features

Open an issue on [GitHub](https://github.com/eggisatriadev/linkedin-mcp-server/issues). Include:

- **Bug reports**: Steps to reproduce, expected vs actual behavior, environment details
- **Feature requests**: Clear description of the feature, why it's useful, any API references

### 2. Submit Changes

1. **Fork** the repository
2. **Create a branch**: `git checkout -b feat/my-feature` or `fix/my-bugfix`
3. **Make your changes** following our coding standards
4. **Write tests** for your changes (if applicable)
5. **Run the build**: `npm run build`
6. **Submit a Pull Request** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/linkedin-mcp-server.git
cd linkedin-mcp-server

# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev
```

### Environment

1. Copy the example env: `cp .env.example .env`
2. Create a [LinkedIn Developer App](https://www.linkedin.com/developers/apps)
3. Add the **Sign In with LinkedIn using OpenID Connect** product
4. Add the **Share on LinkedIn** product (for posting)
5. Generate an access token and add it to `.env`

## Coding Standards

### TypeScript

- **TypeScript** only — no JavaScript files
- **ES2022** target, NodeNext module resolution
- **Strict mode** enabled in tsconfig
- Use `import` with `.js` extensions (ESM-compatible)
- All exports must be typed with explicit interfaces

### Code Style

- 2-space indentation
- Semicolons required
- Single quotes preferred
- Descriptive variable names
- JSDoc comments on all public methods

### Error Handling

- Use the `formatError` utility for all API errors
- Return user-friendly error messages with clear remediation steps
- Never leak access tokens in error messages

### Testing

- Write tests for all new features
- Use Vitest + nock for API mocking
- Unit test error formatters and response transformers
- Integration test tool handlers with mocked API

## Project Structure

```
linkedin-mcp-server/
├── src/
│   ├── index.ts                 # Main entry, tool registration
│   ├── types.ts                 # Shared types
│   ├── services/
│   │   └── linkedin-client.ts   # LinkedIn API client
│   └── tools/
│       ├── profile.ts           # Profile tools
│       ├── posts.ts             # Posts tools
│       └── network.ts           # Network/feed tools
├── tests/
│   └── ...                      # Vitest tests
├── docs/
│   └── ...                      # Documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Pull Request Guidelines

1. Keep PRs focused — one feature/fix per PR
2. Update documentation if your change affects usage
3. Add or update tests
4. Ensure CI passes (lint + type-check + build)
5. Use descriptive PR titles

## Security

- Never commit access tokens or credentials
- Report security issues privately to egicuco50@gmail.com
- All OAuth tokens must be read from environment variables only

## Releasing

Maintainers handle releases. If your PR is merged, it will be included in the next release.

## Questions?

Open a [Discussion](https://github.com/eggisatriadev/linkedin-mcp-server/discussions) or contact the maintainers.

Thank you for contributing! 🚀
