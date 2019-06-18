const fs = require('fs');
let dataR = fs.readFileSync('src/bin/downloadedData.txt','utf8').split(',');
let noP = [];
if(dataR.length>0){
  console.log('第一页为',dataR[0]);
  console.log('最后一页为',dataR[dataR.length-2]);
  for(var t = 0;t<dataR.length-1;t++){
    if(!dataR.includes((dataR[0]-t).toString())){
      noP.push(dataR[0]-t)
    }
  }
  console.log('中间缺失的页为',noP);
}