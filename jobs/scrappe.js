const puppeteer = require('puppeteer');

async function scrapeData() {
    const url = "https://baseballsavant.mlb.com/gamefeed?date=6/21/2024&gamePk=744841&chartType=pitch&leg[…]Filter=&resultFilter=&hf=winProbability&sportId=1&liveAb=";

    // Launch the browser
    const browser = await puppeteer.launch();
    // Create a new page
    const page = await browser.newPage();

    try {
        // Go to the URL and wait until the 'networkidle2' event triggers (no more than 2 network connections for at least 500 ms)
        await page.goto(url, { waitUntil: 'networkidle2' });
        // You can add other navigation steps here if you need to interact with the page

        // Perform the data extraction
        const result = await page.evaluate(() => {
            // Use document.querySelector to grab the data you need
            const mango = document.querySelector('#gamefeed_gamefeed');
            return mango ? mango.innerHTML : 'Element not found';
        });

        console.log(result);
    } catch (err) {
        console.error('Error:', err);
    }

    // Close the browser
    await browser.close();
}

scrapeData();
