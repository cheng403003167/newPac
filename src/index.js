const getImgData = require('./getImgData.js');
const getImgClass = require('./downLoad.js');
const saveMysql = require('./saveToMysql.js');
(async ()=>{
  let sets = await new getImgData({startPage:0,speed:20});
  sets.on('allDateCom',async ()=>{
    const datas = await new getImgClass(sets.temp_data,'binary');
    await datas.init('disk',sets.get_page_number);
    var s = await new saveMysql(sets.temp_data);
    await s.init()
  })
  await sets.init()
})()