const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require("path");

const {generateBarGraph, generateChart, generateDoughnutChart , formatDate} = require("./chartGenerator")

function formatIdToReadableString(id) {
    // Split the id on hyphen
    const words = id.split('-');
    
    // Capitalize the first letter of each word and join them with a space
    const formattedString = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return formattedString;
  }

// Function to draw a triangle
function drawTriangle(doc, x1, y1, x2, y2, x3, y3) {
    doc.moveTo(x1, y1)
       .lineTo(x2, y2)
       .lineTo(x3, y3)
       .lineTo(x1, y1);
}


async function generate(scanResults) {

    return new Promise(async (resolve, reject) => {
        const outputDir = path.join(__dirname, "output");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Define the file path 
        const outputFilePath = path.join(outputDir, "scanResults.pdf");

        let doc = new PDFDocument();

        // Pipe the document to a file
        const fileStream = fs.createWriteStream(outputFilePath);
        doc.pipe(fileStream);


        doc.image('./images/logo-placeholder.jpeg', doc.page.width / 2 - 125, doc.y, { // Adjusted positioning
            fit: [250, 250],
            align: 'center'
        }).moveDown(3);

        // Styled Document Title
        doc.fontSize(25).font('Times-Bold').text('Accessibility Scan Report', {
            align: 'center'
        }).moveDown();
        let scanResult = scanResults.scanResults[0];
        console.log(scanResults.scanResults[0])

        const audit_data = {
            "Website URL": scanResults.baseUrl,
            "Client": scanResults.audit.client,
            "Contact Name": scanResults.audit.contact_name, 
            "Contact Email": scanResults.audit.contact_email, 
            "Company Address": scanResults.audit.company_address, 
            "Rules Selected": "All", //Placeholder
            "Issues Identified": `${scanResults.violations.length}`,
            "Date of Audit": `${formatDate(scanResult.timestamp)}`,
            "Auditor": scanResults.audit.auditor
        };

        let y = doc.y;
        const xLabel = 50;
        const xValue = 200;
        const rowHeight = 25;

        Object.entries(audit_data).forEach(([key, value]) => {
            doc.rect(xLabel, y, 150, rowHeight).stroke();
            doc.rect(xValue, y, 330, rowHeight).stroke();
            doc.font('Times-Roman').fontSize(14).text(key, xLabel + 5, y + rowHeight / 4);
            doc.font('Times-Bold').fontSize(14).text(value, xValue + 20, y + rowHeight / 4);
            y += rowHeight;
        });

        doc.moveDown();


        // Scan Request ID and Score
        doc.font('Times-Roman').fillColor('black').fontSize(14).text('Prepared By: O Barriers Foundation', 50);
        doc.text(`Date: ${formatDate(scanResult.timestamp)}`);
        doc.moveDown();

        doc.font('Times-Bold').fontSize(18).text('Executive Summary').moveDown(1);


        doc.font('Times-Roman').fontSize(14).text(`An accessibility audit for Foundation website homepage was carried out on ${formatDate(scanResult.timestamp)} by 0 Barriers Foundation, a Non-Profit Organization dedicated toeliminating barriers for people with disabilities. The Foundation's mission is to create inclusiveWeb and Mobile experiences for people with disabilities. This document incorporates thefindings relevant to digital accessibility barriers identified during the process.`);

        doc.addPage();

        // Generate the charts and add to the PDF
        doc.font('Times-Bold').fontSize(18).text('Statistics').moveDown();

        const buffer1 = await generateChart(parseFloat(scanResults.averageScore));

        doc.image(buffer1, { align: 'center' });
        doc.moveDown();

        if (scanResults.violations.length > 0) {
            const buffer2 = await generateDoughnutChart(scanResults.impactStats, "Issues Breakdown by Impact");

            doc.image(buffer2, { align: 'center' });
            doc.moveDown();

            doc.addPage();

            const buffer3 = await generateBarGraph(scanResults.disabilitiesStats);

            doc.image(buffer3, { align: 'center' });



            doc.addPage();


            //Audit Summary
            doc.font('Times-Bold').fontSize(18).text('Audit Summary');
            doc.moveDown();
            doc.font('Times-Roman').fontSize(14).text(`In order for the tested URL(s) to be accessible, Section 508 compliant and in line with WCAG 2.1 requirements, improvements need to be made in the following areas. Below shows a list of the problematic areas of concern categorized by impact:`);
            doc.moveDown();
            let temp = doc.x
            scanResults.impactStats.forEach(item => {
                if (item.ids.length > 0) {
                    doc.fontSize(14).font('Times-Bold')
                        .text(`${item.category}`, temp, doc.y);
                    doc.moveDown();
                    let indent = 10;
                    let bulletRadius = 2;
                    let x = 100
                    item.ids.forEach(id => {
                        y = doc.y
                        doc.circle(x, y + 5, bulletRadius).fill();
                        doc.font('Times-Roman').text(id, x + indent, y);
                    });
                    doc.moveDown();

                }
            });
        }

    
        doc.addPage();


        // Violations
        doc.font('Times-Bold').fontSize(18).text('Violations').moveDown();
        if (scanResults.violations.length > 0) {
            scanResults.violations.forEach(item => {
                doc.fontSize(14).font('Times-Bold')
                    .text('Rule Id: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.id}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('User impact: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.impact}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('How to fix the problem: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.howToFix}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('Why it matters: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.whyItMatters}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('Rule Description: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.description}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('Disabilities affected: ', { continued: true })
                    .font('Times-Roman')
                const disabilities = item.disabilities.join(', ');
                doc.text(disabilities, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('WCAG Success Criteria: ', { continued: true })
                    .font('Times-Roman')
                    .text(`${item.successCriteria}`, { continued: false });
                doc.moveDown();
                doc.font('Times-Bold')
                    .text('Applicable Standard(s): ', { continued: true })
                    .font('Times-Roman')
                const tagsString = item.tags.join(', ');
                doc.text(tagsString, { continued: false });
                doc.moveDown();
                doc.moveDown();
                doc.moveDown();

            });
        }
        else {
            doc.fontSize(14).text("There are no violations to report!")
        }

        //PageWise Analysis
        if (scanResults.violations.length > 0) {
            doc.addPage({ size: 'A4', layout: 'landscape' });
            doc.font('Times-Bold').fontSize(18).text('Pagewise Analysis').moveDown();
            const data = scanResults.tableData;

            // Extract unique rule IDs and URLs for table headers
            const uniqueRuleIds = data.uniqueRuleIds;
            const urls = data.urls;

            // Table settings
            let startX = 50;
            let startY = doc.y;
            let cellWidth = 13;
            let cellHeight = 50;
            let lastColumn;
            let headerWidth = 50;
            let headerHeight = 150;

            // Draw table header for rule ids
            doc.font('Times-Roman').fontSize(10).fillColor('black');

            drawTriangle(doc, startX, startY, startX + headerWidth, startY, startX + headerWidth, startY + headerHeight);
            // Write text inside the upper triangle
            doc.text("Rule", startX + headerWidth / 2, startY + headerHeight / 2 - 15);

            // Draw the lower triangle
            drawTriangle(doc, startX, startY, startX, startY + headerHeight, startX + headerWidth, startY + headerHeight);
            // Write text inside the lower triangle
            doc.text("Url", startX + 2, startY + headerHeight / 2 + 15);

            uniqueRuleIds.forEach((ruleId, index) => {
                // Draw the rectangle for the cell
                doc.fillColor('black').rect(startX + cellWidth * (index) + headerWidth, startY, cellWidth, headerHeight).stroke();

                // Save the current state of the graphics stack
                doc.save();

                // Translate and rotate the canvas for vertical text
                // Translate to the bottom-left corner of the header cell
                doc.translate(startX + cellWidth * (index) + headerWidth, startY);

                // Rotate the canvas 90 degrees
                doc.rotate(90);

                // Draw the text
                temp_rule = formatIdToReadableString(ruleId)
                doc.text(temp_rule, 1, -cellWidth / 2 - 2, { width: headerHeight, align: 'left' });

                // Restore the graphics state
                doc.restore();

                // Track the last column position
                lastColumn = startX + cellWidth * (index) + headerWidth;
            });

            // Draw the rectangle for the Scores header cell
            doc.fillColor('black').rect(lastColumn + cellWidth, startY, cellWidth + 10, headerHeight).stroke();

            // Save the state, translate and rotate for the vertical Scores header
            doc.save();
            doc.translate(lastColumn + cellWidth, startY);
            doc.rotate(90);

            // Draw the Scores text vertically
            doc.text("Scores", 1, -cellWidth / 2 - 5, { width: headerHeight, align: 'left' });

            // Restore the graphics state
            doc.restore();


            // Draw rows for each url
            let yPosition = startY + headerHeight;
            urls.forEach((url) => {
                // Calculate the width of the text
                const textWidth = doc.widthOfString(url);

                // Calculate the number of lines required to fit the text within the fixed cell width
                const numberOfLines = Math.ceil(textWidth / headerWidth);

                // Calculate the required cell height based on the font size and number of lines
                cellHeight = (doc.currentLineHeight() + 2) * (numberOfLines + 1) + 5;
                if ((yPosition + cellHeight) > (doc.page.height - doc.page.margins.bottom)) {
                    doc.addPage({ size: 'A4', layout: 'landscape' });
                    // Reset startY for the new page and recalculate yPosition
                    startY = doc.page.margins.top;
                    yPosition = startY ;
                }

                // Draw rule ID in the first column
                doc.fillColor('black').rect(startX, yPosition, headerWidth, cellHeight).stroke();
                doc.fillColor('black').text(url, startX, yPosition + 5, { width: headerWidth, align: 'center' });
                let xPosition;
                // Check each URL for the rule violation
                uniqueRuleIds.forEach((ruleId, ruleIndex) => {
                    xPosition = startX + cellWidth * (ruleIndex) + headerWidth;
                    // Use the ruleToUrlsMap to check if the current URL is associated with the current ruleId
                    if (data.ruleToUrlsMap[ruleId] && data.ruleToUrlsMap[ruleId].includes(url)) {
                        // If rule is violated by the URL, fill the cell with red and place an "X"
                        doc.fillColor('black').rect(xPosition, yPosition, cellWidth, cellHeight).stroke();
                        doc.fillColor('red').rect(xPosition, yPosition, cellWidth, cellHeight).fill();
                        doc.fillColor('black').text('X', xPosition, yPosition + 5, { width: cellWidth, align: 'center' });
                    }
                    else {
                        doc.fillColor('black').rect(xPosition, yPosition, cellWidth, cellHeight).stroke();
                        doc.fillColor('green').rect(xPosition, yPosition, cellWidth, cellHeight).fill();
                    }
                });

                xPosition = xPosition + cellWidth;
                doc.fillColor('black').rect(xPosition, yPosition, cellWidth + 10, cellHeight).stroke();
                doc.fillColor('black').text(data.urlScores.find(item => item.url === url).score, xPosition, yPosition + 5, { width: cellWidth + 10, align: 'center' });
                yPosition += cellHeight;
            });

            
            if (yPosition > doc.page.height - doc.page.margins.bottom) {
                doc.addPage({ size: 'A4', layout: 'landscape' });
                // Reset startY for the new page and recalculate yPosition
                startY = doc.y;
                yPosition = startY;
            }

            // Draw "Scores" label in the first column
            doc.fillColor('black').rect(startX, yPosition, headerWidth, cellHeight).stroke();
            doc.text("Scores", startX, yPosition + 5, { width: headerWidth, align: 'center' });

            // Draw the score for each rule
            uniqueRuleIds.forEach((ruleId, ruleIndex) => {
                let xPosition = startX + cellWidth * (ruleIndex) + headerWidth;
                let ruleScore = data.scores[ruleId];

                doc.fillColor('black').rect(xPosition, yPosition, cellWidth, cellHeight).stroke();
                doc.text(ruleScore, xPosition, yPosition + 5, { width: cellWidth, align: 'center' });

            });
            doc.fillColor('black').rect(lastColumn + cellWidth, yPosition, cellWidth + 10, cellHeight).stroke();
            doc.text(scanResults.averageScore, lastColumn + cellWidth, yPosition + 5, { width: cellWidth, align: 'center' });
        }

        doc.addPage();

        //Test Environment
        doc.font('Times-Bold').fontSize(18).text('Test Environment').moveDown(1);

        let y_2 = doc.y + 20;
        const xLabel_2 = 50;
        const xValue_2 = 200;
        const rowHeight_2 = 60;

        Object.entries(scanResult.testEnvironment).forEach(([key, value]) => {
            doc.rect(xLabel_2, y_2, 150, rowHeight_2).stroke();
            doc.rect(xValue_2, y_2, 330, rowHeight_2).stroke();
            doc.font('Times-Roman').fontSize(14).text(key, xLabel_2 + 5, y_2 + rowHeight_2 / 4);
            doc.font('Times-Bold').fontSize(14).text(value, xValue + 5, y_2 + rowHeight_2 / 4);
            y_2 += rowHeight_2;
        });

        // Finalize the PDF file
        doc.end();

        // Output the pdf to the output folder
        fileStream.on('finish', () => {
            resolve(outputFilePath);
        });

        fileStream.on('error', (error) => {
            console.error('File Stream Error:', error);
            reject(error); // Ensure the promise is rejected on file stream errors
        });

    });
}


module.exports = {
    generate
};