from playwright.sync_api import sync_playwright

BASE = "http://localhost:4321"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)
    page.screenshot(path="debug_landing.png", full_page=True)

    content = page.content()
    print("PAGE CONTENT (first 2000 chars):")
    print(content[:2000])

    page.goto(f"{BASE}/register")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(3000)
    page.screenshot(path="debug_register.png", full_page=True)

    content2 = page.content()
    print("\nREGISTER PAGE CONTENT (first 2000 chars):")
    print(content2[:2000])

    browser.close()
