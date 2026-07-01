function onOpen() {
  DocumentApp.getUi()
    .createMenu('Fixing BiDi')
    .addItem('Open Window', 'showSidebar')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Fix Text Direction');
  DocumentApp.getUi().showSidebar(html);
}


function fixBidiBrackets() {
  const body = DocumentApp.getActiveDocument().getBody();
  const RLM = '\u200F';
  const LRM = '\u200E';

  const RTL  = '\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF';
  const LTR  = '\u0041-\u005A\u0061-\u007A\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0530-\u058F\u0900-\u097F';
  const OPEN = '(\\[{';   // Opening bracket characters (inside a character class)

  // Each rule: a "before" letter of one direction, optional spaces, a bracket, then an "after" letter of the opposite direction
  const rules = [
    { name: 'RTL→LTR', before: RTL, after: LTR, mark: LRM },
    { name: 'LTR→RTL', before: LTR, after: RTL, mark: RLM },
  ];

  const report = rules
    .map(r => ({ name: r.name, count: fixTransition(body, r, OPEN) }))
    .filter(r => r.count > 0)
    .map(r => r.count + ' (' + r.name + ')')
    .join(',\n');

  return report
    ? 'Done ✓\n' + report
    : 'Done ✓ (no corrections needed)';
}

function fixTransition(body, rule, open) {
  // Pattern: [before] spaces? [opening bracket] [after]
  const pattern = '[' + rule.before + '] *[' + open + '][' + rule.after + ']';

  // Step 1: collect matches + find where the bracket sits within each match
  const jobs = [];
  let found = body.findText(pattern);
  while (found) {
    const el = found.getElement().asText();
    const start = found.getStartOffset();
    const end = found.getEndOffsetInclusive();
    const text = el.getText();

    // Locate the bracket position within the matched range
    let bracketPos = -1;
    for (let i = start; i <= end; i++) {
      if (open.indexOf(text.charAt(i)) !== -1) { bracketPos = i; break; }
    }
    if (bracketPos !== -1) jobs.push({ element: el, offset: bracketPos });

    found = body.findText(pattern, found);
  }

  // Step 2: inject from end to start so offsets don't shift
  for (let i = jobs.length - 1; i >= 0; i--) {
    jobs[i].element.insertText(jobs[i].offset, rule.mark);
  }

  return jobs.length;
}
