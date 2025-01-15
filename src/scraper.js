require("dotenv").config();
const { chromium: puppeteer } = require("playwright");
const express = require("express");
const app = express();
const port = 3000;

async function scrapeSwisscomMobileSubscriptions() {
    const browser = await puppeteer.launch({
        // Keep the headless property false to see the browser in action
        headless: false,
        // Comment the executablePath if you want to use the default browser "Chromium"
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = process.env.TARGET_URL || "https://www.swisscom.ch";

    try {
        let returnData = {};

        await page.goto(url);
        returnData.pageTitle = await page.title();
        await page.waitForTimeout(1000);

        // Accept cookies
        await page.waitForSelector("#onetrust-accept-btn-handler");
        await page.click("#onetrust-accept-btn-handler");
        await page.waitForTimeout(1000);

        // Navigate to Mobile subscriptions
        await page.click('a.link:has-text("Mobile")');
        await page.waitForTimeout(1000);
        await page.click('a.link:has-text("Mobile subscriptions")');
        await page.waitForTimeout(500);

        // Close new feature modal if it appears
        const closeButton = await page.waitForSelector("#slot-close");
        if (closeButton) {
            await page.click("#slot-close");
        }
        await page.waitForTimeout(1000);

        // Extract main title and subtitle
        returnData.title = (await page.textContent("h1.sc-navy.text-d2")).trim();
        returnData.subtitle = (await page.textContent('#text-26e79c84bf p[style*="text-align: center"]')).trim();

        // Function to extract offer data
        const extractOfferData = async (selector) => {
            const headerText = (await page.textContent(`${selector} p.sc-navy.margin-bottom-1`)).trim();
            const offerText = (await page.textContent(`${selector} p.text-h3.sc-navy.margin-bottom-1.font.font--bold`)).trim();
            const linkText = (await page.textContent(`${selector} a.icon-004-arrow-right`)).trim();
            const linkUrl = url + (await page.getAttribute(`${selector} a.icon-004-arrow-right`, "href")).trim();

            return { headerText, offerText, linkText, linkUrl };
        };

        // Extract data from the two divs
        returnData.offers = [
            await extractOfferData("#text-2aaa1ebc2a"),
            await extractOfferData("#text-36b2fb23f2"),
        ];

        await page.waitForTimeout(1000);

        // Extract package options
        const packagesOptions = await page.$$eval(".tablist button", (buttons) =>
            buttons.map((button) => button.querySelector(".label").textContent.trim())
        );

        // Extract card data
        let cardData = await page.$$eval("ui-kit-product-tile", (cards) => {
            return cards.map((card) => {
                const title = card.querySelector(".product-tile__title")?.textContent.trim() || null;
                const features = {};
                const featureSections = card.querySelectorAll(".product-description");
                let category = "Surfing";

                featureSections.forEach((feature) => {
                    const featureCategories = ["Surfing", "Calling", "Multi Device"];
                    const featureCategory = feature.previousElementSibling?.textContent.trim() || "";

                    if (featureCategories.includes(featureCategory)) {
                        category = featureCategory;
                    }

                    const featureText = feature.textContent.trim();
                    if (!features[category]) {
                        features[category] = [];
                    }
                    features[category].push(featureText);
                });

                const strikethroughPrice = card.querySelector(".product-tile__footer ui-kit-product-strikethrough-price")?.textContent.trim() || null;
                const originalPrice = card.querySelector(".product-tile__footer ui-kit-product-strikethrough-price ui-kit-price")?.getAttribute("data-cy-price-amount") || null;
                const discountedPrice = card.querySelector(".product-price")?.getAttribute("data-cy-price-amount") || null;
                const bestSeller = card.querySelector(".label")?.textContent.trim() === "Bestseller" || false;

                return { title, features, strikethroughPrice, originalPrice, discountedPrice, bestSeller };
            });
        });

        // Get extra data for each card
        const extraDataBaseUrl = "https://www.swisscom.ch/content/experience-fragments/swisscom/en/res/produkte/detailpages/mobile/";
        const updatedCardData = await Promise.all(
            cardData.map(async (card) => {
                const cartFormattedTitle = card.title.toLowerCase().replaceAll(" ", "-") === "blue-kids-watch"
                    ? "kids-mobile-watch-new"
                    : card.title.toLowerCase().replaceAll(" ", "-");
                const fullUrl = extraDataBaseUrl + cartFormattedTitle + ".html";

                const page = await browser.newPage();
                await page.goto(fullUrl);
                await page.waitForTimeout(1000);

                const texts = await page.textContent("body");
                await page.close();

                return { ...card, extraData: texts.replace(/\n\s*/g, " ") };
            })
        );

        // Filter cards based on the package options
        returnData.packagesOptions = packagesOptions.map((option) => {
            if (option === "blue Abos") {
                const filteredCards = updatedCardData.filter((card) => card.strikethroughPrice !== "");
                return { title: option, cards: filteredCards };
            } else if (option === "basic Abos") {
                const filteredCards = updatedCardData.filter((card) => card.title.includes("basic"));
                return { title: option, cards: filteredCards };
            } else if (option === "Kids Abos") {
                const filteredCards = updatedCardData.filter((card) => card.title.includes("Kids"));
                return { title: option, cards: filteredCards };
            } else {
                return { title: option, cards: [] };
            }
        });

        await browser.close();
        return returnData;

    } catch (error) {
        console.error("Error scraping the page:", error);
        return { error: "Failed to scrape the page" };
    } finally {
        console.log("Press Ctrl+C to exit...");
        await browser.close();
    }
}

// API route
app.get("/api/scrape-swisscom-mobile-subscriptions", async (req, res) => {
    try {
        const data = await scrapeSwisscomMobileSubscriptions();
        res.status(200).json(data);
    } catch (error) {
        console.error("Error scraping data:", error);
        res.status(500).json({ error: "Failed to scrape data" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
