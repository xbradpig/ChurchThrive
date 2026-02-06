# ChurchThrive Developer Contribution Guide

## Welcome! 🎉

Thank you for your interest in contributing to ChurchThrive. This guide will help you understand our development process, coding standards, and how to make effective contributions.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Project Structure](#project-structure)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Component Guidelines](#component-guidelines)
6. [Database Changes](#database-changes)
7. [Adding Features](#adding-features)
8. [Testing Requirements](#testing-requirements)
9. [Pull Request Process](#pull-request-process)
10. [Code Review Guidelines](#code-review-guidelines)

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. ✅ Completed the [Environment Setup Guide](./env-setup-guide.md)
2. ✅ Local development environment running
3. ✅ Read the [API Documentation](./api-docs.md)
4. ✅ Reviewed project architecture (Dev_Plan documents)

### First-Time Setup

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ChurchThrive.git
cd ChurchThrive/Church_Thrive

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_ORG/ChurchThrive.git

# Install dependencies
npm install

# Start development environment
supabase start
npm run dev:web
```

---

## Project Structure

### Monorepo Architecture

```
ChurchThrive/Church_Thrive/
├── app/                          # Next.js 14 Web App
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/          # Auth pages group
│   │   │   ├── (dashboard)/     # Dashboard pages group
│   │   │   └── api/             # API routes
│   │   ├── components/          # React components (Atomic Design)
│   │   │   ├── atoms/           # Basic building blocks
│   │   │   ├── molecules/       # Simple combinations
│   │   │   ├── organisms/       # Complex combinations
│   │   │   ├── templates/       # Page templates
│   │   │   └── pages/           # Page-specific components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand state management
│   │   ├── lib/                 # Utilities and configs
│   │   │   ├── supabase/        # Supabase client
│   │   │   └── utils/           # Helper functions
│   │   └── styles/              # Global styles
│   └── public/                  # Static assets
│
├── mobile/                       # Expo 52 Mobile App
│   ├── app/                      # Expo Router pages
│   ├── components/               # React Native components
│   ├── hooks/                    # Mobile-specific hooks
│   ├── stores/                   # Shared state
│   └── lib/                      # Utilities
│
├── packages/
│   └── shared/                   # Shared TypeScript types
│       └── src/
│           ├── types/            # Database & domain types
│           └── utils/            # Shared utilities
│
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── functions/                # Edge Functions
│   │   ├── send-notification/
│   │   ├── process-stt/
│   │   └── daily-digest/
│   └── config.toml               # Supabase config
│
└── Dev_Plan/                     # Planning documents
    ├── 01_Requirements_Analysis.md
    ├── 02_Technical_Stack.md
    └── Design/                   # Design specifications
```

### Key Directories

| Directory | Purpose | When to Modify |
|-----------|---------|----------------|
| `app/src/app/` | Next.js pages | Adding new routes |
| `app/src/components/` | React components | Adding UI elements |
| `app/src/hooks/` | Data fetching hooks | Adding data access patterns |
| `app/src/stores/` | Global state | Managing client state |
| `mobile/app/` | Mobile screens | Adding mobile pages |
| `packages/shared/` | TypeScript types | After schema changes |
| `supabase/migrations/` | Database schema | Adding tables/columns |
| `supabase/functions/` | Serverless functions | Adding backend logic |

---

## Development Workflow

### Branch Strategy

We follow **Git Flow** with these branch types:

- `main` - Production-ready code
- `develop` - Integration branch (if used)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `chore/*` - Maintenance tasks

### Creating a Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/sermon-search

# Work on your feature...
git add .
git commit -m "feat: add sermon search functionality"

# Push to your fork
git push origin feature/sermon-search
```

### Commit Message Convention

We use **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

**Examples:**
```bash
git commit -m "feat(web): add sermon search with filters"
git commit -m "fix(mobile): resolve offline sync issue"
git commit -m "docs: update API documentation"
git commit -m "refactor(hooks): simplify useMembers hook"
git commit -m "test(web): add sermon component tests"
git commit -m "chore: update dependencies"
```

**Scope Examples:**
- `web` - Web app changes
- `mobile` - Mobile app changes
- `shared` - Shared package changes
- `db` - Database changes
- `api` - API/Edge Functions

---

## Coding Standards

### TypeScript Guidelines

**1. Always Use TypeScript**

```typescript
// ✅ Good
interface MemberFormData {
  name: string;
  phone: string;
  email?: string;
}

function createMember(data: MemberFormData): Promise<Member> {
  // implementation
}

// ❌ Bad
function createMember(data: any) {
  // implementation
}
```

**2. Strict Mode**

All TypeScript files must pass strict type checking:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**3. Import Types from Shared Package**

```typescript
// ✅ Good
import type { Member, Sermon, SermonNote } from '@churchthrive/shared';

// ❌ Bad - Don't redefine types
interface Member {
  id: string;
  name: string;
}
```

### Naming Conventions

**Files:**
- Components: `PascalCase.tsx` (e.g., `MemberCard.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useMembers.ts`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Types: `PascalCase.ts` (e.g., `MemberTypes.ts`)

**Variables:**
- Components: `PascalCase` (e.g., `MemberList`)
- Functions: `camelCase` (e.g., `fetchMembers`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)
- Private: Prefix with `_` (e.g., `_internalHelper`)

**Component Prefixes:**
- All custom components: `CT` prefix (e.g., `CTButton`, `CTInput`)
- Page components: `CT` + Page name (e.g., `CTMembersPage`)

### Code Formatting

We use **Prettier** with these settings:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

**Format before committing:**
```bash
npm run format
```

### ESLint Rules

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

**Key Rules:**
- No `any` types (use `unknown` if needed)
- No `console.log` in production code (use logger)
- Prefer `const` over `let`
- Use arrow functions for callbacks
- No unused variables or imports

---

## Component Guidelines

### Atomic Design Methodology

We follow **Atomic Design** principles:

#### 1. Atoms (Basic UI Elements)

```typescript
// app/src/components/atoms/CTButton.tsx
import React from 'react';

interface CTButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function CTButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
}: CTButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`ct-button ct-button--${variant}`}
    >
      {children}
    </button>
  );
}
```

**Atoms Examples:**
- `CTButton`, `CTInput`, `CTLabel`
- `CTIcon`, `CTBadge`, `CTAvatar`
- `CTSpinner`, `CTDivider`

#### 2. Molecules (Simple Combinations)

```typescript
// app/src/components/molecules/CTFormField.tsx
import React from 'react';
import { CTLabel } from '../atoms/CTLabel';
import { CTInput } from '../atoms/CTInput';

interface CTFormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export function CTFormField({ label, name, value, onChange, error }: CTFormFieldProps) {
  return (
    <div className="ct-form-field">
      <CTLabel htmlFor={name}>{label}</CTLabel>
      <CTInput id={name} name={name} value={value} onChange={onChange} />
      {error && <span className="ct-form-field__error">{error}</span>}
    </div>
  );
}
```

**Molecules Examples:**
- `CTFormField`, `CTSearchBar`, `CTCard`
- `CTDropdownMenu`, `CTModal`, `CTToast`

#### 3. Organisms (Complex Components)

```typescript
// app/src/components/organisms/CTMemberList.tsx
import React from 'react';
import { CTCard } from '../molecules/CTCard';
import { CTButton } from '../atoms/CTButton';
import type { Member } from '@churchthrive/shared';

interface CTMemberListProps {
  members: Member[];
  onMemberClick: (member: Member) => void;
}

export function CTMemberList({ members, onMemberClick }: CTMemberListProps) {
  return (
    <div className="ct-member-list">
      {members.map((member) => (
        <CTCard key={member.id} onClick={() => onMemberClick(member)}>
          <h3>{member.name}</h3>
          <p>{member.phone}</p>
          <CTButton variant="secondary">View Details</CTButton>
        </CTCard>
      ))}
    </div>
  );
}
```

**Organisms Examples:**
- `CTMemberList`, `CTSermonGrid`, `CTNavigationBar`
- `CTDashboardStats`, `CTCalendarView`

#### 4. Templates (Page Layouts)

```typescript
// app/src/components/templates/CTDashboardLayout.tsx
import React from 'react';
import { CTNavigationBar } from '../organisms/CTNavigationBar';
import { CTSidebar } from '../organisms/CTSidebar';

interface CTDashboardLayoutProps {
  children: React.ReactNode;
}

export function CTDashboardLayout({ children }: CTDashboardLayoutProps) {
  return (
    <div className="ct-dashboard-layout">
      <CTNavigationBar />
      <div className="ct-dashboard-layout__content">
        <CTSidebar />
        <main className="ct-dashboard-layout__main">{children}</main>
      </div>
    </div>
  );
}
```

#### 5. Pages (Full Pages)

```typescript
// app/src/app/(dashboard)/members/page.tsx
'use client';

import React from 'react';
import { CTDashboardLayout } from '@/components/templates/CTDashboardLayout';
import { CTMemberList } from '@/components/organisms/CTMemberList';
import { useMembers } from '@/hooks/useMembers';

export default function MembersPage() {
  const { members, isLoading } = useMembers();

  if (isLoading) return <div>Loading...</div>;

  return (
    <CTDashboardLayout>
      <h1>Members</h1>
      <CTMemberList members={members} onMemberClick={(m) => console.log(m)} />
    </CTDashboardLayout>
  );
}
```

### Component Best Practices

**1. Props Typing**

```typescript
// ✅ Good - Explicit interface
interface CTMemberCardProps {
  member: Member;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

// ❌ Bad - Inline types
function CTMemberCard(props: { member: any; onEdit?: any }) {}
```

**2. Default Props**

```typescript
// ✅ Good - Destructure with defaults
function CTButton({ variant = 'primary', size = 'medium' }: CTButtonProps) {}

// ❌ Bad - Use defaultProps
CTButton.defaultProps = { variant: 'primary' };
```

**3. Children Prop**

```typescript
// ✅ Good
interface CTCardProps {
  children: React.ReactNode;
}

// ❌ Bad
interface CTCardProps {
  children: any;
}
```

**4. Event Handlers**

```typescript
// ✅ Good - Specific event type
function CTInput({
  onChange,
}: {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {}

// ❌ Bad - Generic or any
function CTInput({ onChange }: { onChange: (e: any) => void }) {}
```

---

## Database Changes

### Creating Migrations

**Step 1: Create Migration File**

```bash
supabase migration new add_events_table
```

**Step 2: Write Migration SQL**

```sql
-- supabase/migrations/20250205000001_add_events_table.sql

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('worship', 'conference', 'training', 'outreach')),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index
CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_event_date ON events(event_date);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view events of their church"
ON events FOR SELECT
USING (
  church_id = (SELECT church_id FROM members WHERE user_id = auth.uid())
);

CREATE POLICY "Admin/Pastor can manage events"
ON events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND church_id = events.church_id
    AND role IN ('admin', 'pastor')
  )
);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();
```

**Step 3: Apply Migration**

```bash
# Apply to local database
supabase migration up

# Verify migration
supabase migration list
```

**Step 4: Update TypeScript Types**

```bash
# Generate new types
supabase gen types typescript --local > packages/shared/src/types/database.ts

# Rebuild shared package
npm run build:shared
```

**Step 5: Add Domain Types (Optional)**

```typescript
// packages/shared/src/types/event.ts
import type { Database } from './database';

export type Event = Database['public']['Tables']['events']['Row'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];

export type EventType = 'worship' | 'conference' | 'training' | 'outreach';

export interface EventListFilter {
  search: string;
  eventType: EventType | null;
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: 'event_date' | 'title';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
```

### Migration Best Practices

1. **Always use transactions** (implicit in Supabase)
2. **Create indexes** for foreign keys and frequently queried columns
3. **Enable RLS** on all tables
4. **Add `updated_at` triggers** for audit trails
5. **Use check constraints** for data validation
6. **Document complex migrations** with comments

---

## Adding Features

### Feature Development Checklist

- [ ] Create feature branch
- [ ] Update database schema (if needed)
- [ ] Add TypeScript types
- [ ] Implement backend logic (Edge Functions)
- [ ] Create data access hooks
- [ ] Build UI components
- [ ] Add mobile support (if applicable)
- [ ] Write tests
- [ ] Update documentation
- [ ] Create pull request

### Example: Adding Event Management

**1. Database Migration**

```bash
supabase migration new add_events
```

(See Database Changes section for SQL)

**2. Create Data Hook**

```typescript
// app/src/hooks/useEvents.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Event, EventListFilter } from '@churchthrive/shared';

export function useEvents(initialFilter?: Partial<EventListFilter>) {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<EventListFilter>({
    search: '',
    eventType: null,
    dateFrom: null,
    dateTo: null,
    sortBy: 'event_date',
    sortOrder: 'desc',
    page: 1,
    pageSize: 20,
    ...initialFilter,
  });

  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentMember } = await supabase
        .from('members')
        .select('church_id')
        .eq('user_id', user.id)
        .single();

      if (!currentMember) return;

      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('church_id', currentMember.church_id);

      // Apply filters
      if (filter.search) {
        query = query.or(`title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      if (filter.eventType) {
        query = query.eq('event_type', filter.eventType);
      }

      if (filter.dateFrom) {
        query = query.gte('event_date', filter.dateFrom);
      }

      if (filter.dateTo) {
        query = query.lte('event_date', `${filter.dateTo}T23:59:59`);
      }

      // Sort and paginate
      query = query.order(filter.sortBy, { ascending: filter.sortOrder === 'asc' });

      const from = (filter.page - 1) * filter.pageSize;
      const to = from + filter.pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setEvents(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const updateFilter = useCallback((updates: Partial<EventListFilter>) => {
    setFilter((prev) => ({ ...prev, ...updates, page: updates.page || 1 }));
  }, []);

  const totalPages = Math.ceil(total / filter.pageSize);

  return {
    events,
    total,
    totalPages,
    isLoading,
    filter,
    updateFilter,
    refresh: fetchEvents,
  };
}
```

**3. Create Components**

```typescript
// app/src/components/organisms/CTEventCard.tsx
import React from 'react';
import type { Event } from '@churchthrive/shared';
import { CTCard } from '../molecules/CTCard';
import { CTBadge } from '../atoms/CTBadge';

interface CTEventCardProps {
  event: Event;
  onClick?: () => void;
}

export function CTEventCard({ event, onClick }: CTEventCardProps) {
  return (
    <CTCard onClick={onClick}>
      <div className="ct-event-card">
        <CTBadge variant={event.event_type}>{event.event_type}</CTBadge>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <time>{new Date(event.event_date).toLocaleDateString()}</time>
      </div>
    </CTCard>
  );
}
```

**4. Create Page**

```typescript
// app/src/app/(dashboard)/events/page.tsx
'use client';

import React from 'react';
import { CTDashboardLayout } from '@/components/templates/CTDashboardLayout';
import { CTEventCard } from '@/components/organisms/CTEventCard';
import { useEvents } from '@/hooks/useEvents';

export default function EventsPage() {
  const { events, isLoading } = useEvents();

  if (isLoading) return <div>Loading...</div>;

  return (
    <CTDashboardLayout>
      <h1>Events</h1>
      <div className="grid grid-cols-3 gap-4">
        {events.map((event) => (
          <CTEventCard key={event.id} event={event} />
        ))}
      </div>
    </CTDashboardLayout>
  );
}
```

**5. Add Tests**

```typescript
// app/src/hooks/useEvents.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from './useEvents';

describe('useEvents', () => {
  it('should fetch events', async () => {
    const { result } = renderHook(() => useEvents());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.events).toBeInstanceOf(Array);
  });
});
```

---

## Testing Requirements

### Test Coverage Goals

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: Critical paths
- **E2E Tests**: User workflows

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- useEvents.test.ts

# Run in watch mode
npm run test:watch
```

### Writing Unit Tests

```typescript
// app/src/lib/utils/formatDate.test.ts
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-02-05');
    expect(formatDate(date)).toBe('2025-02-05');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(null)).toBe('');
  });
});
```

### Writing Component Tests

```typescript
// app/src/components/atoms/CTButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CTButton } from './CTButton';

describe('CTButton', () => {
  it('should render children', () => {
    render(<CTButton>Click me</CTButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const handleClick = jest.fn();
    render(<CTButton onClick={handleClick}>Click me</CTButton>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled', () => {
    render(<CTButton disabled>Click me</CTButton>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

---

## Pull Request Process

### Before Creating PR

1. **Update your branch**:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature
   git rebase main
   ```

2. **Run tests**:
   ```bash
   npm run test
   npm run typecheck
   npm run lint
   ```

3. **Test manually**:
   - Web app works
   - Mobile app works (if applicable)
   - Database migrations applied

### Creating PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub**:
   - Title: Clear, descriptive (e.g., "feat: add event management system")
   - Description: Use PR template (see below)
   - Reviewers: Assign relevant team members
   - Labels: Add appropriate labels (feature, bug, etc.)

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
- [ ] Database migrations included (if applicable)
- [ ] Mobile compatibility verified (if applicable)

## Testing
How to test this PR:
1. ...
2. ...

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
```

---

## Code Review Guidelines

### As a Reviewer

**What to Check:**
1. ✅ Code follows style guide
2. ✅ Logic is correct and efficient
3. ✅ Edge cases handled
4. ✅ Tests are comprehensive
5. ✅ No security vulnerabilities
6. ✅ Performance considerations
7. ✅ Documentation is clear

**Review Etiquette:**
- Be constructive and respectful
- Explain your reasoning
- Suggest alternatives
- Approve if no blocking issues

### As a Contributor

**Responding to Reviews:**
- Address all comments
- Ask for clarification if needed
- Make requested changes
- Mark resolved comments
- Re-request review after updates

---

## Additional Resources

- [Environment Setup Guide](./env-setup-guide.md)
- [API Documentation](./api-docs.md)
- [Deployment Guide](./deployment-guide.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)

---

## Getting Help

- **Questions**: Ask in team chat
- **Bug Reports**: Create GitHub issue
- **Feature Requests**: Discuss in team meetings
- **Code Help**: Request code review

---

## Conclusion

Thank you for contributing to ChurchThrive! Your efforts help churches worldwide manage their communities more effectively.

**Remember:**
- Follow coding standards
- Write comprehensive tests
- Document your changes
- Be collaborative and respectful

Happy coding! 🚀
