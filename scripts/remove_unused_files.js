// Script to remove unused files based on Knip analysis
import fs from 'fs';
import path from 'path';

const filesToRemove = [
    "components/admin/AdminExplorer.tsx",
    "components/property-form/PropertyBasicInfo.tsx",
    "components/property-form/PropertyImages.tsx",
    "skills/internal_skills/bin/install.js",
    "skills/internal_skills/lib/skill-utils.js",
    "skills/internal_skills/scripts/build-catalog.js",
    "skills/internal_skills/scripts/normalize-frontmatter.js",
    "skills/internal_skills/scripts/validate-skills.js",
    "skills/internal_skills/templates/generator_template.js",
    "skills/internal_skills/templates/interactive-skill/assets/chart-template.jsx",
    "skills/internal_skills/templates/interactive-skill/assets/interactive-template.jsx",
    "skills/node-express-backend/backend/src/db/database.ts",
    "skills/node-express-backend/backend/src/db/db.ts",
    "skills/node-express-backend/backend/src/db/index.ts",
    "skills/node-express-backend/backend/src/db/migrations.ts",
    "skills/node-express-backend/backend/src/index.ts",
    "skills/node-express-backend/backend/src/routes/todos.ts",
    "skills/node-express-backend/backend/src/types/index.ts",
    "skills/node-react-tailwind/frontend/src/api/todos.ts",
    "skills/node-react-tailwind/frontend/src/App.css",
    "skills/node-react-tailwind/frontend/src/App.tsx",
    "skills/node-react-tailwind/frontend/src/components/ConfirmDialog.tsx",
    "skills/node-react-tailwind/frontend/src/components/EmptyState.tsx",
    "skills/node-react-tailwind/frontend/src/components/TodoForm.tsx",
    "skills/node-react-tailwind/frontend/src/components/TodoItem.tsx",
    "skills/node-react-tailwind/frontend/src/components/TodoList.tsx",
    "skills/node-react-tailwind/frontend/src/hooks/useTodos.ts",
    "skills/node-react-tailwind/frontend/src/index.css",
    "skills/node-react-tailwind/frontend/src/main.tsx",
    "skills/node-react-tailwind/frontend/src/vite-env.d.ts",
    "skills/node-react-tailwind/frontend/vite.config.ts",
    "skills/playwright-skill/scripts/take-screenshots.js",
    "skills/playwright-skill/lib/helpers.js",
    "skills/playwright-skill/run.js",
    "skills/pptx-official/scripts/html2pptx.js",
    "skills/pptx/scripts/html2pptx.js",
    "skills/react-tailwind-marketing-skills/assets/charts-bar-chart.tsx",
    "skills/react-tailwind-marketing-skills/assets/text-animations-typewriter.tsx",
    "skills/react-tailwind-marketing-skills/assets/text-animations-word-highlight.tsx",
    "skills/typescript/references/condition-based-waiting-example.ts",
    "skills/typescript/references/utility-types.ts",
    "skills/react-tailwind-marketing-skills/render-graphs.js",
    "hooks/index.ts",
    "pages/admin/AdminPage.tsx",
    "scripts/archive/debug_issue.ts",
    "scripts/archive/find_cleo.ts",
    "scripts/archive/fix_cleopatra.ts",
    "scripts/archive/force_delete.ts",
    "scripts/archive/update_properties_fix.ts",
    "scripts/benchmark_db.ts",
    "scripts/check-translations.ts",
    "scripts/gen_email_preview.ts",
    "scripts/seed_stress_test.ts",
    "scripts/verify_booking_expiration.ts",
    "scripts/verify_pagination.ts",
    "scripts/verify-locales.cjs",
    // NOTE: supabase/functions/* entries removed — these are active deployed functions
    // and must NOT be deleted from the local codebase.
];

let removedCount = 0;
let errorsCount = 0;

for (const file of filesToRemove) {
    const fullPath = path.join(process.cwd(), file);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Removed: ${file}`);
            removedCount++;
        } else {
            console.warn(`File not found: ${file}`);
        }
    } catch (error) {
        console.error(`Failed to remove ${file}:`, error.message);
        errorsCount++;
    }
}

console.log(`\nCleanup complete: Removed ${removedCount} files. Errors: ${errorsCount}`);
