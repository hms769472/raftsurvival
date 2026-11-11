import { test, expect } from '@playwright/test';

// RAFT-606 acceptance: start → craft → save → load.
//
// The game is a single React route whose menu / HUD / overlays are plain DOM
// buttons, so the critical run lifecycle can be driven end-to-end without
// poking at the canvas internals.
test('start, craft, save and load a run', async ({ page }) => {
  await page.goto('/');

  // 1. START — a fresh run from the main menu.
  await page.getByRole('button', { name: 'PLAY' }).click();

  // The first play shows the tutorial overlay; dismiss it if present.
  await page
    .getByRole('button', { name: 'SKIP' })
    .click({ timeout: 4000 })
    .catch(() => {});

  await expect(page.locator('canvas')).toBeVisible();

  // 2. CRAFT — the HUD craft button opens (and closes) the crafting menu.
  await page.getByTitle('Craft').first().click();
  await expect(page.getByText('CRAFTING', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'CLOSE' }).click();
  await expect(page.getByText('CRAFTING', { exact: true })).toHaveCount(0);

  // 3. SAVE — pause, then write slot 1.
  await page.getByRole('button', { name: /Pause/ }).click();
  await page.getByRole('button', { name: /SAVE GAME/ }).click();
  await page.getByRole('button', { name: 'SAVE HERE' }).first().click();

  const saved = await page.evaluate(() => localStorage.getItem('raftSave_1'));
  expect(saved).toBeTruthy();
  expect(JSON.parse(saved as string).version).toBeGreaterThan(0);

  // 4. LOAD — restore the slot from the pause menu.
  await page.getByRole('button', { name: /Pause/ }).click();
  await page.getByRole('button', { name: /LOAD GAME/ }).click();
  await page.getByRole('button', { name: 'LOAD' }).first().click();

  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: /Pause/ })).toBeVisible();
});
