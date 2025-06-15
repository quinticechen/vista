
# Vista - AI-Powered Content Experience Platform

Vista is an AI-powered content experience platform that enables businesses and creators to personalize, manage, and optimize content for any audience—across platforms, languages, and formats. Built with privacy-first design principles, Vista offers effective content personalization without relying on third-party tracking.

## 🎯 Core Features

- **Privacy-First Personalization**: Content recommendations based on explicit user preferences only
- **Notion Integration**: Seamless synchronization with Notion databases
- **Semantic Search**: AI-powered natural language search capabilities
- **Multi-language Support**: Automated content translation with context preservation
- **Real-time Analytics**: Performance tracking and engagement metrics
- **Rich Media Support**: Advanced handling of images, videos, and embeds including HEIC format

## 🏗️ Architecture

Vista follows a modern JAMstack architecture:

- **Frontend**: React 18 with TypeScript and Tailwind CSS
- **Backend**: Supabase with PostgreSQL and pgvector for semantic search
- **AI Services**: OpenAI/VertexAI for embeddings and Google Translate for localization
- **Storage**: Supabase Storage for media backup and CDN delivery

## 📋 Documentation

### Core Documentation
- [**Product Requirements Document (PRD)**](./docs/PRD.md) - Complete product specification and requirements
- [**Sequence Diagrams**](./docs/SEQUENCE_DIAGRAMS.md) - Detailed system interaction flows
- [**Class Diagrams**](./docs/CLASS_DIAGRAMS.md) - System architecture and component relationships
- [**Development Guide**](./docs/DEVELOPMENT_GUIDE.md) - DTDD workflow and implementation guidelines

### Development Approach

This project follows **Document-driven Test-driven Development (DTDD)**:

1. **Documentation First**: All features are specified in detailed documentation
2. **Test-Driven**: Tests are written based on documented requirements
3. **Implementation**: Code is written to satisfy tests and documentation
4. **Iteration**: Continuous refinement based on feedback and testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Notion API access (optional, for content sync)
- OpenAI or VertexAI API key (for semantic search)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/vista.git
cd vista
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Configure your Supabase and API keys
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Setup

1. Create a new Supabase project
2. Run the database migrations from `supabase/migrations/`
3. Configure authentication providers
4. Set up storage buckets for media files

## 🧪 Testing

Vista uses a comprehensive testing strategy:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e

# Run specific test suite
npm run test -- --testNamePattern="Notion sync"
```

### Test Structure
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service integration testing  
- **E2E Tests**: Full user journey testing with Playwright

## 📊 Key Metrics & Success Criteria

### Business Metrics
- **30% increase** in customer engagement rates
- **40% reduction** in content operations cost and time
- **80% of content** served with AI-based personalization
- **25% of visitors** sign up and declare preferences

### Technical Metrics
- **99.9% uptime** for content display
- **<2 seconds** average search response time
- **≤1% failure rate** for Notion synchronization

## 🔒 Privacy & Compliance

Vista is built with privacy-first principles:

- **No third-party tracking** or cookies
- **Explicit user consent** for all data collection
- **GDPR and CCPA compliant** from day one
- **Data minimization** - only collect what's explicitly provided
- **User control** over personalization preferences

## 🛠️ Development Workflow

### Adding New Features

1. **Update Documentation**: Add requirements to PRD and update sequence/class diagrams
2. **Write Tests**: Create tests based on documented behavior
3. **Implement**: Write minimal code to pass tests
4. **Review**: Ensure compliance with documentation and test coverage
5. **Deploy**: Use staging environment for validation

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **80%+ test coverage** required for new features
- **ESLint + Prettier**: Automated code quality and formatting
- **Pre-commit hooks**: Quality gates before commits

## 🚢 Deployment

Vista supports multiple deployment options:

### Lovable Platform (Recommended)
- One-click deployment with built-in Supabase integration
- Automatic HTTPS and CDN configuration
- Environment variable management

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, AWS, etc.)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the DTDD workflow (document → test → implement)
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines

- All features must be documented before implementation
- Maintain or improve test coverage
- Follow existing code style and patterns
- Update documentation for any API changes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [docs](./docs/) directory for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions
- **Security**: Report security issues privately to security@vista.ai

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ Core content management and synchronization
- ✅ Basic semantic search functionality
- ✅ Notion integration with webhook support
- ✅ Multi-language content support

### Upcoming (v1.1)
- 🔄 Advanced personalization algorithms
- 🔄 Real-time analytics dashboard
- 🔄 A/B testing framework
- 🔄 Enhanced user segmentation

### Future (v2.0)
- 📋 Advanced content authoring tools
- 📋 Third-party CMS integrations
- 📋 Advanced analytics and reporting
- 📋 Enterprise SSO and security features

---

**Built with ❤️ for content creators and their audiences**

For more information, visit our [documentation](./docs/) or check out the [live demo](https://vista-demo.lovable.app).
更新於 2025-06-15 18:28:11.
更新於 2025-06-15 18:38:29 by quinticechen.
