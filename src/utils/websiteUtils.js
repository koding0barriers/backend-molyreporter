const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

async function getWebsiteContent(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const websiteContent = await page.content();
  await browser.close();
  return websiteContent;
}

function isSameDomain(baseDomain, url) {
  const urlDomain = new URL(url).hostname;
  const base = new URL(baseDomain).hostname;
  return base === urlDomain;
}

function extractChildURLs(websiteContent, baseUrl) {
  const childURLs = [];
  const $ = cheerio.load(websiteContent);

  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (href) {
      const absoluteURL = new URL(href, baseUrl).toString();
      childURLs.push(absoluteURL);
    }
  });
  return childURLs;
}

function countSlashes(str) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '/') {
      count++;
    }
  }
  return count;
}

function extractBaseUrl(fullUrl) {
  const parsedUrl = new URL(fullUrl);
  return parsedUrl.origin;
}

module.exports = {
  extractChildURLs,
  isSameDomain,
  getWebsiteContent,
  countSlashes,
  extractBaseUrl,
};
