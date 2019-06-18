const EventEmitter = require('events');
const fs = require('fs');
class getImgData extends EventEmitter {
  constructor({startPage=0,speed=5}){
    super();
    this.puppeteer = require('puppeteer');
    this.temp_data = [];
    this.get_page_number = [];
    this.startPage = 0;
    this.currentPage = 0;
    this.speed = speed;
    if(startPage>0){
      this.startPage = startPage
    }
  }
  async init(){
    await this.getLocalData();
    this.browser = await this.puppeteer.launch({headless:true});
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on('request', interceptedRequest => {
      if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg') || interceptedRequest.url().endsWith('.gif')){
        interceptedRequest.abort();
      }else if(interceptedRequest.url().endsWith('.js') && interceptedRequest.url().indexOf('jquery.min.js') < 0 ){
        interceptedRequest.abort();
      }else{
        interceptedRequest.continue();
      }
    });
    await this.getPageNumber();
  }
  async getPageNumber(){
    let page = await this.browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
      if (interceptedRequest.url().endsWith('.png') || interceptedRequest.url().endsWith('.jpg') || interceptedRequest.url().endsWith('.gif')){
        interceptedRequest.abort();
      }else if(interceptedRequest.url().endsWith('.js') && interceptedRequest.url().indexOf('jquery.min.js') < 0 ){
        interceptedRequest.abort();
      }else{
        interceptedRequest.continue();
      }
    });
    page.on('domcontentloaded',async ()=>{
      const tempPage = await page.evaluate(()=>{
        return parseInt($(".cp-pagenavi:eq(0) a:eq(0)").text()) + 1;
      });
      if(this.startPage != 0){
        if(this.startPage > tempPage){
          console.log('给定的开始页码太大');
          this.closeB();
        }else{
          this.currentPage = this.startPage;
        }
      }else{
        this.startPage = this.currentPage = tempPage;
      }
      await this.getData();
    })
    await page.goto('http://jandan.net/pic/');
  }
  async getData(){
    this.page.on('domcontentloaded',async ()=>{
      const result= await this.page.evaluate(()=>{
        var lisL = $(".commentlist li").length;
        var linkArr = [];
        for(var t = 0;t<lisL;t++){
          if($(".commentlist li").eq(t).attr('id') != undefined){
            if($(".commentlist li").eq(t).find('.text').find('p').find('a').attr('href') != 'javascript:;'){
              linkArr.push('http:'+$(".commentlist li").eq(t).find('.text').find('p').find('a').attr('href'));
            }
          }
        }
        return linkArr;
      });
      result.forEach((item)=>{
        this.temp_data.push(item);
      });
      this.get_page_number.push(parseInt(this.currentPage));
      --this.currentPage;
      if(this.currentPage > (this.startPage-this.speed) && this.currentPage > 0){
        await this.goUrl()
        return true;
      }else{
        setTimeout(async ()=>{
          await this.closeB();
        },500)
        this.get_page_number = this.dataSortRename(this.get_page_number);
        this.emit('allDateCom');
      }
    });
    await this.goUrl()
  }
  async goUrl(){
    await this.page.goto(`http://jandan.net/pic/page-${this.currentPage}#comments`);
  }
  async getLocalData(){
    await fs.open('src/bin/downloadedData.txt', 'r', async (err, fd) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error('myfile 不存在');
          return;
        }
        throw err;
      }else{
        let dataR = fs.readFileSync(fd,'utf8').split(',');
        if(dataR.length>0){
          this.dataSortRename(dataR).forEach(x=>{
            this.get_page_number.push(parseInt(x));
          })
        }
      }
    });
  }
  dataSortRename(data){
    let tempA1 = [];
    let tempA = data.filter((x)=>parseInt(x)).sort((a,b)=>{return b-a});
    tempA.forEach((a)=>{
      if(!tempA1.includes(a)){
        tempA1.push(a)
      }
    })
    return tempA1;
  }
  async closeB(){
    await this.browser.disconnect();
    await this.browser.close();
  }
}
module.exports = getImgData;
// (async ()=>{
//   let sets = await new getImgData({startPage:0,speed:5});
//   sets.on('allDateCom',async ()=>{
//     console.log(sets.temp_data);
//     console.log(sets.get_page_number);
//   })
//   await sets.init()
// })()
