const fs = require('fs');

const path = 'app/dashboard/leaderboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The file currently has a duplicated section for the podium and the rankings card.
// The new structure added by multi_replace_file_content starts with `<div className="grid grid-cols-1 md:grid-cols-4 gap-6">`
// and ends with `</div>` right before the old `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">`.
// I need to REMOVE the old structure that comes after it.

const startOfOld = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">', content.indexOf('<div className="grid grid-cols-1 md:grid-cols-4 gap-6">') + 1);
const endOfOld = content.lastIndexOf('</div>\n    </div>\n  );\n}');

if (startOfOld !== -1 && endOfOld !== -1) {
  content = content.substring(0, startOfOld) + '\n    </div>\n  );\n}';
  fs.writeFileSync(path, content, 'utf8');
  console.log("Fixed leaderboard duplicate UI");
} else {
  console.log("Could not find the duplicate sections to remove");
}
