const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
    await page.goto('/app.html');

    await page.waitForSelector('.CodeMirror', {timeout: 10000});
    await page.waitForSelector('#sidebar-tree', {timeout: 5000});
});

test('should load files', async ({ page }) => {
    await page.evaluate(() => {
        window.getRootDirHandle = async function() {
            // Your mock code here
            const opfsRoot = await navigator.storage.getDirectory();
            const testDir = await opfsRoot.getDirectoryHandle('test-files', { create: true });

            const testFiles = [
                { name: 'README.md', content: 'Hello world' },
                { name: 'Notes.md', content: '**Bold text**' }
            ];

            for (const fileData of testFiles) {
                try {
                    await testDir.getFileHandle(fileData.name);
                } catch (error) {
                    const fileHandle = await testDir.getFileHandle(fileData.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileData.content);
                    await writable.close();
                }
            }

            return testDir;
        };
    });

    await page.evaluate(() => {
        init(document.getElementById("editor"));
    });

    // await page.pause();
});

test('create new', async ({ page }) => {
    await page.evaluate(() => {
        window.getRootDirHandle = async function() {
            // Your mock code here
            const opfsRoot = await navigator.storage.getDirectory();
            const testDir = await opfsRoot.getDirectoryHandle('test-files', { create: true });

            const testFiles = [
                { name: 'README.md', content: 'Hello world' },
                { name: 'Notes.md', content: '**Bold text**' }
            ];

            for (const fileData of testFiles) {
                try {
                    await testDir.getFileHandle(fileData.name);
                } catch (error) {
                    const fileHandle = await testDir.getFileHandle(fileData.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileData.content);
                    await writable.close();
                }
            }

            return testDir;
        };
    });

    await page.evaluate(() => {
        init(document.getElementById("editor"));
    });

    await page.click('#new-file');
    await page.waitForTimeout(100);
    await page.keyboard.type('New file');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.keyboard.type('content');
    await page.waitForTimeout(700);

    await page.click('#sidebar >> text=New file');
    await page.waitForTimeout(100);
    const codeMirrorContent = await page.evaluate(() => {
        const cm = document.querySelector('.CodeMirror').CodeMirror;
        return cm.getValue();
    });
    expect(codeMirrorContent).toBe("# New file\ncontent\n");
});

test('create new lower case', async ({ page }) => {
    await page.evaluate(() => {
        window.getRootDirHandle = async function() {
            // Your mock code here
            const opfsRoot = await navigator.storage.getDirectory();
            const testDir = await opfsRoot.getDirectoryHandle('test-files', { create: true });

            const testFiles = [
                { name: 'README.md', content: 'Hello world' },
                { name: 'Notes.md', content: '**Bold text**' }
            ];

            for (const fileData of testFiles) {
                try {
                    await testDir.getFileHandle(fileData.name);
                } catch (error) {
                    const fileHandle = await testDir.getFileHandle(fileData.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(fileData.content);
                    await writable.close();
                }
            }

            return testDir;
        };
    });

    await page.evaluate(() => {
        init(document.getElementById("editor"));
    });

    await page.click('#new-file');
    await page.waitForTimeout(100);
    await page.keyboard.type('another file');
    await page.waitForTimeout(100);
    await page.keyboard.press('Enter');
    await page.keyboard.type('content');
    await page.waitForTimeout(700);

    await page.click('#sidebar >> text=another file');
    await page.waitForTimeout(100);
    const codeMirrorContent = await page.evaluate(() => {
        const cm = document.querySelector('.CodeMirror').CodeMirror;
        return cm.getValue();
    });
    expect(codeMirrorContent).toBe("# Another file\ncontent\n");

    await page.pause();
});