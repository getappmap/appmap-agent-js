
class Location {
  constructor (file, node) {
    this.file = file;
    this.node = node;
  }
  getSource () {
    return this.file.content.substring(this.node.start, this.node.end);
  }
  getLocation () {
    return `${this.file.path}:${this.node.loc.start.line}`;
  }
  getLabels () {
    return [];
  }
  getComment () {
    return null;
  }
}

class FunctionLocation extends Location {
  contructor (file, naming, node) {
    if (node.type !== "ArrowFunctionExpression" && node.type !== "FunctionExpression" && node.type !== "FunctionDeclaration") {
      throw new Error(`Invalid node for function location`);
    }
    super(file, node);
    this.naming = naming;
  },
  getName () {

  },
  isStatic () {
    return false;
  }
};



class ArrowFunctionLocation extends FunctionLocation {
  constructor (file, naming, node) {
    if (node.type !== "ArrowFunctionExpression") {
      throw new Error(`Invalid node for arrow function location`);
    }
    super(file, naming, node);
  }
}



class ClassLocation extends Location {
  constructor (file, naming, node) {
    if (node.type !== "ObjectExpression" && node.type !== "ClassExpression" && node.type !== "ClassDeclaration") {
      throw new Error(`Invalid node for class location`);
    }
    super(file, naming, node);
  }
  getName () {

  }
}
