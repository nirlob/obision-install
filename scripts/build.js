#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'builddir';

console.log('🚀 Building GNOME App...');

// Clean directories
if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
}

// Create directories
fs.mkdirSync(BUILD_DIR, { recursive: true });

// Compile TypeScript
console.log('🔨 Compiling TypeScript...');
try {
    execSync('npx tsc --outDir builddir --rootDir src', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ TypeScript compilation failed');
    process.exit(1);
}

console.log('🔄 Converting for GJS...');

// GJS header
const gjsHeader = `#!/usr/bin/env gjs

const { Gio } = imports.gi;
const { Gtk } = imports.gi;
const { Adw } = imports.gi;
const { Pango } = imports.gi;

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Adw = '1';

`;

// Read and process the components
let combinedContent = gjsHeader;

// First, add the interfaces from interfaces file if it exists
const interfacesFile = path.join(BUILD_DIR, 'interfaces', 'applications-data.js');
if (fs.existsSync(interfacesFile)) {
    let interfacesContent = fs.readFileSync(interfacesFile, 'utf8');
    // Extract interface definitions (they will be removed by transpilation)
    console.log('📋 Adding interfaces...');
}

// Add UtilsService service
const utilsServiceFile = path.join(BUILD_DIR, 'services', 'UtilsService.js');
if (fs.existsSync(utilsServiceFile)) {
    console.log('📋 Adding UtilsService service...');
    let utilsServiceContent = fs.readFileSync(utilsServiceFile, 'utf8');

    // Clean up the content - find the class definition start
    const classStartIndex = utilsServiceContent.indexOf('class UtilsService {');
    if (classStartIndex !== -1) {
        utilsServiceContent = utilsServiceContent.substring(classStartIndex);
    }

    // Clean up TypeScript/CommonJS artifacts
    utilsServiceContent = utilsServiceContent
        .replace(/exports\.\w+\s*=.*?;?\n?/g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/adw_1_1\.default\./g, 'Adw.');

        console.log(utilsServiceContent)

    combinedContent += utilsServiceContent + '\n';
}

// Add InstallDialog component
const installDialogFile = path.join(BUILD_DIR, 'components', 'InstallDialog.js');
if (fs.existsSync(installDialogFile)) {
    console.log('📋 Adding InstallDialog component...');
    let installDialogContent = fs.readFileSync(installDialogFile, 'utf8');

    // Clean up the content - find the class definition start
    const classStartIndex = installDialogContent.indexOf('class InstallDialog {');
    if (classStartIndex !== -1) {
        installDialogContent = installDialogContent.substring(classStartIndex);
    }
    
    // Clean up TypeScript/CommonJS artifacts
    installDialogContent = installDialogContent
        .replace(/exports\.\w+\s*=.*?;?\n?/g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/UtilsService_1\./g, '')
        .replace(/adw_1_1\.default\./g, 'Adw.');

    combinedContent += installDialogContent + '\n';
}

// Add PackageRow component
const packageRow = path.join(BUILD_DIR, 'components', 'PackageRow.js');
if (fs.existsSync(packageRow)) {
    console.log('📋 Adding PackageRow component...');
    let packageRowContent = fs.readFileSync(packageRow, 'utf8');

    // Clean up the content - find the class definition start
    const classStartIndex = packageRowContent.indexOf('class PackageRow {');
    if (classStartIndex !== -1) {
        packageRowContent = packageRowContent.substring(classStartIndex);
    }
    
    // Clean up TypeScript/CommonJS artifacts
    packageRowContent = packageRowContent
        .replace(/exports\.\w+\s*=.*?;?\n?/g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/adw_1_1\.default\./g, 'Adw.');

    combinedContent += packageRowContent + '\n';
}

// Add GroupsList component
const groupsListFile = path.join(BUILD_DIR, 'components', 'GroupsList.js');
if (fs.existsSync(groupsListFile)) {
    console.log('📋 Adding GroupsList component...');
    let groupsContent = fs.readFileSync(groupsListFile, 'utf8');
    
    // Clean up the content - find the class definition start
    const classStartIndex = groupsContent.indexOf('class GroupsList {');
    if (classStartIndex !== -1) {
        groupsContent = groupsContent.substring(classStartIndex);
    }
    
    // Clean up TypeScript/CommonJS artifacts
    groupsContent = groupsContent
        .replace(/exports\.\w+\s*=.*?;?\n?/g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/InstallDialog_js_1\./g, '')
        .replace(/UtilsService_js_1\./g, '')
        .replace(/PackageRow_js_1\./g, '')
        .replace(/adw_1_1\.default\./g, 'Adw.');
    
    combinedContent += groupsContent + '\n';
}

// Add ApplicationsList component
const applicationsListFile = path.join(BUILD_DIR, 'components', 'ApplicationsList.js');
if (fs.existsSync(applicationsListFile)) {
    console.log('📋 Adding ApplicationsList component...');
    let applicationsContent = fs.readFileSync(applicationsListFile, 'utf8');

    // Clean up the content - find the class definition start
    const classStartIndex = applicationsContent.indexOf('class ApplicationsList {');
    if (classStartIndex !== -1) {
        applicationsContent = applicationsContent.substring(classStartIndex);
    }

    // Clean up TypeScript/CommonJS artifacts
    applicationsContent = applicationsContent
        .replace(/exports\.\w+\s*=.*?;?\n?/g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/InstallDialog_js_1\./g, '')
        .replace(/UtilsService_1\./g, '')
        .replace(/PackageRow_js_1\./g, '')
        .replace(/adw_1_1\.default\./g, 'Adw.');

    combinedContent += applicationsContent + '\n';
}

// Add main application
const mainJsFile = path.join(BUILD_DIR, 'main.js');
if (fs.existsSync(mainJsFile)) {
    console.log('📋 Adding main application...');
    let mainContent = fs.readFileSync(mainJsFile, 'utf8');
    
    // Clean up the content - find the class definition start
    const classStartIndex = mainContent.indexOf('class ObisionInstallApplication {');
    if (classStartIndex !== -1) {
        mainContent = mainContent.substring(classStartIndex);
    }
    
    // Clean up TypeScript/CommonJS artifacts
    mainContent = mainContent
        .replace(/GroupsList_js_1\.GroupsList/g, 'GroupsList')
        .replace(/GroupsList_js_1\./g, '')
        .replace(/ApplicationsList_js_1\.ApplicationsList/g, 'ApplicationsList')
        .replace(/ApplicationsList_js_1\./g, '')
        .replace(/gtk_4_0_1\.default\./g, 'Gtk.')
        .replace(/gio_2_0_1\.default\./g, 'Gio.')
        .replace(/pango_1_0_1\.default\./g, 'Pango.')
        .replace(/adw_1_1\.default\./g, 'Adw.');
    
    combinedContent += mainContent + '\n';
}

// Write the final combined file (overwrite main.js)
const appFile = path.join(BUILD_DIR, 'main.js');
fs.writeFileSync(appFile, combinedContent);
fs.chmodSync(appFile, 0o755);

// Copy resources
console.log('📁 Copying resources...');
const dataUiSrc = 'data/ui';
const dataJsonSrc = 'data/json';
const dataUiDest = path.join(BUILD_DIR, 'data/ui');
const dataJsonDest = path.join(BUILD_DIR, 'data/json');
const dataIconsSrc = 'data/icons';
const dataIconsDest = path.join(BUILD_DIR, 'data/icons');

// Copy icons if they exist
if (fs.existsSync(dataIconsSrc)) {
    execSync(`mkdir -p ${path.dirname(dataIconsDest)} && cp -r ${dataIconsSrc} ${path.dirname(dataIconsDest)}/`, { stdio: 'pipe' });
}

if (fs.existsSync(dataUiSrc)) {
    execSync(`mkdir -p ${path.dirname(dataUiDest)} && cp -r ${dataUiSrc} ${path.dirname(dataUiDest)}/`, { stdio: 'pipe' });
}

if (fs.existsSync(dataJsonSrc)) {
    execSync(`mkdir -p ${path.dirname(dataJsonDest)} && cp -r ${dataJsonSrc} ${path.dirname(dataJsonDest)}/`, { stdio: 'pipe' });
}

console.log('✅ Build completed successfully!');
console.log(`📦 Application built to: ${appFile}`);
console.log('🚀 Run with: ./builddir/main.js');