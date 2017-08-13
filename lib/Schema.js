const btoa = require('btoa');

class Schema {
  constructor(data) {
    this.id = data.id ||
      btoa((Math.random()*1000*1000).toString() + Date.now());
    this.createdAt = data.createdAt || Date.now();
    this.injectModel = this.injectModel.bind(this);
    this.save = this.save.bind(this);
    this.remove = this.remove.bind(this);
    this.toJson = this.toJson.bind(this);
  }

  injectModel(model) {
    this.model = model;
  }

  save() {
    return this.model.save(this);
  }

  remove() {
    return this.model.remove(this);
  }

  toJson() {
    let json = Object.assign({}, this);
    delete json.model;
    return json;
  }

}

module.exports = Schema;
