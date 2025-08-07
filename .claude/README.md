# 🤖 RapidTriageME Agent Team Configuration

## Overview

This directory contains specialized AI agent definitions for the RapidTriageME browser debugging platform. Each agent represents a distinct role with specific responsibilities, designed to work collaboratively on the development, testing, and deployment of the platform.

## Agent Roles

### 1. **Project Manager Agent** (`agent-pm.json`)
**Primary Focus:** Product strategy, stakeholder coordination, and cross-team alignment

**Key Responsibilities:**
- Define and maintain product roadmap for browser debugging capabilities
- Coordinate releases across NPM packages, Chrome extension, and cloud deployment
- Manage multi-IDE integration strategy
- Oversee documentation and quality standards
- Track project metrics and stakeholder communication

### 2. **Developer Agent** (`agent-developer.json`)
**Primary Focus:** Full-stack implementation and technical excellence

**Key Responsibilities:**
- Implement MCP protocol handlers and transport modes
- Develop Chrome extension with DevTools integration
- Build Cloudflare Worker for remote deployment
- Create browser automation with Puppeteer
- Integrate Lighthouse auditing capabilities
- Ensure TypeScript type safety across all components

### 3. **Tester Agent** (`agent-tester.json`)
**Primary Focus:** Comprehensive quality assurance and validation

**Key Responsibilities:**
- Test compatibility across 10+ IDEs
- Validate browser extension on Chrome/Chromium browsers
- Performance testing for screenshot capture and logging
- Security testing for authentication and data handling
- Lighthouse audit accuracy validation
- API and protocol compliance testing

### 4. **Release Manager Agent** (`agent-release-manager.json`)
**Primary Focus:** Deployment coordination and production stability

**Key Responsibilities:**
- Manage NPM package publishing (@yarlisai scope)
- Coordinate Chrome Web Store releases
- Deploy to Cloudflare Workers platform
- Maintain CI/CD pipelines with GitHub Actions
- Handle version management and changelogs
- Implement rollback procedures and disaster recovery

## How to Use These Agents

### For AI-Assisted Development

1. **Context Loading**: When working with Claude or other AI assistants, reference the specific agent file to adopt that role:
   ```
   "Act as the Developer Agent defined in .claude/agent-developer.json"
   ```

2. **Task Assignment**: Assign tasks based on agent responsibilities:
   ```
   "As the Tester Agent, create test cases for WebSocket reconnection logic"
   ```

3. **Cross-Agent Collaboration**: Simulate team interactions:
   ```
   "As the PM Agent, review the Developer Agent's implementation plan"
   ```

### For Human Teams

1. **Role Definition**: Use agent definitions as job descriptions or responsibility matrices
2. **Onboarding**: Provide new team members with relevant agent files
3. **Process Documentation**: Reference agents in workflow documentation
4. **Performance Reviews**: Align evaluations with agent responsibilities

## Team Configuration

The `team-config.json` file defines:
- **Team Structure**: Reporting relationships and collaboration patterns
- **Communication Channels**: Meeting cadences and participant lists
- **Project Phases**: Phase ownership and deliverables
- **Decision Matrix**: RACI chart for key decisions
- **Escalation Paths**: Issue resolution procedures
- **Success Metrics**: KPIs for project, team, and product health

## Integration with RapidTriageME

These agents are specifically designed for the RapidTriageME platform, which includes:

### Components
- **rapidtriage-mcp**: MCP protocol server for IDE integration
- **rapidtriage-server**: Browser middleware for Chrome extension
- **rapidtriage-extension**: Chrome DevTools panel
- **Cloudflare Worker**: Remote deployment with SSE transport

### Key Technologies
- TypeScript for type-safe development
- Model Context Protocol (MCP) for AI integration
- Chrome Extension Manifest V3
- Cloudflare Workers for edge deployment
- Lighthouse for performance auditing
- WebSocket/SSE for real-time communication

## Best Practices

### When Using Agents

1. **Maintain Context**: Always specify which agent role you're assuming
2. **Respect Boundaries**: Don't mix responsibilities across agents
3. **Follow Escalation**: Use defined escalation paths for issues
4. **Document Decisions**: Record agent-made decisions in project logs
5. **Regular Updates**: Update agent definitions as project evolves

### For Collaboration

1. **Clear Handoffs**: Define clear deliverables between agents
2. **Regular Sync**: Follow communication channel schedules
3. **Quality Gates**: Respect each agent's quality standards
4. **Knowledge Sharing**: Document learnings for all agents
5. **Continuous Improvement**: Update processes based on retrospectives

## Customization

To customize these agents for your specific needs:

1. **Edit Responsibilities**: Modify JSON files to adjust role definitions
2. **Add Specializations**: Create new agent files for additional roles
3. **Update Metrics**: Adjust success metrics in team-config.json
4. **Modify Workflows**: Update communication channels and phases
5. **Extend Tools**: Add new tools and platforms as needed

## Support

For questions about agent configuration or the RapidTriageME platform:
- GitHub Issues: [YarlisAISolutions/rapidtriage](https://github.com/YarlisAISolutions/rapidtriage)
- Documentation: [https://rapidtriage.me/docs](https://rapidtriage.me/docs)
- Discord: [RapidTriage Community](https://discord.gg/rapidtriage)

---

**YarlisAISolutions** - Empowering AI-driven browser automation and debugging with intelligent agent collaboration