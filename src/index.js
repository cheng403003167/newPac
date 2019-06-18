const getImgData = require('./getImgData.js');
const getImgClass = require('./downLoad.js');
(async ()=>{
  let sets = await new getImgData({startPage:95,speed:10});
  sets.on('allDateCom',async ()=>{
    const datas = new getImgClass(sets.temp_data,'binary');
    datas.init('disk',sets.get_page_number);
  })
  await sets.init()
})()