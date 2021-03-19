
export default (node, context, naming) => {
  const location = new Location(node, context.getFile(), naming);
  if (!context.isInstrumentable(location)) {
    return {
      node,
      entities: []
    };
  }
  
},