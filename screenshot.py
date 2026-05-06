from playwright.sync_api import sync_playwright
import time

def take_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 800})
        
        # Navigate to the frontend app
        page.goto("http://localhost:3000/")
        
        # Wait for data to populate (30 seconds = ~3 ciclos de ping)
        print("Aguardando 30 segundos para a coleta de metricas...")
        time.sleep(30)
        
        # Save screenshot
        page.screenshot(path="dashboard.png")
        print("Screenshot salvo como dashboard.png!")
        browser.close()

if __name__ == "__main__":
    take_screenshot()
