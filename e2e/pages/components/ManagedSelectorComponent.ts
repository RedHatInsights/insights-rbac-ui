/**
 * Page Object for ManagedSelector Component
 *
 * Encapsulates all interactions with the ManagedSelector workspace tree component.
 * This is a reusable component that can appear in various contexts (modals, wizards, etc.)
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { waitForTreeExpand } from '../../utils/waiters';

export class ManagedSelectorComponent {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page, containerSelector?: string) {
    this.page = page;
    // If no container specified, use the default workspace selector menu
    this.container = containerSelector ? page.locator(containerSelector) : page.locator('.rbac-c-workspace-selector-menu');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get menuToggleButton(): Locator {
    return this.page.getByRole('button', { name: /select workspaces/i });
  }

  get treePanel(): Locator {
    return this.container;
  }

  get searchInput(): Locator {
    return this.treePanel.getByPlaceholder(/find a workspace by name/i);
  }

  get treeView(): Locator {
    return this.treePanel.locator('[role="tree"]');
  }

  get selectButton(): Locator {
    return this.page.getByRole('button', { name: /select workspace/i });
  }

  get loadingIndicator(): Locator {
    return this.treePanel.getByRole('progressbar');
  }

  get errorMessage(): Locator {
    return this.treePanel.getByText(/error|failed/i);
  }

  get emptyState(): Locator {
    return this.treePanel.getByText(/no workspaces found|no results/i);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions - Menu Toggle
  // ═══════════════════════════════════════════════════════════════════════════

  async openSelector(): Promise<void> {
    await this.menuToggleButton.click();
    await expect(this.treePanel).toBeVisible({ timeout: 5000 });
  }

  async closeSelector(): Promise<void> {
    // Click outside or use escape key
    await this.page.keyboard.press('Escape');
    await expect(this.treePanel).not.toBeVisible({ timeout: 3000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions - Search & Filter
  // ═══════════════════════════════════════════════════════════════════════════

  async searchWorkspaces(searchTerm: string): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: 5000 });
    await this.searchInput.clear();
    await this.searchInput.fill(searchTerm);
    // Wait a bit for the filter to apply
    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions - Tree Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  getWorkspaceNode(workspaceName: string): Locator {
    return this.treeView.getByText(workspaceName, { exact: false }).locator('xpath=ancestor::li').first();
  }

  getWorkspaceButton(workspaceName: string): Locator {
    return this.treeView.getByRole('button', { name: workspaceName });
  }

  getWorkspaceToggle(workspaceName: string): Locator {
    const node = this.getWorkspaceNode(workspaceName);
    return node.locator('.pf-v6-c-tree-view__node-toggle, .pf-c-tree-view__node-toggle').first();
  }

  async expandWorkspace(workspaceName: string): Promise<void> {
    const toggle = this.getWorkspaceToggle(workspaceName);
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Check if already expanded
    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await toggle.click();
      await waitForTreeExpand(this.page);
    }
  }

  async collapseWorkspace(workspaceName: string): Promise<void> {
    const toggle = this.getWorkspaceToggle(workspaceName);
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Check if already collapsed
    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded === 'true') {
      await toggle.click();
      await this.page.waitForTimeout(300);
    }
  }

  async selectWorkspace(workspaceName: string): Promise<void> {
    const workspaceButton = this.getWorkspaceButton(workspaceName);
    await expect(workspaceButton).toBeVisible({ timeout: 5000 });
    await workspaceButton.click();

    // Wait for the workspace to be marked as selected
    await this.page.waitForTimeout(300);
  }

  async confirmSelection(): Promise<void> {
    await expect(this.selectButton).toBeEnabled({ timeout: 3000 });
    await this.selectButton.click();

    // Wait for menu to close
    await expect(this.treePanel).not.toBeVisible({ timeout: 3000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Combined Actions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Complete flow: Open selector, optionally expand parent, select workspace, confirm
   */
  async selectWorkspaceComplete(workspaceName: string, parentWorkspace?: string): Promise<void> {
    await this.openSelector();

    if (parentWorkspace) {
      await this.expandWorkspace(parentWorkspace);
    }

    await this.selectWorkspace(workspaceName);
    await this.confirmSelection();
  }

  /**
   * Search for workspace and select it
   */
  async searchAndSelectWorkspace(searchTerm: string, workspaceName: string): Promise<void> {
    await this.openSelector();
    await this.searchWorkspaces(searchTerm);
    await this.selectWorkspace(workspaceName);
    await this.confirmSelection();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Verifications
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyWorkspaceVisible(workspaceName: string): Promise<void> {
    const workspaceButton = this.getWorkspaceButton(workspaceName);
    await expect(workspaceButton).toBeVisible({ timeout: 5000 });
  }

  async verifyWorkspaceNotVisible(workspaceName: string): Promise<void> {
    const workspaceButton = this.getWorkspaceButton(workspaceName);
    await expect(workspaceButton).not.toBeVisible({ timeout: 3000 });
  }

  async verifyWorkspaceSelected(workspaceName: string): Promise<void> {
    const node = this.getWorkspaceNode(workspaceName);
    const isSelected = await node.getAttribute('aria-selected');
    expect(isSelected).toBe('true');
  }

  async verifyWorkspaceExpanded(workspaceName: string): Promise<void> {
    const toggle = this.getWorkspaceToggle(workspaceName);
    const isExpanded = await toggle.getAttribute('aria-expanded');
    expect(isExpanded).toBe('true');
  }

  async verifyWorkspaceCollapsed(workspaceName: string): Promise<void> {
    const toggle = this.getWorkspaceToggle(workspaceName);
    const isExpanded = await toggle.getAttribute('aria-expanded');
    expect(isExpanded).toBe('false');
  }

  async verifyLoadingState(): Promise<void> {
    await expect(this.loadingIndicator).toBeVisible({ timeout: 5000 });
  }

  async verifyNotLoadingState(): Promise<void> {
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: 5000 });
  }

  async verifyErrorState(): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async verifyEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 5000 });
  }

  async verifyWorkspaceCount(expectedCount: number): Promise<void> {
    const workspaceButtons = this.treeView.getByRole('button');
    const count = await workspaceButtons.count();
    expect(count).toBe(expectedCount);
  }

  async verifySearchResultsCount(expectedCount: number): Promise<void> {
    await this.page.waitForTimeout(500); // Wait for filter to apply
    const visibleWorkspaces = this.treeView.getByRole('button');
    const count = await visibleWorkspaces.count();
    expect(count).toBeGreaterThanOrEqual(expectedCount);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Keyboard Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async navigateWithArrowDown(): Promise<void> {
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(100);
  }

  async navigateWithArrowUp(): Promise<void> {
    await this.page.keyboard.press('ArrowUp');
    await this.page.waitForTimeout(100);
  }

  async navigateWithArrowRight(): Promise<void> {
    await this.page.keyboard.press('ArrowRight');
    await this.page.waitForTimeout(100);
  }

  async navigateWithArrowLeft(): Promise<void> {
    await this.page.keyboard.press('ArrowLeft');
    await this.page.waitForTimeout(100);
  }

  async selectWithEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);
  }
}
