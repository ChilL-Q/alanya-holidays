import { Project, SyntaxKind, ObjectLiteralExpression } from 'ts-morph';

const project = new Project({
    tsConfigFilePath: './tsconfig.json',
});

const sourceFiles = project.getSourceFiles();

const servicesList = [
    'propertiesService',
    'storageService',
    'reviewsService',
    'directoryService',
    'adminService',
    'blogService',
    'servicesService',
    'usersService',
    'bookingsService',
    'carsService',
    'crudService',
    'favoritesService',
    'wellnessService',
    'toursService'
];

let modifiedCount = 0;

for (const sourceFile of sourceFiles) {
    if (!sourceFile.getFilePath().includes('.test.tsx') && !sourceFile.getFilePath().includes('.test.ts')) {
        continue;
    }

    const calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    let fileModified = false;

    for (const call of calls) {
        const expr = call.getExpression();
        if (expr.getText() === 'vi.mock') {
            const args = call.getArguments();
            if (args.length > 0 && args[0].getText().includes('api-services')) {
                const factory = args[1];
                if (factory && (factory.getKind() === SyntaxKind.ArrowFunction || factory.getKind() === SyntaxKind.FunctionExpression)) {
                    // Check if it returns { db: { ... } } or equivalent
                    const body = (factory as any).getBody();
                    
                    let returnObj: ObjectLiteralExpression | undefined;
                    
                    if (body.getKind() === SyntaxKind.ObjectLiteralExpression) {
                        // () => ({ db: ... })
                        returnObj = body as ObjectLiteralExpression;
                    } else if (body.getKind() === SyntaxKind.Block) {
                        // () => { return { db: ... } }
                        const returnStmt = body.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
                        if (returnStmt && returnStmt.getExpression()?.getKind() === SyntaxKind.ObjectLiteralExpression) {
                            returnObj = returnStmt.getExpression() as ObjectLiteralExpression;
                        }
                    }

                    if (returnObj) {
                        const dbProp = returnObj.getProperty('db');
                        if (dbProp && dbProp.getKind() === SyntaxKind.PropertyAssignment) {
                            const initializer = (dbProp as any).getInitializer();
                            if (initializer && initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
                                const dbContent = initializer.getText(); // e.g. { getProducts: vi.fn(), ... }
                                
                                // Replace the whole factory with our static map
                                const replacement = `() => {
    const mockDb = ${dbContent};
    return {
${servicesList.map(s => `        ${s}: mockDb`).join(',\n')}
    };
}`;
                                factory.replaceWithText(replacement);
                                fileModified = true;
                            }
                        }
                    }
                }
            }
        }
    }

    if (fileModified) {
        modifiedCount++;
    }
}

project.saveSync();
console.log(`Modified ${modifiedCount} files.`);
