

const names = ;
const filename = names.pop();
let children = this.entities;
for (let name of names) {
  let child = children.find((child) => child.name === name);
  if (child === undefined || child.type !== "package") {
    child = {
      type: "package",
      name,
      children: []
    };
    children.push(child);
  }
  children = child.children;
}
children.push({
  type: "class",
  name: filename,
  children: entities
});
