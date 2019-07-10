const getImgData = require('./getImgData.js');
const getImgClass = require('./downLoad.js');
const saveMysql = require('./saveToMysql.js');

(async ()=>{
  var startPage = 0;
  async function getData(){
    let sets = await new getImgData({startPage:startPage,speed:10});
    sets.on('allDateCom',async ()=>{
      startPage = sets.currentPage;
      // const datas = await new getImgClass(sets.temp_data,'binary');
      // datas.on('allDataCom', async ()=>{
      //   if(startPage-10 >= 0){
      //     await getData();
      //   }
      // })
      // await datas.init('disk',sets.get_page_number);
      var s = await new saveMysql(sets.temp_data);
      s.on('saveDataCom',async ()=>{
        if(startPage-10 >= 0){
          await getData();
        }
      })
      await s.conn();
      await s.init();
    })
    await sets.init()
  }
  await getData()
})()