import {buildAsync} from "../../../build/index.mjs";
import Util from "./index.mjs";


const mainAsync = () => {
  Util(await buildAsync({violation:"error"}));
}
