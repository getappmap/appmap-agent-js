
export default ({backend:openConnection})

export default ({backend}, options) => () => {
  const {receive, close} = backend();
  return {
    send: receive,
    close
  };
};
