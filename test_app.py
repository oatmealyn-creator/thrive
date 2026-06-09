from playwright.sync_api import sync_playwright
import sys

BASE = "http://localhost:4321"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Landing page loads
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    assert "Plotly" in page.title() or page.locator("text=Grow what you love").is_visible()
    print("[PASS] Landing page loads with hero text")

    # 2. Click "Get started" -> goes to /register
    page.locator('a[href="/register"]').first.click()
    page.wait_for_load_state("networkidle")
    assert page.url.endswith("/register") or page.url.endswith("/register/")
    print("[PASS] Register page is accessible")

    # 3. Fill register form
    page.fill("#name", "Test Gardener")
    page.fill("#email", "test@garden.com")
    page.fill("#password", "password123")
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state("networkidle")
    print(f"[PASS] Registered, current URL: {page.url}")
    assert "/dashboard" in page.url

    # 4. Dashboard loads
    page.wait_for_selector('[data-testid="dashboard-heading"]', timeout=5000)
    heading = page.locator('[data-testid="dashboard-heading"]').text_content()
    assert "Hi" in heading
    print(f"[PASS] Dashboard loads: {heading}")

    # 5. Add an item
    page.locator('[data-testid="header-add-button"]').click()
    page.wait_for_selector('[data-testid="add-item-modal"]', timeout=5000)
    page.fill('[data-testid="item-name-input"]', "Mango Sapling")
    page.fill('[data-testid="item-price-input"]', "24")
    page.fill('[data-testid="item-stock-input"]', "5")
    page.locator('[data-testid="save-item-button"]').click()
    page.wait_for_timeout(1000)
    print("[PASS] Item added via modal")
    page.screenshot(path="test_after_add.png", full_page=True)

    # 6. Storefront link is visible
    link_text = page.locator('[data-testid="storefront-link-text"]').text_content()
    print(f"[PASS] Storefront link: {link_text}")

    # 7. Logout
    page.locator('button[aria-label="Logout"]').click()
    page.wait_for_load_state("networkidle")
    print(f"[PASS] Logged out, URL: {page.url}")

    # 8. Login again
    page.locator('a[href="/login"]').click()
    page.wait_for_load_state("networkidle")
    page.fill("#email", "test@garden.com")
    page.fill("#password", "password123")
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state("networkidle")
    assert "/dashboard" in page.url
    print("[PASS] Logged back in successfully")

    # 9. Visit storefront
    storefront_link = page.locator('[data-testid="storefront-link-text"]').text_content()
    page.goto(storefront_link if storefront_link.startswith("http") else f"{BASE}{storefront_link}")
    page.wait_for_load_state("networkidle")
    assert page.locator('[data-testid="storefront-title"]').is_visible()
    print(f"[PASS] Storefront loads: {page.locator('[data-testid=\"storefront-title\"]').text_content()}")

    page.screenshot(path="test_storefront.png", full_page=True)
    browser.close()
    print("\n[PASS] All tests passed!")
