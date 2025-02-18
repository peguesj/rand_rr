const sass = require('sass');
const fs = require('fs');

const generateThemeData = () => {
  const scssContent = fs.readFileSync('../src/scss/_extended-colors.scss', 'utf8');
  // Parse SCSS and extract theme data
  const themes = {}; // Parse theme data from SCSS
  
  fs.writeFileSync(
    '../src/js/generated/themes.json',
    JSON.stringify(themes, null, 2)
  );
};

generateThemeData();
