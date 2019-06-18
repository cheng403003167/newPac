const getImgData = require('./getImgData.js');
const getImgClass = require('./downLoad.js');
(async ()=>{
  let sets = await new getImgData({startPage:0,speed:5});
  sets.on('allDateCom',async ()=>{
    const datas = new getImgClass(sets.temp_data,'binary');
    datas.init('disk',sets.get_page_number);
  })
  await sets.init()
})()