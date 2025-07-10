const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
    await page.goto('/app.html');

    await page.waitForSelector('.CodeMirror', {timeout: 10000});
    await page.waitForSelector('#sidebar-tree', {timeout: 5000});
});

test('send message to chat', async ({ page }) => {
    await page.evaluate(() => {
        window.getRootDirHandle = async function() {
            const root = await navigator.storage.getDirectory();

            return root;
        };
    });


    await page.evaluate(() => {
        init(document.getElementById("editor"));
    });

    await page.waitForSelector('#chat');

    await page.keyboard.type('My message');
    await page.keyboard.press('Enter');

    await page.waitForSelector('.message');
    let content = await page.textContent('.message-content')
    expect(content).toBe('My message');
});
