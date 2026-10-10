# Revision Studio — start here

This is the complete source package for your personal revision website. Your subjects are already configured:

| Subject | Exam board | Qualification |
| --- | --- | --- |
| Mathematics | Pearson Edexcel | 9MA0 |
| Further Mathematics | Pearson Edexcel | 9FM0 |
| Physics | OCR A | H556 |
| Chemistry | Pearson Edexcel | 9CH0 |

The website has email/password login, a daily dashboard, subject-to-topic performance charts, a mistake notebook, past-paper links and timers, topic unlocking, a question editor and a JSON question importer.

**Nothing has been deployed or connected to an account yet.** The one-time setup below connects real email login and saves your revision data across devices. No paid AI service or API is required.

## 1. Extract the files

On Windows, right-click `revision-studio.zip` and choose **Extract All**. Open the extracted `revision-studio` folder. This folder contains `package.json`, `supabase.sql`, `vercel.json`, and the `public` folder.

Keep this project separate from any existing website. Use a new Supabase project so its authentication settings do not affect another app.

## 2. Create the Supabase project and database

1. Open [supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Create a new project named `revision-studio`. Choose a database password and keep it private. The website does not need this password.
3. Once the project is ready, open its **SQL Editor** and create a new query.
4. Open the supplied `supabase.sql` in a text editor. Copy the complete contents into the query and run it.
5. Check that it finishes without errors. This creates `public.revision_state`, enables row-level security, and limits each account to its own data.

Do not disable row-level security or give the anonymous role access to the table.

## 3. Connect the website

Find your project's **Project URL** and its **publishable key** in the Supabase Connect dialog / project settings. A legacy **anon** key also works. These are browser-facing values.

Open `public/config.js` in a text editor. Fill the two empty strings, preserving the surrounding quotes:

```js
window.REVISION_CONFIG = {
  supabaseUrl: 'https://YOUR-PROJECT-REFERENCE.supabase.co',
  supabasePublishableKey: 'YOUR-PUBLISHABLE-KEY',
  allowSignup: true,
  allowDemo: true
};
```

**Never put a secret key, `service_role` key, database password, or your account password in this file.** The public key does not replace database security; the SQL policies enforce it.

Save the file. You do not need to edit `app.js` or `data.js` to get started.

## 4. Upload the project to GitHub

1. Create a new GitHub repository, for example `revision-studio`. A private repository is suitable.
2. Choose **uploading an existing file**, or **Add file → Upload files**.
3. Upload the contents of the extracted `revision-studio` folder, preserving its subfolders. Upload the extracted files, not the ZIP.
4. Check that `package.json`, `vercel.json` and `supabase.sql` are directly at the repository root, and that `public/index.html` exists.
5. Commit the upload.

The database SQL and documentation are source files only. Vercel publishes the contents of the generated `dist` directory, which contains just the website files from `public`.

## 5. Deploy to Vercel

1. Open [vercel.com](https://vercel.com) and sign in.
2. Add a new project and import your GitHub repository.
3. Use **Other** as the framework preset.
4. Leave Root Directory at the repository root. If you uploaded the enclosing folder instead, select that folder as the root.
5. Confirm these build settings:

| Setting | Value |
| --- | --- |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node version | A supported version of Node 20 or newer |
| Environment variables | None required for this version |

6. Deploy, then copy the production website URL, such as `https://your-project.vercel.app`.

The included `vercel.json` declares the build, output directory and browser security headers. The app uses hash routes, so no catch-all rewrite is required.

## 6. Set up email authentication redirects

Do this **before creating your website account**:

1. In Supabase, open **Authentication** and ensure the **Email** provider is enabled.
2. Keep email confirmation enabled.
3. In **Authentication → URL Configuration**, set **Site URL** to your production Vercel URL, with a trailing slash.
4. Add that same exact URL, including the trailing slash, to the allowed **Redirect URLs**.
5. Save.

For example, if the website is `https://your-project.vercel.app`, use `https://your-project.vercel.app/` for both. Use the canonical production address when signing in, rather than a temporary preview URL.

The app requests redirects to the address from which you opened it. If you test locally, also add `http://localhost:3000/` to the allowed redirect URLs.

Supabase's email service has sending restrictions and limits. If a confirmation or reset email fails, inspect the project's Auth logs and email configuration. Custom SMTP can be configured in Supabase if needed; it does not require changing the website code.

## 7. Create your account and make it personal

1. Open the deployed website.
2. Click **Create account**. Enter your email and a password of at least 12 characters.
3. Open the confirmation email and confirm your account. If necessary, return to the site and sign in.
4. Once your account works, disable **Allow new users to sign up** in Supabase's authentication configuration. This is the setting that actually prevents further accounts.
5. Change `allowSignup` to `false` in `public/config.js` and commit it to GitHub. Vercel will rebuild. This hides the registration link.
6. You may also set `allowDemo` to `false` to remove the demo button.

The site can remember your authenticated session. You will not have to type your password on every visit; use **Sign out** on shared computers. Your account data is protected by authentication and row-level security. The frontend and the original starter questions are downloadable website assets, not private exam content.

## 8. Start revising

1. Open **Settings**. Choose **Every day** or **Every two days**.
2. Select your Further Maths optional papers when you know them. Choose either two different Option 1 papers or a matching Option 1 / Option 2 pair. The app validates this combination. Core Pure is available independently.
3. Open **Unlock topics** and turn on only topics you have studied. All topics start locked on a new account.
4. Return to **Overview**. The website selects one question per unlocked topic that is due. The displayed time is question time, before marking.
5. Start a session, work on paper, reveal the solution and select the marks earned. Confidence and a short reflection can also be recorded.
6. Click a subject bar in the performance chart to see its topics. Click a topic bar to practise its questions; you will be prompted to unlock it first if needed.
7. Open **Mistake notebook** to revisit questions on which you lost marks. A later full-mark attempt removes a question from the notebook.

The schedule is a strict interval rotation, not an adaptive algorithm. A recorded attempt in any mode counts as revision of that topic and starts its interval again. Failed answers also enter the mistake notebook. Skipped/unfinished questions are still due, and missing several days does not generate duplicate backlog. A least-recently-attempted rule rotates questions within a topic, with unseen questions first. Unlocking many topics can produce a long daily workload; the dashboard shows the total.

## 9. Use past papers

- Open **Past papers** and follow a subject's official resource link.
- Find an available paper and its mark scheme, then save their HTTPS links in the form on your website.
- Set the paper's title, subject, actual duration and maximum marks yourself, using the values printed on that paper.
- Click **Start**. The timer is saved and survives reloads. You can pause/resume it and open the PDF in another tab.
- Open **Finish and record your score** when ready. Save your self-marked total and an optional reflection.
- The timer reaching zero does not submit or grade your paper. Complete the score form yourself.

Only one paper timer can be active at a time. There is no automatic marking, PDF upload, or licensed-paper archive. Availability and access restrictions on publishers' websites still apply. Paper totals are separate from topic-chart scores because a paper has not been mapped question by question to topics.

## 10. Expand the question bank

There are **88 original short questions across 80 broad topic groups**, including the eight Further Maths option groups. Most groups have only one question; this is a working starter bank, not comprehensive A-level coverage. The questions are not exam-board-authored or endorsed.

Use **Question bank** to add a question. Select a topic, type the question, and enter one solution point per line. Each non-empty line is worth one mark. The editor calculates the total automatically.

For batches, use the included `question-import-example.json` as a pattern. Replace the example questions, then import the file from the website. Find all accepted topic IDs in `TOPIC-IDS.md`. All questions in an import are validated before any are saved. Each import creates new questions; importing the same file twice duplicates its contents.

LaTeX can be written between `\(` and `\)` for inline maths, or `\[` and `\]` for displayed maths. In a JSON file, write each backslash twice. Plain text and Unicode maths are also supported. HTML is treated as text, not executed. Use your own questions or material you are permitted to reproduce.

Questions entered through the site are saved with your account; you do not have to redeploy. To change the bundled original bank, edit `public/data.js` and redeploy. Keep existing question IDs stable so previous scores continue to refer to the right question. Do not change an existing question into a different question under the same ID.

## Try the local demo before setting up accounts

With Node.js 20 or newer installed:

1. Open a terminal in the extracted `revision-studio` folder.
2. Run `npm start`.
3. Open `http://localhost:3000` in a browser.
4. Choose **Explore local demo**.

No `npm install` is required; the build and local server have no npm dependencies. Supabase and KaTeX are loaded from pinned CDN URLs when you open the site, so an internet connection is needed for those libraries.

The demo is separate from your authenticated account and saves only in this browser. Demo results are not migrated when you sign in. Do not open `index.html` by double-clicking it: browsers block JavaScript modules on `file://` URLs.

## If something does not work

| Problem | What to check |
| --- | --- |
| Sign-in button disabled | Fill both values in `public/config.js`, save and redeploy. |
| Sign-in library could not load | Check internet access, CDN blocking or browser extensions; refresh. |
| Email not confirmed | Follow the confirmation email before signing in. |
| Confirmation/reset opens the wrong address | Correct the Supabase Site URL and Redirect URLs, then request a new email. |
| Database progress cannot load | Run `supabase.sql` in the same project used by `config.js`. Keep RLS enabled. |
| No daily questions | Unlock eligible topics; confirm your interval and Further Maths options. Completed topics may not be due yet. |
| Question keeps repeating | Most starter topics contain only one question. Add more in Question bank. |
| Data changed in another tab | The app loads the newer version and rejects the stale update. Repeat the action against the refreshed data. |
| Save fails offline | Account changes need a connection. The form stays on screen so you can retry. It has not been saved until the action succeeds. |
| Vercel cannot find package.json | Correct the Root Directory to the folder containing that file. |
| Changes not showing | Confirm you committed the changed files and the latest Vercel deployment succeeded, then refresh. |

## Verification status

`npm test` runs 16 automated tests covering the topic/question data, scheduling, London date boundaries, scoring, mistakes, optional-paper validation, external-link validation, persistence, conflicting updates and application event flows. `npm run build` produces the static site.

Those checks passed when this package was created. UI event tests use a lightweight DOM double; they are not browser rendering tests. Visual browser QA, real Supabase signup/login/password recovery, real database RLS enforcement and a live Vercel deployment have not been tested here because no project credentials or browser QA integration were configured.

After setup, check: create/confirm/sign in, unlock a topic, save an incorrect result, refresh, correct it from the mistake notebook, sign out/in, reset your password, and save a paper score. Before relying on the site for personal notes, confirm a second temporary authenticated account cannot access your first account's `revision_state` row. Remove that test account and disable new signups afterwards.

See `README.md` for the file map, design choices and source references.
