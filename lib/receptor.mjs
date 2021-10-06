
import Boot from "../dist/node-boot.mjs";
import RecorderRemote from "../dist/node-recorder-remote.mjs";

const { bootRemoteRecorder } = Boot({log:"info"});
const configuration = bootRemoteRecorder(process);
const {log, validate:{message:validate_message, appmap:validate_appmap}, output:{target:output_target}} = configuration;
const {openReceptorAsync, closeReceptorAsync, getReceptorTrackPort, getReceptorTracePort} = Receptor({
  log,
  receptor: output_target,
  violation: "error",
  "validate-message": validate_message ? "on" : "off",
  "validate-appmap": validate_appmap ? "on" : "off",
});

const receptor = await openReceptorAsync(configuration);
if (Reflect.getOwnPropertyDescriptor(process, "send") !== _undefined) {
  process.send({
    "trace-port": getReceptorTracePort(receptor),
    "track-port": getReceptorTrackPort(receptor),
  });
}
process.on("SIGINT", () => {
  closeReceptorAsync(receptor);
});
