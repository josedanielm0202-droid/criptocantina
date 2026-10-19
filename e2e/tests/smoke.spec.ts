import { test, expect } from "@playwright/test"

// Smoke tests for the Cripto Cantina guestbook UI. No chain or wallet
// interaction required (the list may be empty or unreachable offline).

test("home page mounts", async ({ page }) => {
	const response = await page.goto("/")
	expect(response?.ok()).toBeTruthy()
	await expect(page.locator("body")).toBeVisible()
})

test("wallet connect button is present", async ({ page }) => {
	await page.goto("/")
	await expect(
		page
			.getByRole("button", { name: /conectar wallet|connect wallet/i })
			.first(),
	).toBeVisible()
})

test("guestbook form and contract id are present", async ({ page }) => {
	await page.goto("/")
	await expect(page.locator("textarea#mensaje")).toBeAttached()
	await expect(
		page
			.getByText("CCPGEQF44OMJGJWF7RV7PZA2XKUD2GCVH75A62FYHCBEKHL46UZQ5E3V")
			.first(),
	).toBeAttached()
})

test("language switch toggles to English and is remembered", async ({
	page,
}) => {
	await page.goto("/")
	await page.getByRole("switch").click()
	await expect(page.locator("html")).toHaveAttribute("lang", "en")
	await page.reload()
	await expect(page.locator("html")).toHaveAttribute("lang", "en")
	await expect(
		page.getByRole("button", { name: /connect wallet/i }).first(),
	).toBeVisible()
})

test("help panel opens with the FAQ", async ({ page }) => {
	await page.goto("/")
	await page.locator(".help-btn").click()
	await expect(page.getByRole("dialog")).toBeVisible()
	await expect(page.locator(".faq__q").first()).toBeVisible()
})

test("intro can be skipped and lands on the hero", async ({ page }) => {
	await page.goto("/")
	await page.locator(".dive__skip").click()
	await expect(page.locator("html")).not.toHaveClass(/in-intro/, {
		timeout: 6000,
	})
	await expect(page.locator(".dive")).toHaveClass(/dive--inside/)
})
