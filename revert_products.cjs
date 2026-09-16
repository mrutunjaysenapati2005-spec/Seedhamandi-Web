const fs = require('fs');
let dbContent = fs.readFileSync('server/db.ts', 'utf-8');

const startProd9 = dbContent.indexOf("id: 'prod_9'");
if (startProd9 !== -1) {
  // Find the previous opening bracket
  const bracketStart = dbContent.lastIndexOf("{", startProd9);
  const endArray = dbContent.indexOf("];", bracketStart);
  if (bracketStart !== -1 && endArray !== -1) {
    dbContent = dbContent.substring(0, bracketStart) + dbContent.substring(endArray);
  }
}
fs.writeFileSync('server/db.ts', dbContent);
