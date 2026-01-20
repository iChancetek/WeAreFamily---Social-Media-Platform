const fs = require('fs');
try {
    const report = JSON.parse(fs.readFileSync('lint-report.json', 'utf8'));
    const fileCounts = report.map(file => ({
        filePath: file.filePath.replace(__dirname, ''),
        errorCount: file.errorCount,
        warningCount: file.warningCount,
        messages: file.messages
    })).sort((a, b) => b.warningCount - a.warningCount);

    let output = '--- Top 5 Files by Warning Count ---\n';
    fileCounts.slice(0, 5).forEach(f => {
        output += `${f.filePath}: ${f.warningCount} warnings\n`;
    });

    const ruleCounts = {};
    report.forEach(file => {
        file.messages.forEach(msg => {
            ruleCounts[msg.ruleId] = (ruleCounts[msg.ruleId] || 0) + 1;
        });
    });

    output += '\n--- Top 5 Rules ---\n';
    Object.entries(ruleCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([rule, count]) => {
            output += `${rule}: ${count}\n`;
        });

    fs.writeFileSync('lint-analysis.txt', output);

} catch (e) {
    console.error("Error parsing report:", e);
}
