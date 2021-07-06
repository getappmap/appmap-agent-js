
export default ({backend: {open, close, receive}}, options) => {
  const session = open();
  return {
    send: (data) => {
      receive(session, data);
    },
    close: () => {
      close(session);
    }
  };
};
