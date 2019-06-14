const EventEmitter = require('events');
const fs = require('fs');
const imgDup = require('./duplex.js');
class getImgClass extends EventEmitter {
  constructor(img_arr,encoding){
    super();
    this.http = require('http');
    this.imgDup_ins;
    this.img_arr = img_arr;
    this.encoding = encoding; //编码
    this.img_index = 0; //初始下标
    this.img_err_time = 0;  //下载错误计数，3次后就不下载
  }
  init(){
    this.getImgData(this.img_arr[this.img_index]);
  }
  getImgData(src){
    // 获取图片数据保存到 data_temp
    this.imgDup_ins = new imgDup();
    this.http.get(src,(res)=>{
      res.setEncoding(this.encoding);
      let data_temp = ''
      res.on('data',(chunk)=>{
        data_temp += chunk;
      }).on('end',()=>{
        console.log('数据传输完成');
        this.imgDup_ins.write(data_temp,this.encoding);
        this.saveData(src);
      })
    }).on('error',(e)=>{
      console.error(`${src}---请求错误`)
    })
  }
  saveData(src,dir=''){
    // 保存数据
    let ts = new Date(); //获取时间
    let ext = '.'+src.split('.')[src.split('.').length-1]; //获取扩展名
    let img_name = ts.getTime() + ext; //拼接名
    let fsF = fs.createWriteStream(dir+img_name,{encoding:this.encoding});
    this.imgDup_ins.pipe(fsF);
    fsF.on('finish',()=>{
      this.img_err_time = 0;
      console.log(`${src}----已写入`)
      if(++this.img_index<this.img_arr.length){
        this.getImgData(this.img_arr[this.img_index]);
      }
    }).on('error',()=>{
      this.img_err_time++;
      console.log(`${src}----写入错误`);
      if(this.img_err_time<3){
        this.getImgData(src);
      }else{
        if(++this.img_index<this.img_arr.length){
          this.getImgData(this.img_arr[this.img_index]);
        }
      }
    })
  }
}

// 测试代码
// var s = ['http://wx4.sinaimg.cn/large/6b28c23aly1g3zf0cfq53g20cs0cshdy.gif','http://wx3.sinaimg.cn/large/dc106893ly1g3ytecgp6ag209l09lhdw.gif'];
// const datas = new getImgClass(s,'binary');
// datas.init();