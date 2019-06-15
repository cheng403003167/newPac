const EventEmitter = require('events');
class getImgData extends EventEmitter {
  constructor({startPage=0,endPage=0}){
    super();
    this.puppeteer = require('puppeteer');
    this.temp_data = [];
    this.startPage = 0;
    this.currentPage = 0;
    this.endPage = 0;
    if(startPage){
      this.startPage = startPage
    }
    if(endPage){
      this.endPage = endPage
    }
  }
  async init(){
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
    this.page.on('domcontentloaded',async ()=>{
      const tempPage = await this.page.evaluate(()=>{
        return parseInt($(".cp-pagenavi:eq(0) a:eq(0)").text()) + 1;
      });
      if(this.startPage != 0){
        if(this.startPage > tempPage){
          console.log('给定的开始页码太大');
          this.closeB();
        }
      }else{
        this.startPage = this.currentPage = tempPage;
      }
      await this.getData();
    })
    await this.page.goto('http://jandan.net/pic/');
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
      this.temp_data = result;
      if(this.currentPage > this.endPage){
        this.currentPage--;
        this.emit('pageDateCom');
      }else{
        this.emit('allDateCom');
      }
    });
    if(this.startPage > 0){
      await this.page.goto(`http://jandan.net/pic/page-${this.currentPage}#comments`);
    }
  }
  async closeB(){
    await this.browser.disconnect();
    await this.browser.close();
  }
}
(async ()=>{
  let sets = await new getImgData({startPage:0,endPage:107});
  sets.on('pageDateCom',async ()=>{
    sets.getData();
  });
  sets.on('allDateCom',async ()=>{
    console.log(sets.temp_data);
    sets.closeB();
  })
  await sets.init()
})()
