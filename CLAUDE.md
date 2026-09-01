# Project Guide: React + Vite + TypeScript

## Environment & Commands
- Dev Server: `npm run dev`
- Build (Production Check): `npm run build`
- Type Check Only: `npx tsc --noEmit`
- Lint: `npx eslint . --quiet`

## Strict React & TypeScript Rules
- **Extensions**: Always use `.ts` for pure logic and `.tsx` for files containing React components.
- **Component Typing**: Define functional components directly with explicit parameter typing (e.g., `export function Button({ label }: Props)`). Avoid using the deprecated `React.FC` or `JSX.Element` types.
- **Hooks**: Always include accurate dependency arrays in `useEffect`, `useMemo`, and `useCallback`.
- **State**: Type your `useState` hooks explicitly if the initial value is null or complex (e.g., `useState<User | null>(null)`).
- **DOM Access**: Never manipulate the DOM directly with `document.querySelector`. Always use React `useRef`.


## Tech Stack
- **Frontend Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS, Shadcn UI
- **Database & Auth:** Supabase (PostgreSQL)
- **Calendar Engine:** FullCalendar (React Wrapper) or `@shadcn/ui` custom grid

## Core Rules & Features
- Asset Management: CRUD operations, unique IDs, color-coding.
- Interactive Calendar: Monthly, weekly, daily grid views.
- Conflict Prevention: Strict real-time validation to prevent overlapping asset bookings.
- Lifecycle Statuses: Pending, Confirmed, Active, Returned.
- Calendar Library: FullCalendar or a lightweight custom grid view with drag-and-drop support.