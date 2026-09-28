# Contributing to CoorenLabs

First off, thank you for considering contributing to CoorenLabs! It's people like you that make this a great tool for the community.

## How Can I Contribute?

### Reporting Bugs

- Check the [Issues](https://github.com/CoorenLabs/Cooren/issues) to see if it has already been reported.
- Use a clear and descriptive title.
- Describe the exact steps which reproduce the problem.

### Suggesting Enhancements

- Open an Issue with the "enhancement" tag.
- Explain why this enhancement would be useful to most users.

### Pull Requests

1.  **Fork the repo** and create your branch from `master`.
2.  **Install dependencies**: `bun install`.
3.  **Implement your changes**.
4.  **Add tests**: Extend the Vitest suite in `tests/`.
5.  **Ensure checks pass**: Run `bun run test` and `bun run typecheck`.
6.  **Lint your code**: Run `bun run lint`.
7.  **Submit a PR**: Describe your changes in detail and link to any relevant issues.

## Development Setup

CoorenLabs supports multiple runtimes, but we recommend using **Bun** for development.

```bash
bun run dev
bun run test
```

## Community

- Join our [Discord](https://discord.gg/coorenlabs) (if available).
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under its [GPL-3.0 License](LICENSE).
