from playwright.sync_api import sync_playwright
import base64

# Simple 1x1 green pixel image as base64 for testing
# In a real scenario, you'd use an actual plant image
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:4321')
    page.wait_for_load_state('networkidle')
    
    # Capture any console errors
    logs = []
    page.on('console', lambda msg: logs.append(f"{msg.type}: {msg.text}"))
    page.wait_for_timeout(3000)
    
    page.screenshot(path='C:\\Users\\Yaseen\\Documents\\vscode\\plotly\\screenshot_after_fix.png', full_page=True)
    
    print("Screenshot saved to screenshot_after_fix.png")
    print("Console logs:")
    for log in logs:
        print(log)
    
    browser.close()
