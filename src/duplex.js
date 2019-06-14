const { Duplex } = require('stream');
const kSource = Symbol('source');

module.exports = class imgDup extends Duplex {
  constructor(){
    super();
  }
  _write(chunk,encoding,callback){
    this.data = chunk;
    callback();
  }
  _read(size){
    this.push(this.data);
    this.data = '';
    this.push(null);
  }
}
