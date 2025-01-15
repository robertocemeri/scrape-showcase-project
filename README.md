# Swisscom Mobile Subscriptions Scraper

This project is a web scraper designed to extract mobile subscription data from the Swisscom website. The extracted data includes offers, pricing details, and subscription features, which are structured into JSON and served via a REST API.  

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Installation](#installation)
4. [Usage](#usage)
5. [API Endpoint](#api-endpoint)
6. [Automation](#automation)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features

- Extracts detailed subscription information, including features and pricing.
- Handles dynamic content, modals, and navigations on the Swisscom website.
- Supports data categorization into packages (e.g., "blue Abos", "Kids Abos").
- Automates data scraping and serves data via a REST API.
- Scalable for integration with multiple data sources.

---

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Playwright**: Browser automation and scraping.
- **Express.js**: API framework.
- **dotenv**: Environment variable management.

---

## Installation
## Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. run `npx playwright install` to install latest browser
4. Create a `.env` file with the variable `TARGET_URL=https://www.swisscom.ch/`.

## Usage
Run the scraper using the command:
```bash
node src/scraper.js