
export default ({backend:{open}}, options) => ({
  open: () => {
    const {close, receive} = open();
    return {
      send,
      close
    };
  },
});
