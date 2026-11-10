import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()

        print("[Test] Navigation vers http://localhost:3000...")
        await page.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(2)

        # 1. Vérifier la présence du bouton d'analyse
        analyze_btn = page.locator("button:has-text('Analyser la surface')").first
        print("[Test] Clic sur 'Analyser la surface choisie'...")
        await analyze_btn.click()

        # Attendre que les résultats s'affichent
        print("[Test] Attente de la fin de l'inférence...")
        await page.wait_for_selector("#resInferenceTime", timeout=15000)
        await asyncio.sleep(3)

        # Prendre une capture de la carte avec les boîtes calibrées
        screenshot_map_path = "C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/browser_verified_map_detection.png"
        await page.screenshot(path=screenshot_map_path, full_page=False)
        print(f"[Test] Capture de la carte enregistrée : {screenshot_map_path}")

        # 2. Ouvrir le Rapport Scientifique
        print("[Test] Clic sur l'onglet 'Rapport Scientifique & Benchmarks IA'...")
        scientific_btn = page.locator("button:has-text('Rapport Scientifique')").first
        await scientific_btn.click()
        await asyncio.sleep(2)

        # Capture du rapport scientifique
        screenshot_report_path = "C:/Users/hp/.gemini/antigravity/brain/efcba61c-8b15-4e8d-9584-13f518d67dbd/browser_verified_scientific_report.png"
        await page.screenshot(path=screenshot_report_path, full_page=False)
        print(f"[Test] Capture du rapport scientifique enregistrée : {screenshot_report_path}")

        await browser.close()
        print("[Test] Vérification terminée avec succès !")

if __name__ == '__main__':
    asyncio.run(main())
