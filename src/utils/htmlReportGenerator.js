const fs = require('fs');
const stream = require('stream');
const path = require("path");
const he = require("he");
const {generateBarGraph, generateChart, generateDoughnutChart , formatDate} = require("./chartGenerator")



async function generate(scanResults) {
    const outputDir = path.join(__dirname, "output");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFilePath = path.join(outputDir, "scanResults.html");
    let scanResult = scanResults.scanResults[0];

    const imageData = fs.readFileSync(path.join(__dirname, '../../images/logo-placeholder.jpeg'));
    const base64Image = Buffer.from(imageData).toString('base64');
    const imgSrc = `data:image/jpeg;base64,${base64Image}`;
    const chart1 = await generateChart(parseFloat(scanResults.averageScore));
    const base64Image_chart1 = Buffer.from(chart1).toString('base64');
    const buffer1 = `data:image/jpeg;base64,${base64Image_chart1}`;
    const chart2 = await generateDoughnutChart(scanResults.impactStats, "Issues Breakdown by Impact");
    const base64Image_chart2 = Buffer.from(chart2).toString('base64');
    const buffer2 = `data:image/jpeg;base64,${base64Image_chart2}`;
    const chart3 = await generateBarGraph(scanResults.disabilitiesStats);
    const base64Image_chart3 = Buffer.from(chart3).toString('base64');
    const buffer3 = `data:image/jpeg;base64,${base64Image_chart3}`;
    const data = scanResults.tableData;
    const uniqueRuleIds = data.uniqueRuleIds;
    const urls = data.urls;
    const ruleScores = Array.from({ length: uniqueRuleIds.length }, () => 0);

    // Generate the table rows for URLs and count the violations for each rule
    let tableBodyHTML = urls.map(url => {
        let rowHTML = `
            <tr>
                <td>${url}</td>
        `;

        // Count violations for each rule
        uniqueRuleIds.forEach((ruleId, index) => {
            const isViolation = data.ruleToUrlsMap[ruleId] && data.ruleToUrlsMap[ruleId].includes(url);
            if (isViolation) {
                ruleScores[index]++;
            }
            rowHTML += `<td style="background-color: ${isViolation ? 'red' : 'green'}">${isViolation ? 'X' : ''}</td>`;
        });

        // Add the score for this URL
        rowHTML += `<td>${data.urlScores.find(item => item.url === url).score}</td>`;

        rowHTML += `</tr>`;
        return rowHTML;
    }).join('');

    // Generate the table header for rules
    const tableHeaderHTML = `
        <tr>
            <th rowspan="2">URL</th>
            <th colspan="${uniqueRuleIds.length}">Rules</th>
            <th rowspan="2">Scores</th>
        </tr>
        <tr>
            ${uniqueRuleIds.map(ruleId => `<th>${ruleId}</th>`).join('')}
        </tr>
    `;

    // Generate the table footer to display the count of violations
    const tableFooterHTML = `
        <tr>
            <td>Total Xs</td>
            ${ruleScores.map(score => `<td>${score}</td>`).join('')}
            <td></td> <!-- Placeholder for the scores column -->
        </tr>
    `;

    // Combine header, body, and footer to form the complete table HTML
    const tableHTML = `
        <table>
            <thead>${tableHeaderHTML}</thead>
            <tbody>${tableBodyHTML}</tbody>
            <tfoot>${tableFooterHTML}</tfoot>
        </table>
    `;

    let violationsHTML = `<div style="text-align: left;"><h2>Violations</h2>`;
    if (scanResults.violations.length > 0) {
        violationsHTML += `<ul>`;
        scanResults.violations.forEach(item => {
            violationsHTML += `
                <li>
                    <strong>Rule Id:</strong> ${item.id}
                    <br>
                    <br>
                    <strong>User impact:</strong> ${item.impact}
                    <br>
                    <br>
                    <strong>How to fix the problem:</strong> ${item.howToFix}
                    <br>
                    <br>
                    <strong>Why it matters:</strong> ${item.whyItMatters}
                    <br>
                    <br>
                    <strong>Rule Description:</strong> ${he.encode(item.description)}
                    <br>
                    <br>
                    <strong>Disabilities affected:</strong> ${item.disabilities.join(', ')}
                    <br>
                    <br>
                    <strong>WCAG Success Criteria:</strong> ${item.successCriteria}
                    <br>
                    <br>
                    <strong>Applicable Standard(s):</strong> ${item.tags.join(', ')}
                    <br>
                    <br>
                    <br>
                </li>`;
        });
        violationsHTML += `</ul>`;
    } else {
        violationsHTML += `<p>There are no violations to report!</p>`;
    }
    violationsHTML += `</div>`;

    const testEnvironmentData = scanResult.testEnvironment;

    let testEnvironmentHTML = `
        <div style="text-align: center;">
            <h2>Test Environment</h2>
            <table style="width: 50%; margin: 0 auto; border: 1px solid black; border-collapse: collapse;" cellpadding="5" cellspacing="0">
                <tr>
                    <th style="border: 1px solid black; padding: 8px;">Parameter</th>
                    <th style="border: 1px solid black; padding: 8px;">Value</th>
                </tr>
    `;

    Object.entries(testEnvironmentData).forEach(([key, value]) => {
        testEnvironmentHTML += `
                <tr>
                    <td style="border: 1px solid black; padding: 8px;">${key}</td>
                    <td style="border: 1px solid black; padding: 8px;">${value}</td>
                </tr>
        `;
    });

    testEnvironmentHTML += `
            </table>
        </div>
    `;

    let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Accessibility Scan Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                h1, h2, h3 {
                    text-align: center;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 0 auto;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
            <img src="${imgSrc}" alt="Logo">
                <h1>Accessibility Scan Report</h1>
                <table>
                    <tr>
                        <th>Field</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Website URL</td>
                        <td>${scanResults.baseUrl}</td>
                    </tr>
                    <tr>
                        <td>Client</td>
                        <td>${scanResults.audit.client}</td>
                    </tr>
                    <tr>
                        <td>Contact Name</td>
                        <td>${scanResults.audit.contact_name}</td>
                    </tr>
                    <tr>
                        <td>Contact Email</td>
                        <td>${scanResults.audit.contact_email}</td>
                    </tr>
                    <tr>
                        <td>Company Address</td>
                        <td>${scanResults.audit.company_address}</td>
                    </tr>
                    <tr>
                        <td>Rules Selected</td>
                        <td>All</td>
                    </tr>
                    <tr>
                        <td>Issues Identified</td>
                        <td>${scanResults.violations.length}</td>
                    </tr>
                    <tr>
                        <td>Date of Audit</td>
                        <td>${formatDate(scanResult.timestamp)}</td>
                    </tr>
                    <tr>
                        <td>Auditor</td>
                        <td>${scanResults.audit.auditor}</td>
                    </tr>
                </table>
                <p>Prepared By: 0 Barriers Foundation</p>
                <p>Date: ${formatDate(scanResult.timestamp)}</p>
                <h2>Executive Summary</h2>
                <p>An accessibility audit for Foundation website homepage was carried out on ${formatDate(scanResult.timestamp)} by 0 Barriers Foundation, a Non-Profit Organization dedicated to eliminating barriers for people with disabilities. The Foundation's mission is to create inclusive Web and Mobile experiences for people with disabilities. This document incorporates the findings relevant to digital accessibility barriers identified during the process.</p>
                <h2>Statistics</h2>
                <br>
                <img src="${buffer1}" alt="Chart1">
                <br>
                <br>
                <img src="${buffer2}" alt="Chart2">
                <br>
                <br>
                <img src="${buffer3}" alt="Chart2">
                <br>
                <h2>Pagewise Analysis</h2>
    `;

    htmlContent += tableHTML;

// Close the HTML content
htmlContent += `
            <h2>Audit Summary</h2>
            <p>In order for the tested URL to be accessible, Section 508 compliant and in line with WCAG 2.1 requirements, improvements need to be made in the following areas. Below shows a list of the problematic areas of concern categorized by impact:</p>
            </div>
        </body>
        </html>
`;

htmlContent += violationsHTML;
htmlContent += testEnvironmentHTML;

htmlContent += `
            </div>
        </body>
        </html>
`;

    fs.writeFileSync(outputFilePath, htmlContent);

    return outputFilePath;
}

module.exports = {
    generate,
};
