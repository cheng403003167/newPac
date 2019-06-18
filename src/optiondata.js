const fs = require('fs');
fs.open('src/bin/downloadedData.txt', 'r', (err, fd) => {
  if (err) {
    if (err.code === 'ENOENT') {
      console.error('myfile 不存在');
      return;
    }

    throw err;
  }
  let dataR = fs.readFileSync(fd,'utf8').split(',');
  let tempA1 = [];
  let tempA = dataR.filter((x)=>parseInt(x)).sort((a,b)=>{
    return b-a
  });
  tempA.forEach((a)=>{
    if(!tempA1.includes(a)){
      tempA1.push(a)
    }
  })
  console.log(tempA1)
});