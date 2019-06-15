class getImgData {
  constructor(){
    this.puppeteer = require('puppeteer');
  }
  async init(){
    this.browser = await this.puppeteer.launch({headless:true});
    this.page = await this.browser.newPage();
    await this.getData();
  }
  async getData(){
    this.page.on('domcontentloaded',async ()=>{
      const result= await this.page.evaluate(()=>{
        var lisL = $(".commentlist li").length;
        var linkArr = [];
        for(var t = 0;t<lisL;t++){
          if($(".commentlist li").eq(t).attr('id') != undefined){
            linkArr.push('http:'+$(".commentlist li").eq(t).find('.text').find('p').find('a').attr('href'));
          }
        }
        return linkArr;
      });
      console.log(result);
    })
    await this.page.goto('http://jandan.net/pic/page-106#comments');
    // await browser.close();
  }
}
let sets = new getImgData();
sets.init()