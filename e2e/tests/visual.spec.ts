import { test, expect } from "@playwright/test"

// Visual guard for the intro (first frame of the dive). Create/refresh the baseline with
// `npx playwright test tests/visual.spec.ts --update-snapshots`.

test("home page visual", async ({ page }) => {
	await page.goto("/")
	await expect(
		page
			.getByRole("button", { name: /conectar wallet|connect wallet/i })
			.first(),
	).toBeVisible()
	await expect(page).toHaveScreenshot("home.png", {
		animations: "disabled",
		mask: [page.locator(".dive__bubble-wrap")],
	})
})
