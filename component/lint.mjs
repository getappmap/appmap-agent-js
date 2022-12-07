import { home } from "./home.mjs";
import { checkSignatureAsync } from "./signature.mjs";
await checkSignatureAsync(home);
