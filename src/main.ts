import "@phosphor-icons/web/regular";
import "@phosphor-icons/web/fill";
import "./style.css";
import "./pastel.css";
import { initDesktop } from "./desktop";
import { initDuck } from "./duck";
const root = document.getElementById("desktop-root");
if (root instanceof HTMLElement) {
  initDesktop(root);
  const duck = initDuck(root);
  import.meta.hot?.dispose(() => duck.destroy());
}
