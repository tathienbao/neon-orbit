# Development Guidelines

## Senior Developer Mindset

### Core Principles

1. **Understand Before Changing**
   - Always read existing code before modifying
   - Understand the context and intent behind current implementation
   - Ask clarifying questions when requirements are ambiguous

2. **Keep It Simple (KISS)**
   - Solve the problem at hand, not hypothetical future problems
   - Avoid over-engineering and premature abstraction
   - Three similar lines of code is better than a premature abstraction
   - Only add complexity when it provides clear, immediate value

3. **Minimal Surface Area**
   - Make the smallest change that achieves the goal
   - Don't add features, refactor code, or make "improvements" beyond what was asked
   - Don't add error handling for scenarios that can't happen
   - Don't add backwards-compatibility shims when you can just change the code

4. **Quality Over Quantity**
   - Write code that works correctly first
   - Optimize only when there's a measurable performance issue
   - Test edge cases mentally before committing

---

## Code Quality Standards

### Naming Conventions
- Variables: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities

### Code Organization
```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── utils/          # Pure utility functions
├── config/         # Configuration constants
├── types/          # TypeScript types
└── lib/            # Third-party integrations
```

### Comments
- Only add comments where the logic isn't self-evident
- Don't add docstrings, comments, or type annotations to code you didn't change
- Comments should explain "why", not "what"

---

## Development Workflow

### Before Writing Code
1. Understand the full scope of the task
2. Identify affected files and potential side effects
3. Consider edge cases upfront

### While Writing Code
1. Start with the simplest solution that could work
2. Use existing patterns in the codebase
3. Maintain consistency with surrounding code style
4. Handle errors at system boundaries only (user input, external APIs)

### After Writing Code
1. Review your own changes before committing
2. Verify the change works as expected
3. Check for any unintended side effects
4. Keep commits focused and atomic

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build | Vite |
| Backend | Cloudflare Workers + Durable Objects |
| Deployment | Cloudflare Pages |

---

## Performance Guidelines

### Canvas Rendering
- Use `requestAnimationFrame` for smooth 60fps animation
- Batch draw calls when possible
- Use refs for frequently-changing values to avoid re-renders
- Keep render function pure and fast

### State Management
- Use React state for UI state
- Use refs for values that don't need to trigger re-renders
- Avoid unnecessary state updates in game loops

### Network
- Minimize message size for real-time sync
- Use WebSocket for low-latency communication
- Buffer states to handle network jitter

---

## Don't

- Don't create files unless absolutely necessary
- Don't add emojis unless explicitly requested
- Don't over-document obvious code
- Don't guess or make assumptions - ask when unclear
- Don't introduce breaking changes without discussion
- Don't commit commented-out code
- Don't leave console.log statements in production code
