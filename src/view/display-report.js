// Rule Objects for testing
const rule1 = {
  id: 88,
  ruleId: 'color-contrast',
  userImpact: 'Serious',
  wcag: '1.4.3',
  howToFixTheProblem:
    'Ensure all text elements have sufficient color contrast between the text in the foreground and background color behind it.Success Criterion: Ensure color contrast of at least 4.5:1 for small text or 3:1 for large text, even if text is part of an image. Large text has been defined in the requirements as 18pt (24 CSS pixels) or 14pt bold (19 CSS pixels). Note: Elements found to have a 1:1 ratio are considered "incomplete" and require a manual review.',
  whyItMatters:
    'Some people with low vision experience low contrast, meaning that there aren\'t very many bright or dark areas. Everything tends to appear about the same brightness, which makes it hard to distinguish outlines, borders, edges, and details. Text that is too close in luminance (brightness) to the background can be hard to read.There are nearly three times more individuals with low vision than those with total blindness. One in twelve people cannot see the average full spectrum of colors - about 8% of men and 0.4% of women in the US. A person with low vision or color blindness is unable to distinguish text against a background without sufficient contrast.Color transparency and opacity is taken into account in the background. Color transparency and opacity in the foreground is more difficult to detect and account for due to:1:1 colors in foreground and background. CSS background gradients. Background colors in CSS pseudo-elements. Background colors created with CSS borders. Overlap by another element in the foreground - this sometimes comes up with tricky positioning. Elements moved outside the viewport via CSS.',
  ruleDescription:
    'All text elements must have sufficient contrast between text in the foreground and background colors behind it in accordance with WCAG 2 AA contrast ratio thresholds.',
  theAlgorithm:
    'Checks all text elements to ensure that the contrast between the foreground text and the background colors meet the WCAG 2 AA contrast ratio thresholds.',
  disabilitiesAffected: 'Low Vision,Colorblindness',
  requirements: 'WCAG 2.0 (AA): MUST',
  wcagSuccessCriteria: '1.4.3 Contrast (Minimum)',
  section508Guidelines: 'Not specified, or not applicable',
};
const rule2 = {
  id: 54,
  ruleId: 'label-title-only',
  userImpact: 'Serious',
  wcag: 'Best Practice',
  howToFixTheProblem:
    'Provide every form control a label using aria-label, aria-labelledby<label> or explicit <label>.Using aria-label and aria-labelledby Most of the time it is best to use standard form labels using the <label> tag. The <label> tag is by far the most useful and most widely-supported method of labeling form elements, especially among older browsers and older screen readers. There are, however, certain circumstances that require more flexible methods of labeling objects. One limitation of the <label> tag is that it can be associated with only one form element. If circumstances require a more complex labeling structure, the <label> tag is insufficient. This is where aria-label and aria-labelledby come in.The aria-label attribute allows you to add a label directly to pretty much any HTML element, including form elements, paragraphs, tables, and more.',
  whyItMatters:
    'The title and aria-describedby attributes are used to provide additional information such as a hint. Hints are exposed to accessibility APIs differently than labels and as such, this can cause problems with assistive technologies.When form inputs such as text entry fields, radio buttons, check boxes, and select menus contain no labels other than title and aria-describedby attribute values, screen readers interpret the content as advisory information only. Labels created by the title and aria-describedby values are not sufficient to create a true label that can be determined programmatically from the code to convey the purpose of the input form element',
  ruleDescription:
    'Form <input> elements may be given a title using the title or aria-describedby attributes (but not both). These attributes are used to provide additional information such as a hint.',
  theAlgorithm:
    'Ensures that every <input> that requires a label is has a label other than the title or aria-describedby attributes.',
  disabilitiesAffected: 'Blind,Deafblind,Mobility',
  requirements: 'Best Practice',
  wcagSuccessCriteria: 'Not specified, or not applicable',
  section508Guidelines: 'Not specified, or not applicable',
};

const ruleToString = ({
  ruleId,
  userImpact,
  wcag,
  howToFixTheProblem,
  whyItMatters,
  ruleDescription,
  theAlgorithm,
  requirements,
  disabilitiesAffected,
  wcagSuccessCriteria,
  section508Guidelines,
}) =>
  `- Rule Id: ${ruleId}
    - User Impact: ${userImpact}
    - WCAG Rule: ${wcag}
    - How To Fix The Problem: ${howToFixTheProblem}
    - Why It Matters: ${whyItMatters}
    - Rule Description: ${ruleDescription}
    - The Algorithm: ${theAlgorithm}
    - Disabilities Affected: ${disabilitiesAffected}
    - Requirements: ${requirements}
    - WCAG Success Criteria: ${wcagSuccessCriteria}
    - Section 508 Guidelines: ${section508Guidelines}`;

const violationsArray = [rule1, rule2];
const list = document.getElementById('rules-list');

// Scan Object for testing
const scan = {
  _id: '6529f5835fe3677422faf8eb',
  timestamp: '2023-10-14T01:57:23.459Z',
  url: 'https://0barriers.org/',
  inapplicable: [],
  passes: [],
  violations: violationsArray,
};

for (i = 0; i < violationsArray.length; ++i) {
  const listData = ruleToString(violationsArray[i]);
  const li = document.createElement('li');
  li.innerText = listData;
  list.appendChild(li);
}

const score = 95.56;

document.getElementById('url').innerHTML = scan.url;
document.getElementById('timestamp').innerHTML = scan.timestamp;
document.getElementById('complianceScore').innerHTML = score;
