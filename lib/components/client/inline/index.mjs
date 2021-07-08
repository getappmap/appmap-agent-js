export default ({ backend: { open } }, configuration) => ({
  open: () => {
    const { close, receive } = open();
    return {
      send: receive,
      close,
    };
  },
});
