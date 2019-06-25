const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const imgDup = require('./duplex.js');
module.exports = class getImgClass extends EventEmitter {
  constructor(img_arr,encoding){
    super();
    this.http = require('http');
    this.imgDup_ins;
    this.img_arr = img_arr;
    this.encoding = encoding; //编码
    this.img_index = 0; //初始下标
    this.img_err_time = 0;  //下载错误计数，3次后就不下载
  }
  init(dir,arrs){
    this.localData = arrs;
    this.dir_con = fs.readdirSync(dir);
    fs.access(dir,fs.constants.F_OK,(err)=>{
      if(err){
        fs.mkdirSync(dir)
      }
      this.dir = dir;
      this.getImgData(this.img_arr[this.img_index].link);
    })
  }
  getImgData(src){
    // 获取图片数据保存到 data_temp
    let name = path.basename(src); //获取文件名
    if(name.indexOf('und') < 0 && !this.dir_con.includes(name)){
      this.imgDup_ins = new imgDup();
      this.http.get(src,(res)=>{
        res.setEncoding(this.encoding);
        let data_temp = ''
        res.on('data',(chunk)=>{
          data_temp += chunk;
        }).on('end',()=>{
          this.imgDup_ins.write(data_temp,this.encoding);
          this.saveData(src,this.dir);
        })
      }).on('error',(e)=>{   
        console.error(`${src}---请求错误`)
      })
    }else{
      console.log(`${name}----已存在`);
      if(++this.img_index<this.img_arr.length){
        this.getImgData(this.img_arr[this.img_index].link);
      }else{
        this.emit('allDataCom');
      }
    }
  }
  saveData(src,dir=''){
    // 保存数据
    let name = path.basename(src); //获取文件名
    let fsF = fs.createWriteStream(dir+'/'+name,{encoding:this.encoding});
    this.imgDup_ins.pipe(fsF);
    fsF.on('finish',()=>{
      this.img_err_time = 0;
      console.log(`${src}----已写入`);
      if(++this.img_index<this.img_arr.length){
        this.getImgData(this.img_arr[this.img_index].link);
      }else{
        this.emit('allDataCom');
      }
    }).on('error',()=>{
      this.img_err_time++;
      console.log(`${src}----写入错误`);
      if(this.img_err_time<3){
        this.getImgData(src);
      }else{
        if(++this.img_index<this.img_arr.length){
          this.getImgData(this.img_arr[this.img_index].link);
        }
      }
    })
  }
}

// 测试代码
// var s = ['http://wx4.sinaimg.cn/large/6b28c23aly1g3zf0cfq53g20cs0cshdy.gif','http://wx3.sinaimg.cn/large/dc106893ly1g3ytecgp6ag209l09lhdw.gif'];
// const datas = new getImgClass(s,'binary');
// datas.init('disk',[112,111,110]);
