const fs = require('fs');
const Query = require('./Query');
const path = require('path');

class Model {
  constructor(name, schema, indexFields) {
    const dataPath = path.join(path.dirname(require.main.filename), '.data');
    if(!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
    this.name = name;
    this.filename = path.join(dataPath, `${this.name}.json`);
    this.schema = schema;
    this.indexFields = indexFields;
    this.db = fs.existsSync(this.filename) ? JSON.parse(fs.readFileSync(this.filename)) : [];
    this.hash = {};
    this.indices = {};
    this.db.map(doc => {
      this.hash[doc.id] = doc;
    });
    this.findById = this.findById.bind(this);
    this.find = this.find.bind(this);
    this.save = this.save.bind(this);
    this.create = this.create.bind(this);
    this.remove = this.remove.bind(this);
    this.findByIdAndUpdate = this.findByIdAndUpdate.bind(this);
    this.registerDB = this.registerDB.bind(this);
  }
  findById(id) {
    return new Promise((resolve, reject) => {
      if(!this.hash.hasOwnProperty(id)) reject();
      const doc = new this.schema(this.hash[id]);
      doc.injectModel(this);
      resolve(doc);
    });
  }
  findByIdSync(id) {
    if(!this.hash.hasOwnProperty(id)) return null;
    const doc = new this.schema(this.hash[id]);
    doc.injectModel(this);
    return doc;
  }
  find(query) {
    if(query && Object.keys(query).length === 1 && query.hasOwnProperty('id')) {
      let results = [this.hash[query.id]];
      results[0] = new this.schema(result);
      results[0].injectModel(this);
      return new Query(results, this.DB)
    }
    let results = [...this.db];
    if(query) {
      for(let param in query) {
        results = results.filter(result => result[param] === query[param]);
      }
    }
    results = results.map(result => {
      const out = new this.schema(result);
      out.injectModel(this);
      return out;
    })
    return new Query(results, this.DB)
  }
  save(doc) {
    return new Promise((resolve, reject) => {
      doc.id || reject();
      this.db = this.db
        .filter(item => item.id !== doc.id)
        .concat([doc]);
      this.hash = Object.assign({}, this.hash);
      this.hash[doc.id] = doc;
      try {
        fs.writeFileSync(this.filename, JSON.stringify(this.db))
      } catch (e) {
        console.log(e);
        reject();
      }
      resolve(doc);
    });
  }
  create(obj, auto) {
    return new Promise((resolve, reject) => {
      obj || reject();
      const doc = new this.schema(obj);
      doc.injectModel(this);
      if(auto) doc.save().then(resolve, reject);
      else resolve(doc);
    });
  }
  remove(id) {
    id = typeof id === 'string' ? id : id.id;
    if(!id) return false;
    delete this.hash[id]
    this.db = this.db.filter(item => item.id !== id);
    fs.writeFile(this.filename, JSON.stringify(this.db), () => {
      return true;
    });
  }
  findByIdAndUpdate(id, update) {
    return new Promise((resolve, reject) => {
      let doc = this.hash[id];
      doc || reject();
      const op = Object.keys(update)[0];
      let field;
      switch (op) {
        case '$pull':
          field = Object.keys(update.$pull)[0];
          doc[field] = doc[field].filter(item => item.id !== update.$pull[field])
          this.save(doc)
            .then(resolve, reject)
          break;
        case '$push':
          field = Object.keys(update.$push)[0];
          doc[field] = doc[field].concat($push[field])
          this.save(doc)
            .then(resolve, reject)
          break;
        default:
          doc[op] = update[op];
          this.save(doc)
            .then(resolve, reject);
      }
    });
  }
  registerDB(db) {
    this.DB = db;
  }
  // makeIndex(index) {
  //   this.indices[index] = this.db.map(doc => {
  //     this.indices[index][doc[index]] = doc;
  //   });
  // }
}

module.exports = Model;
