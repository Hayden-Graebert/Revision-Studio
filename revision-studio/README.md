# Revision Studio

A personal A-level revision app, built with browser-native HTML, CSS and JavaScript. Start with **START-HERE.md** for the full Supabase and Vercel setup.

## Included

- Email/password authentication, confirmation and recovery through Supabase.
- Preset Edexcel Maths, Further Maths and Chemistry; OCR A Physics.
- Daily dashboard and one-/two-day topic intervals.
- Interactive, keyboard-accessible subject bars that drill down into topics.
- Thirty-calendar-day, mark-weighted practice performance, with empty states instead of fabricated scores.
- Paper-based working and self-marking against worked solutions.
- Mistake notebook, confidence and reflection notes.
- Topic unlocking and validated Further Maths optional-paper selection.
- Official past-paper resource links, saved paper links, persistent timer and paper-score history.
- Original starter questions, a question editor and validated JSON import.
- Account-data export and an explicitly separate local demo.
- Database row-level security and optimistic concurrency checks for cross-device saves.
- Responsive desktop/mobile layouts and reduced-motion support.

## File map

| File | Purpose |
| --- | --- |
| `START-HERE.md` | Step-by-step setup and usage guide |
| `public/index.html` | Entry page and pinned CDN libraries |
| `public/styles.css` | Responsive visual design |
| `public/app.js` | Authentication UI, routes, forms, charts and sessions |
| `public/config.js` | Public Supabase URL/key and UI flags |
| `public/model.js` | Pure scheduling, scoring and validation rules |
| `public/data.js` | Four subjects, 80 topic groups, 88 original questions |
| `public/storage.js` | Supabase persistence / separate demo persistence |
| `public/favicon.svg` | Site icon |
| `supabase.sql` | Account study-state table, grants and RLS policies |
| `vercel.json` | Build, output and security headers |
| `package.json` | Local server, test and build commands |
| `scripts/build.mjs` | Copies website files to `dist/` |
| `scripts/serve.mjs` | Local-only development server on port 3000 |
| `tests/` | Sixteen data, business-rule and event-flow tests |
| `question-import-example.json` | Editable sample question collection |
| `TOPIC-IDS.md` | Reference IDs for importing questions |

## Commands

Requires Node.js 20+; no npm install step is needed.

```sh
npm start       # local development: http://localhost:3000
npm test        # automated checks
npm run build   # website output in dist/
```

The source uses Supabase JS 2.49.1 and KaTeX 0.16.11 via jsDelivr. Both dependencies are pinned in `index.html`. Their licences are respectively MIT and MIT; the package references their hosted distributions and does not bundle their source. System fonts and CSS are used instead of third-party font services. There is no analytics service or AI API.

## Persistence and security

All account study data is stored in one `revision_state` JSONB row keyed by the Supabase user ID. This deliberately simple design suits one personal user; it is not intended as a multi-school service. Passwords are handled by Supabase Auth and are never stored in study state. Auth session tokens are managed in browser storage by the SDK.

The schema grants only SELECT, INSERT and UPDATE to authenticated users, guarded by `auth.uid() = user_id`; anonymous access is revoked. Saves condition on the previous `revision` and increase it on success. A stale writer cannot silently replace another device's newer state. Its action is rejected, the current state is loaded, and the user is asked to repeat the action. Network errors do not report success. There is no offline queue.

Whole-state writes and a single row simplify setup but grow with history. If the app expands to many users or very large histories, migrate attempts, papers and questions to separate tables with the same per-user RLS pattern. Data is not pruned automatically. The app does not contain secrets and does not need a server-side service-role key.

The published frontend assets and starter questions are public. Personal notes, marks and custom questions are behind Supabase authentication/RLS. Disable new signups in Supabase after creating your account; hiding the signup UI alone is not an access control.

The Vercel CSP permits the pinned CDN and HTTPS `*.supabase.co` connections. A custom Supabase domain would require updating the CSP and the URL validation in `app.js`. Paper links open in external tabs with `noopener noreferrer`; PDFs are not embedded or fetched by the app. User-entered content is HTML-escaped before display; KaTeX's trust mode is disabled.

## Content boundaries

The curriculum is organised into broad revision groups using the official specifications, not every individual learning objective. Optional Further Maths papers are represented as whole groups until the user expands their bank. The 88 original questions are short retrieval exercises with concise self-mark schemes, not comprehensive exam preparation or official board materials. Written practical questions do not certify practical competence.

Daily practice counts any recorded question attempt towards that topic's interval, including bank practice and mistake review. Each topic supplies at most one daily question. Repeated mistakes are visible in the notebook but do not automatically alter the strict schedule. Confidence is recorded, not used to weight the displayed percentages. Paper totals cannot truthfully be attributed to topics without question-by-question mapping, so they have separate history.

Progress is saved after each marked question. Leaving/reloading a daily session discards only its in-memory question order and revealed-answer state; saved results remain, and restarting daily revision selects the topics still due. Optional paper selections can be changed without deleting previous attempts.

## Sources checked during preparation (10 October 2026)

Topic labels and optional-paper rules were checked against these official sources. Questions and app design are original. Follow the board's current specification and your school's selected options for exact content.

- [Pearson Edexcel A-level Mathematics specification](https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/a-level-l3-mathematics-specification-issue4.pdf)
- [Pearson Edexcel A-level Further Mathematics specification](https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/a-level-l3-further-mathematics-specification.pdf)
- [Pearson Edexcel A-level Chemistry specification](https://qualifications.pearson.com/content/dam/pdf/A%20Level/Chemistry/2015/Specification%20and%20sample%20assessments/a-level-chemistry-2015-specification.pdf)
- [OCR Physics A: specification at a glance](https://www.ocr.org.uk/qualifications/as-and-a-level/physics-a-h156-h556-from-2015/specification-at-a-glance/)
- [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase authentication configuration](https://supabase.com/docs/guides/auth/general-configuration)
- [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build)
- [Vercel Git deployment](https://vercel.com/docs/git)

See START-HERE.md for completed checks and the remaining live-account/browser verification steps.
