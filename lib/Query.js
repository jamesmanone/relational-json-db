class Query {
  constructor(results, db) {
    this._results = results;
    this._db = db;
    this.exec = this.exec.bind(this);
    this.filter = this.filter.bind(this);
    this.populate = this.populate.bind(this);
    this.limit = this.limit.bind(this);
    this.offset = this.offset.bind(this);
  }
  exec() {
    return new Promise((resolve, reject) => {
      this._results.length || reject();
      resolve(this._results);
    });
  }
  filter(condition) {
    const field = Object.keys(condition)[0];
    const term = condition[field];
    this._results = this._results.filter(result => result[field] === term);
    return this;
  }
  populate(field) {
    const test = this._results.filter(item => item[field])[0];
    if(!test) return this;
    let awaiting = [];
    const isArray = Array.isArray(test[field]);
    const model = isArray ?
      this._db.getOne(test[field][0].model) :
      this._db.getOne(test[field].model);
    this._results = this._results.map(result => {
      if(!result[field]) return result;
      else if(isArray) {
        result[field] = result[field].map(item => model.findByIdSync(item.id));
      }
      else {
        result[field] = model.findByIdSync(result[field].id);
      }
      return result;
    })
    return this;
  }
  limit(limit) {
    this._results = this._results.slice(0, limit);
    return this;
  }
  offset(offset) {
    this._results = this._results.slice(offset);
    return this;
  }
}

module.exports = Query;
