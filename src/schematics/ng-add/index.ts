import {
    apply,
    chain,
    MergeStrategy,
    mergeWith,
    Rule,
    SchematicContext,
    template,
    Tree, url
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {NodePackageInstallTask} from "@angular-devkit/schematics/tasks";

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(_: any): Rule {
    return chain([
        addScriptsToPackageJson("test", "jest --runInBand --ci --silent",),
        addScriptsToPackageJson("test:watch", "jest --watch",),
        addPackageToPackageJson("devDependencies", "@types/jest", "^22.2.0"),
        addPackageToPackageJson("devDependencies", "jest", "^22.4.2"),
        addPackageToPackageJson("devDependencies", "jest-preset-angular", "^5.2.1"),
/*
        removePackageToPackageJson("devDependencies", "jasmine-core"),
        removePackageToPackageJson("devDependencies", "jasmine-spec-reporter"),
        removePackageToPackageJson("devDependencies", "@types/jasmine"),
        removePackageToPackageJson("devDependencies", "@types/jasminewd2"),
        removePackageToPackageJson("devDependencies", "karma"),
        removePackageToPackageJson("devDependencies", "karma-chrome-launcher"),
        removePackageToPackageJson("devDependencies", "karma-coverage-istanbul-reporter"),
*/
        runNpmPackageInstall(),
        editTsConfigSpecJson(),
        deleteFiles(),
        copyConfigFiles()
    ]);
}

function runNpmPackageInstall() {
    return (host: Tree, context: SchematicContext) => {
        context.addTask(new NodePackageInstallTask());
        return host;
    };
}

const PACKAGE_JSON = 'package.json';
const TSCONFIG_SPEC_JSON = 'src/tsconfig.spec.json';

function addPackageToPackageJson(type: string, pkg: string, version: string): Rule {
    return (host: Tree, _: SchematicContext) => {
        if (!host.exists(PACKAGE_JSON)) {
            return host;
        }

        const sourceText = host.read(PACKAGE_JSON)!.toString('utf-8');
        const json = JSON.parse(sourceText);
        if (!json[type]) {
            json[type] = {};
        }

        if (!json[type][pkg]) {
            json[type][pkg] = version;
        }

        host.overwrite(PACKAGE_JSON, JSON.stringify(json, null, 2));

        return host;
    }
}
/*
function removePackageToPackageJson(type: string, pkg: string): Rule {
    return (host: Tree, _: SchematicContext) => {
        if (!host.exists(PACKAGE_JSON)) {
            return host;
        }

        const sourceText = host.read(PACKAGE_JSON)!.toString('utf-8');
        const json = JSON.parse(sourceText);

        if (!json[type]) {
            return host;
        }

        delete json[type][pkg];

        host.overwrite(PACKAGE_JSON, JSON.stringify(json, null, 2));

        return host;
    }
}
*/
function addScriptsToPackageJson(key: string, command: string) {
    return (host: Tree, _: SchematicContext) => {
        if (!host.exists(PACKAGE_JSON)) {
            return host;
        }

        const sourceText = host.read(PACKAGE_JSON)!.toString('utf-8');
        const packageJson = JSON.parse(sourceText);

        if (!packageJson['scripts']) {
            packageJson['scripts'] = {};
        }

        packageJson['scripts'] = {
            ...packageJson['scripts'],
            [key]: command
        };

        host.overwrite(PACKAGE_JSON, JSON.stringify(packageJson, null, 2));

        return host;
    }
}
function editTsConfigSpecJson() {
    return (host: Tree, _: SchematicContext) => {
        if (!host.exists(TSCONFIG_SPEC_JSON)) {
            return host;
        }

        const sourceText = host.read(TSCONFIG_SPEC_JSON)!.toString('utf-8');
        const tsConfigJson = JSON.parse(sourceText);

        if (!tsConfigJson['compilerOptions']) {
            tsConfigJson['compilerOptions'] = {};
        }

        tsConfigJson['compilerOptions'] = {
            ...tsConfigJson['compilerOptions'],
            ['module']: "commonjs",
            ['allowJs']: true,
            ['baseUrl']: './',
        };

        if (!tsConfigJson['compilerOptions']['types']) {
            tsConfigJson['compilerOptions']['types'] = [];
        }

        tsConfigJson['compilerOptions']['types'] = [
            ...tsConfigJson['compilerOptions']['types'].filter((v: string) => v !== 'jasmine'),
            'jest'
        ];


        host.overwrite(TSCONFIG_SPEC_JSON, JSON.stringify(tsConfigJson, null, 2));

        return host;
    }
}

function deleteFiles() {
    return (host: Tree, _: SchematicContext) => {
        host.delete('src/test.ts');
        host.delete('src/karma.conf.js');

        return host;
    }
}

function copyConfigFiles(): Rule {
    return mergeWith(apply(url('./files'), [template({
        utils: strings,
        dot: '.',
        tmpl: ''
    })]), MergeStrategy.AllowOverwriteConflict);
}
