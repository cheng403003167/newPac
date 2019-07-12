const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const saveMysql = require('./saveToMysql.js');
class getImgData extends EventEmitter {
  constructor({startPage=0,speed=5}){
    super();
    this.puppeteer = require('puppeteer');
    this.temp_data = []; //获取页面的数据
    this.get_page_number = [];  //获取页面的页码
    this.startPage = 0;  //查询开始页面
    this.currentPage = 0; //当前查询页面
    this.timePageIndex = 0; //获取时间页面
    this.speed = speed;  //获取页面总数
    if(startPage>0){
      this.startPage = startPage
    }
  }
  async init(){
    this.s = await new saveMysql();
    await this.s.conn();
    await this.s.juiceOtherImg();
    this.mysqlData = this.s.getOtherImg;
    // await this.getLocalData();
    this.browser = await this.puppeteer.launch({headless:true,args:['--no-sandbox']});
    this.page = await this.browser.newPage();
    this.timePage = await this.browser.newPage();
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
    await this.timePage.setRequestInterception(true);
    this.timePage.on('request', interceptedRequest => {
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
          var s = {};
          if($(".commentlist li").eq(t).attr('id') != undefined){
            if($(".commentlist li").eq(t).find('.text').find('p').find('a').attr('href') != 'javascript:;'){
              s.userName = $(".commentlist li").eq(t).find('.author').find('strong').text();
              var val = "";
              for(var i = 0; i < s.userName.length; i++){
                  if (val == "")
                      val = s.userName.charCodeAt(i).toString(16);
                  else
                      val += "," + s.userName.charCodeAt(i).toString(16);
              }
              
              s.link = 'http:'+$(".commentlist li").eq(t).find('.text').find('p').find('a').attr('href');
              s.userName = val;
              s.timeLink = 'http://jandan.net'+$(".commentlist li").eq(t).find('.righttext').find('a').attr('href');
              linkArr.push(s);
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
        this.get_page_number = this.dataSortRename(this.get_page_number);
        await this.getUpdateTime();
      }
    });
    await this.goUrl()
  }
  async goUrl(){
    await this.page.goto(`http://jandan.net/pic/page-${this.currentPage}#comments`);
  }
  async getUpdateTime(){
    this.timePage.on('domcontentloaded',async ()=>{
      const times = await this.timePage.evaluate(()=>{
        var t = $(".comment-topic").html();
        var startI = t.indexOf('发布于');
        var endI = t.indexOf('<hr>');
        var ss = t.slice(startI+4,endI).trim().replace('T',' ').replace('+08:00','');
        return ss;
      });
      this.temp_data[this.timePageIndex].update = times;
      if(this.timePageIndex>=this.temp_data.length-1){
        setTimeout(async ()=>{
          await this.closeB();
        },2000)
        await this.s.connection.end();
        this.emit('allDateCom');
      }else{
        this.timePageIndex++;
        await this.goTimeUrl();
      }
    });
    await this.goTimeUrl();
  }
  async goTimeUrl(){
    let hasL = false,that = this;
    this.mysqlData.forEach((item)=>{
      if(item.imgName == path.basename(that.temp_data[that.timePageIndex].link)){
        hasL = true;
      }
    })
    if(hasL && this.timePageIndex<this.temp_data.length-1){
      this.timePageIndex++;
      this.goTimeUrl();
    }else{
      await this.timePage.goto(this.temp_data[this.timePageIndex].timeLink);
    }
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
//   let sets = await new getImgData({startPage:0,speed:1});
//   sets.on('allDateCom',async ()=>{
//     console.log(sets.temp_data);
//   })
//   await sets.init()
// })()
