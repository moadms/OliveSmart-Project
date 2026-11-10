import asyncio
import sys
from playwright.async_api import async_playwright

async def main():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(channel='chrome', headless=True)
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})

            print('1. Opening application on http://localhost:3000...')
            await page.goto('http://localhost:3000', wait_until='networkidle')
            await asyncio.sleep(2)

            print('2. Checking if #tabScientificReport exists...')
            btn = await page.query_selector('#tabScientificReport')
            print('Button found:', btn is not None)

            if btn:
                await btn.click()
                await asyncio.sleep(2)

                is_visible = await page.is_visible('#scientificReportContainer')
                print(f'Scientific report container visible: {is_visible}')

                await page.screenshot(path='C:/Users/hp/Downloads/scientific_report_1_header.png')
                print('Saved scientific_report_1_header.png')

                # Scroll inside the scientificReportContainer
                await page.evaluate('document.getElementById("scientificReportContainer").scrollTo(0, 900)')
                await asyncio.sleep(1)
                await page.screenshot(path='C:/Users/hp/Downloads/scientific_report_2_graphs.png')
                print('Saved scientific_report_2_graphs.png')

                await page.evaluate('document.getElementById("scientificReportContainer").scrollTo(0, 2200)')
                await asyncio.sleep(1)
                await page.screenshot(path='C:/Users/hp/Downloads/scientific_report_3_confusion_matrix.png')
                print('Saved scientific_report_3_confusion_matrix.png')

                # Click Back to Map
                back_btn = await page.query_selector('button:has-text("Revenir à la Carte Cadastrale")')
                if back_btn:
                    await back_btn.click()
                    await asyncio.sleep(2)
                    map_visible = await page.is_visible('#leafletMap')
                    print(f'Map visible again: {map_visible}')
                    await page.screenshot(path='C:/Users/hp/Downloads/scientific_report_4_back_to_map.png')
                    print('Saved scientific_report_4_back_to_map.png')

            await browser.close()
            print('Finished successfully!')
    except Exception as e:
        print('Error:', e, file=sys.stderr)
        import traceback
        traceback.print_exc()

asyncio.run(main())
