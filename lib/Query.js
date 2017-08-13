class Query {
  constructor(results, db) {
    this._results = results;
    this._db = db;
    this.exec = this.exec.bind(this);
    this.filter = this.filter.bind(this);
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
    const isArray = Array.isArray(test[field]);
    const model = isArray ?
      this._db.getOne(test[field][0].model) :
      this._db.getOne(test[field].model);
    this._results = this._results.map(result => {
      result[field] = isArray ?
        result[field].map(item => model.findById(item.id)) :
        model.findById(item.id);
      return result;
    })
    return this;
  }

}
