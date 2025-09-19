#!/usr/bin/env node

/**
 * Codemod to convert PatternFly imports to use proper dynamic/absolute paths
 * 
 * Converts:
 * - Components: import { Button } from '@patternfly/react-core' 
 *   → import { Button } from '@patternfly/react-core/dist/dynamic/components/Button'
 * 
 * - Icons: import { SearchIcon } from '@patternfly/react-icons'
 *   → import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon'
 * 
 * - Table: import { Table } from '@patternfly/react-table'
 *   → import { Table } from '@patternfly/react-table/dist/dynamic/components/Table'
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Convert PascalCase to kebab-case for icons
function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

// Known component mappings for react-core
const REACT_CORE_COMPONENTS = new Set([
  'Alert', 'AlertActionCloseButton', 'AlertVariant', 'Button', 'ButtonVariant', 'Card', 'CardBody',
  'Checkbox', 'Chip', 'ChipGroup', 'Dropdown', 'DropdownItem', 'DropdownList', 'EmptyState',
  'EmptyStateActions', 'EmptyStateBody', 'EmptyStateFooter', 'EmptyStateHeader', 'EmptyStateIcon',
  'EmptyStateVariant', 'ExpandableSection', 'Form', 'FormGroup', 'FormSelect', 'FormSelectOption',
  'Grid', 'GridItem', 'Label', 'Level', 'LevelItem', 'List', 'ListItem', 'MenuToggle', 'MenuToggleElement',
  'Modal', 'ModalVariant', 'NumberInput', 'NumberInputProps', 'PageSection', 'PageSectionVariants',
  'Pagination', 'Popover', 'Radio', 'SearchInput', 'Skeleton', 'Spinner', 'Stack', 'StackItem',
  'Switch', 'Tab', 'Tabs', 'TabContent', 'Text', 'TextArea', 'TextContent', 'TextVariants', 'Title',
  'Tooltip', 'TreeView', 'TreeViewDataItem', 'Breadcrumb', 'BreadcrumbItem', 'Flex', 'FlexItem',
  'Divider', 'Bullseye', 'DrawerActions', 'DrawerCloseButton', 'DrawerHead', 'DrawerPanelContent',
  'TabTitleText', 'DescriptionList', 'DescriptionListDescription', 'DescriptionListGroup', 
  'DescriptionListTerm'
]);

// Known table component mappings
const REACT_TABLE_COMPONENTS = new Set([
  'Table', 'TableHeader', 'TableBody', 'TableVariant', 'Tbody', 'Td', 'Th', 'Thead', 'Tr',
  'ActionsColumn', 'ExpandableRowContent', 'RowWrapper', 'RowWrapperProps', 'ThProps',
  'ISortBy', 'OnSort', 'compoundExpand', 'sortable', 'cellWidth', 'nowrap', 'info'
]);

function transformPatternFlyImports(content, filePath) {
  let modified = content;
  let hasChanges = false;

  // Pattern to match ONLY global PatternFly imports (not already converted dynamic/absolute paths)
  const importRegex = /^import\s+(?:{([^}]+)}|\*\s+as\s+\w+|\w+)\s+from\s+['"](@patternfly\/(?:react-core|react-icons|react-table))['"];?$/gm;
  
  let match;
  const imports = [];
  
  // Collect all PatternFly imports
  while ((match = importRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, packageName] = match;
    imports.push({
      fullMatch,
      namedImports: namedImports ? namedImports.trim() : null,
      packageName,
      startIndex: match.index,
      endIndex: match.index + fullMatch.length
    });
  }

  // Process imports in reverse order to avoid index shifting
  for (let i = imports.length - 1; i >= 0; i--) {
    const importInfo = imports[i];
    const { fullMatch, namedImports, packageName } = importInfo;

    if (!namedImports) continue; // Skip default or namespace imports

    const components = namedImports.split(',').map(c => c.trim());
    let newImports = [];

    if (packageName === '@patternfly/react-core') {
      // Convert react-core components to dynamic imports
      for (const component of components) {
        if (REACT_CORE_COMPONENTS.has(component)) {
          newImports.push(`import { ${component} } from '@patternfly/react-core/dist/dynamic/components/${component}';`);
        } else {
          // Keep unknown components with global import (might be types/interfaces)
          console.warn(`Unknown react-core component: ${component} in ${filePath}`);
          newImports.push(`import { ${component} } from '@patternfly/react-core';`);
        }
      }
      hasChanges = true;
    } else if (packageName === '@patternfly/react-table') {
      // Convert react-table components to dynamic imports
      for (const component of components) {
        if (REACT_TABLE_COMPONENTS.has(component)) {
          if (['compoundExpand', 'sortable', 'cellWidth', 'nowrap', 'info'].includes(component)) {
            // These are utility functions, keep them as global imports for now
            newImports.push(`import { ${component} } from '@patternfly/react-table';`);
          } else {
            newImports.push(`import { ${component} } from '@patternfly/react-table/dist/dynamic/components/${component}';`);
          }
        } else {
          console.warn(`Unknown react-table component: ${component} in ${filePath}`);
          newImports.push(`import { ${component} } from '@patternfly/react-table';`);
        }
      }
      hasChanges = true;
    } else if (packageName === '@patternfly/react-icons') {
      // Convert react-icons to absolute path default imports
      for (const component of components) {
        if (component.endsWith('Icon')) {
          const iconName = toKebabCase(component);
          newImports.push(`import ${component} from '@patternfly/react-icons/dist/js/icons/${iconName}';`);
        } else {
          console.warn(`Non-icon import from react-icons: ${component} in ${filePath}`);
          newImports.push(`import { ${component} } from '@patternfly/react-icons';`);
        }
      }
      hasChanges = true;
    }

    if (newImports.length > 0) {
      // Replace the original import with new imports
      const replacement = newImports.join('\n');
      modified = modified.substring(0, importInfo.startIndex) + 
                replacement + 
                modified.substring(importInfo.endIndex);
    }
  }

  return { content: modified, hasChanges };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = transformPatternFlyImports(content, filePath);
    
    if (result.hasChanges) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✓ Converted imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  let pattern = 'src/**/*.{ts,tsx,js}';
  
  if (args.length > 0) {
    // Allow specifying custom file patterns
    pattern = args[0];
  }

  console.log('🔄 Converting PatternFly imports to use dynamic/absolute paths...');
  console.log(`Pattern: ${pattern}`);

  const files = glob.sync(pattern, { 
    ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'] 
  });
  
  console.log(`Found ${files.length} files to process`);

  let convertedCount = 0;
  for (const file of files) {
    if (processFile(file)) {
      convertedCount++;
    }
  }

  console.log(`\n✅ Conversion complete!`);
  console.log(`📊 Converted ${convertedCount} out of ${files.length} files`);
  
  if (convertedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run `npm run build` to verify everything compiles');
    console.log('2. Run `npm run lint:js` to check for any linting issues');
    console.log('3. Test the application to ensure functionality is preserved');
  }
}

if (require.main === module) {
  main();
}

module.exports = { transformPatternFlyImports };