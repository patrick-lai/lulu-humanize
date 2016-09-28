# Description

  Pings Champion.gg.api one champion per 2 seconds and humanizes the dataset for machine learning.

# Run

 1) Create a config.js in root directory (same directory as index.js) of this format  

 ```
 module.exports = {
   championGGToken : "%PUT_YOUR_TOKEN_HERE%",
   development: true,
   outputDirectory:"output/",
   fileExtension: "_data.html",
   rawFileExtension: "_raw.json"
 }
 ```

 npm i  
 npm run single  
