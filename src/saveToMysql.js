var mysql = require('mysql');
const EventEmitter = require('events');
const path = require('path');
module.exports =  class mysqlData extends EventEmitter {
  constructor(data){
    super();
    this.config = {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'jiandanimg'
    };
    this.newData = data; //要上传的数据
    this.userNameData = [];  //数据库中用户列表
    this.imgData = [];  //数据库中图片列表
  }
  async conn(){
    this.connection = await mysql.createConnection(this.config);
  }
  async init(){
    await this.getUserName();
    await this.getImgData();
    await this.juiceUser();
    await this.juiceImg();
  }
  async getUserName(){
    return new Promise((resolve,reject)=>{
      this.connection.query('SELECT * FROM user',(err,result)=>{
        if(err){
          console.log(err);
          reject()
          return;
        }
        this.userNameData = result;
        resolve()
      })
    })
  }
  async getImgData(){
    return new Promise((resolve,reject)=>{
      this.connection.query('SELECT imgName FROM imgdata',(err,result)=>{
        if(err){
          console.log(err);
          reject()
          return;
        }
        this.imgData = result;
        resolve(result)
      })
    })
  }
  async juiceUser(){
    for(var s = 0;s<this.newData.length;s++){
      var hasE = false;
      for(var t = 0;t<this.userNameData.length;t++){
        if(this.newData[s].userName == this.userNameData[t].userName){
          this.newData[s].userId = this.userNameData[t].id;
          hasE = true;
        }
      }
      if(!hasE){
        await this.updataUserName(this.newData[s].userName,s)
      }
    }
  }
  async updataUserName(name,s){
    return new Promise((resolve,reject)=>{
      this.connection.query('INSERT INTO user SET userName = ?',[name],(err,result)=>{
        if(err){
          console.log(err);
          reject();
          return;
        }
        this.newData[s].userId = result.insertId;
        this.userNameData.push({id:result.insertId,userName:name});
        resolve(result)
      })
    })
  }
  async juiceImg(){
    for(var s = 0;s<this.newData.length;s++){
      var imghasE = false;
      for(var t = 0;t<this.imgData.length;t++){
        let name = path.basename(this.newData[s].link); //获取文件名
        if(name == this.imgData[t].imgName){
          imghasE = true;
        }
      }
      if(!imghasE){
        await this.updataImg(this.newData[s])
      }
    }
    console.log('存入数据完成')
    this.connection.end();
    this.emit('saveDataCom')
  }
  async juiceOtherImg(){
    this.getOtherImg = await this.getImgData();

  }
  async updataImg(data){
    let name = path.basename(data.link); //获取文件名
    return new Promise((resolve,reject)=>{
      this.connection.query('INSERT INTO imgdata SET ?',{userId:data.userId,imgName:name,update:data.update},(err,result)=>{
        if(err){
          console.log(err);
          reject();
          return;
        }
        this.imgData.push({userId:data.userId,imgName:name,update:data.update})
        resolve(result)
      })
    })
  }
}
// var testData = [ 
//   { link:
//      'http://wx3.sinaimg.cn/large/c21d137bgy1g47886wuwcj20j60crdiq.jpg',
//     userName: '暧昧',
//     timeLink: 'http://jandan.net/t/4279989',
//     update: '2019-06-21 15:01:20' }];
// var s = new mysqlData(testData);
// s.init()


