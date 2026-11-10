import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        browser = p.chromium.launch(
            executable_path=edge_path,
            headless=True,
            args=['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
        )
        context = browser.new_context(viewport={'width': 1400, 'height': 900})
        page = context.new_page()

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(2)

        # Trigger analysis
        btn = page.locator("button:has-text('Lancer l\\'analyse'), button:has-text('Relancer')").first
        btn.click()
        print("Clicked button, waiting for detection...")
        page.wait_for_function("() => !document.body.innerText.includes('-- oliviers')", timeout=15000)
        time.sleep(2)

        # Capture result
        page.screenshot(path="C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/new_area_perfect_clean.png")
        print("Captured new_area_perfect_clean.png")

        map_el = page.locator("#map, .leaflet-container").first
        map_el.screenshot(path="C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/new_area_map_detail.png")
        print("Captured new_area_map_detail.png")

        browser.close()
        print("Browser test completed successfully!")

if __name__ == '__main__':
    run()
