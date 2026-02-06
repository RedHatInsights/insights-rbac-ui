/**
 * Page Object for ManagedWorkspaceSelector Component
 *
 * Encapsulates all interactions with the workspace tree selector component.
 * This is a reusable component that can appear in various contexts (modals, wizards, etc.)
 *
 * Usage:
 * ```typescript
 * // In a page object
 * class CreateWorkspacePage {
 *   readonly parentSelector: ManagedWorkspaceSelectorComponent;
 *
 *   constructor(page: Page) {
 *     this.parentSelector = new ManagedWorkspaceSelectorComponent(page);
 *   }
 * }
 *
 * // In a test
 * await createWorkspacePage.parentSelector.selectWorkspaceComplete('Production', 'Root');
 * ```
 */

import { type Locator, type Page, expect } from '@playwright/test';
import { E2E_TIMEOUTS } from '../../utils/timeouts';

export class ManagedWorkspaceSelectorComponent {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page, containerSelector?: string) {
    this.page = page;
    this.container = containerSelector ? page.locator(containerSelector) : page.locator('.rbac-c-workspace-selector-menu');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Locators
  // ═══════════════════════════════════════════════════════════════════════════

  get menuToggleButton(): Locator {
    return this.page.getByTestId('workspace-selector-toggle');
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
    return this.page.getByTestId('workspace-selector-confirm');
  }

  get loadingIndicator(): Locator {
    return this.treePanel.getByRole('progressbar');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions - Menu Toggle
  // ═══════════════════════════════════════════════════════════════════════════

  async open(): Promise<void> {
    await this.menuToggleButton.click();
    await expect(this.treePanel).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await expect(this.treePanel).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions - Search & Filter
  // ═══════════════════════════════════════════════════════════════════════════

  async search(searchTerm: string): Promise<void> {
    await expect(this.searchInput).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await this.searchInput.clear();
    await this.searchInput.fill(searchTerm);
    // Wait for tree to update after search filter
    await expect(this.treeView).toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    // Wait for tree to update after clearing filter
    await expect(this.treeView).toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
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
    await expect(toggle).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await toggle.click();
      // Wait for expanded state
      await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
    }
  }

  async collapseWorkspace(workspaceName: string): Promise<void> {
    const toggle = this.getWorkspaceToggle(workspaceName);
    await expect(toggle).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });

    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded === 'true') {
      await toggle.click();
      // Wait for collapsed state
      await expect(toggle).toHaveAttribute('aria-expanded', 'false', { timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
    }
  }

  async selectWorkspace(workspaceName: string): Promise<void> {
    const workspaceButton = this.getWorkspaceButton(workspaceName);
    await expect(workspaceButton).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
    await workspaceButton.click();
  }

  async confirmSelection(): Promise<void> {
    await expect(this.selectButton).toBeEnabled({ timeout: E2E_TIMEOUTS.BUTTON_STATE });
    await this.selectButton.click();
    await expect(this.treePanel).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Combined Actions (for common flows)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Complete flow: Open selector, optionally expand parent, select workspace, confirm
   */
  async selectWorkspaceByPath(workspaceName: string, parentWorkspace?: string): Promise<void> {
    await this.open();

    if (parentWorkspace) {
      await this.expandWorkspace(parentWorkspace);
    }

    await this.selectWorkspace(workspaceName);
    await this.confirmSelection();
  }

  /**
   * Search for workspace and select it
   */
  async searchAndSelect(searchTerm: string, workspaceName: string): Promise<void> {
    await this.open();
    await this.search(searchTerm);
    await this.selectWorkspace(workspaceName);
    await this.confirmSelection();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Assertions
  // ═══════════════════════════════════════════════════════════════════════════

  async expectWorkspaceVisible(workspaceName: string): Promise<void> {
    await expect(this.getWorkspaceButton(workspaceName)).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async expectWorkspaceNotVisible(workspaceName: string): Promise<void> {
    await expect(this.getWorkspaceButton(workspaceName)).not.toBeVisible({ timeout: E2E_TIMEOUTS.DRAWER_ANIMATION });
  }

  async expectSelectedWorkspace(workspaceName: string): Promise<void> {
    await expect(this.menuToggleButton).toContainText(workspaceName);
  }

  async expectLoading(): Promise<void> {
    await expect(this.loadingIndicator).toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }

  async expectNotLoading(): Promise<void> {
    await expect(this.loadingIndicator).not.toBeVisible({ timeout: E2E_TIMEOUTS.TABLE_DATA });
  }
}
