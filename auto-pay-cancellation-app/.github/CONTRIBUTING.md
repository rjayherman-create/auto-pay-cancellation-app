# Contributing to Production Studio

Thank you for considering contributing to Production Studio! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Report inappropriate behavior

## 🐛 Reporting Issues

### Before Creating an Issue
- Check if issue already exists
- Search closed issues
- Review documentation

### When Creating an Issue
Include:
- Clear, descriptive title
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Environment info (OS, Node version, etc.)

## 💡 Feature Requests

Describe:
- Feature description
- Use case/motivation
- Proposed implementation (if applicable)
- Examples of similar features

## 🔧 Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/production-studio.git
cd production-studio

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start development
npm run dev
```

## 📝 Coding Standards

### JavaScript/React
- Use ES6+ syntax
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Write clean, maintainable code

### CSS
- Use existing color scheme
- Follow BEM naming convention
- Use variables for constants
- Mobile-first approach

### Git Commits
- Use clear commit messages
- Reference issues when applicable
- One feature/fix per commit
- Use present tense

Example:
```
Fix: resolved audio sync issue in VideoStudio
Closes #123
```

## 🔄 Pull Request Process

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/AmazingFeature`)
3. **Make** your changes
4. **Test** thoroughly
5. **Commit** with clear messages
6. **Push** to your fork
7. **Create** Pull Request

### PR Guidelines
- Clear description of changes
- Reference related issues
- Include screenshots if UI changes
- Update documentation
- Ensure tests pass
- Keep commits clean

## 🧪 Testing

Before submitting PR:
```bash
# Run tests (if configured)
npm test

# Check for linting errors
npm run lint

# Build for production
npm run build
```

## 📚 Documentation

When adding features:
- Update relevant documentation
- Add code comments
- Include usage examples
- Update API docs if applicable

## 🎨 Design Guidelines

### Colors
- Primary: Cyan (#00ffff)
- Secondary: Magenta (#ff00ff)
- Accent: Green (#64ff64)
- Background: Dark (#0a0e27)

### Components
- Consistent styling
- Responsive design
- Accessible (WCAG 2.1 AA)
- Performance optimized

## 🚀 Deployment

### Local Testing
```bash
# Test with Docker
docker build -t production-studio:test .
docker run -p 5000:5000 -p 8080:8080 production-studio:test
```

### Staging
- Create PR for review
- Staging environment deployment (if available)
- Final testing and approval

### Production
- Merge to main branch
- Automatic deployment via GitHub Actions
- Monitor for issues

## 📋 Checklist

Before submitting PR:
- [ ] Code follows style guide
- [ ] No console errors/warnings
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Commits are clean
- [ ] No sensitive data included
- [ ] Works on different browsers
- [ ] Mobile responsive (if UI changes)

## 💬 Getting Help

- Check [Documentation](../docs)
- Review existing code
- Ask in discussions
- Comment on issues
- Join our community

## 🙏 Thank You!

Your contributions make Production Studio better for everyone. Thank you for taking the time to contribute!

---

For more information, see [README.md](../README.md)
