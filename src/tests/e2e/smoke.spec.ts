import { expect, test } from '@playwright/test'

test('home page is reachable', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /uma votação mais simples/i })).toBeVisible()
  await expect(page.locator('a.button-primary').first()).toHaveAttribute('href', '/votar')
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true)
})

test('administrative access redirects to login without a session', async ({ page }) => {
  await page.goto('/admin')

  await expect(page).toHaveURL(/\/admin\/login$/)
  await expect(page.getByRole('heading', { name: /entrar no painel/i })).toBeVisible()
})

test('public voter route loads the configured homologation election', async ({ page }) => {
  test.setTimeout(60000)
  await page.goto('/votar/arati-2026-2027')

  await expect(page.getByRole('heading', { name: /eleição da cipa arati/i })).toBeVisible({
    timeout: 30000,
  })
  await expect(page.getByLabel(/cpf/i)).toBeVisible({ timeout: 30000 })
})
