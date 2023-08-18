import {
  ButtonItem,
  definePlugin,
  DialogButton,
  Menu,
  MenuItem,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  showContextMenu,
  staticClasses,
} from "decky-frontend-lib";
import { VFC } from "react";
import { FaShip } from "react-icons/fa";

import logo from "../assets/logo.png";
import {Canvas} from "./canvas";

// interface AddMethodArgs {
//   left: number;
//   right: number;
// }

const Content: VFC<{ serverAPI: ServerAPI }> = ({serverAPI}) => {
  // const [result, setResult] = useState<number | undefined>();

  // const onClick = async () => {
  //   const result = await serverAPI.callPluginMethod<AddMethodArgs, number>(
  //     "add",
  //     {
  //       left: 2,
  //       right: 2,
  //     }
  //   );
  //   if (result.success) {
  //     setResult(result.result);
  //   }
  // };

  const drawCanvas = async (ctx: any, frameCount: number) => {
    if (frameCount % 1000 > 1) {
      return;
    }

    var data = (await serverAPI.callPluginMethod("get_recent_data", {})).result;

    const width: number = ctx.canvas.width;
    const height: number = ctx.canvas.height;
    ctx.strokeStyle = "#1a9fff";
    ctx.fillStyle = "#1a9fff";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, width, height);

    // graph helper lines
    ctx.beginPath();
    ctx.strokeStyle = "#093455";
    const totalLines = 7;
    const lineDistance = 1 / (totalLines + 1);
    for (let i = 1; i <= totalLines; i++) {
      ctx.moveTo(lineDistance * i * width, 0);
      ctx.lineTo(lineDistance * i * width, height);
      ctx.moveTo(0, lineDistance * i * height);
      ctx.lineTo(width, lineDistance * i * height);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#1a9fff";
    ctx.fillStyle = "#1a9fff";

    // axis labels
    ctx.textAlign = "center";
    ctx.rotate(- Math.PI / 2);
    ctx.fillText("Batt %", - height / 2, 12); // Y axis is rotated 90 degrees
    ctx.rotate(Math.PI / 2);
    ctx.fillText("Time", width / 2, height - 4);
    // graph data labels
    ctx.textAlign = "start"; // default
    ctx.fillText("-2d", 2, height - 2);
    ctx.fillText("100%", 2, 9);
    ctx.textAlign = "right";
    ctx.fillText("Now", width - 2, height - 2);

    // ctx.moveTo(data[0].x/width, );
    for (var i = 0; i < data.x.length; i++) {
      ctx.beginPath();
      // console.log(data.x[i+1] - data.x[i]);
      if (data.x[i+1] - data.x[i] > 0.000078354119349755*10) {
        if (data.cap[i+1] > data.cap[i]) {
          ctx.strokeStyle = "green";
        } else {
          ctx.strokeStyle = "yellow";
        }
      } else {
        ctx.strokeStyle = "red";
      }
      ctx.moveTo(data.x[i]*width, height - data.cap[i]*height);
      ctx.lineTo(data.x[i+1]*width, height- data.cap[i+1]*height);
      ctx.stroke();
    }
    console.debug("Rendered ", frameCount);

  }

  return (
    <PanelSection title="Recent Battery Use">
      <PanelSectionRow>
      <Canvas draw={(ctx: any, frameCount: number) => drawCanvas(ctx, frameCount)} width={268} height={200} style={{
                "width": "268px",
                "height": "200px",
                "padding":"0px",
                "border":"1px solid #1a9fff",
                "background-color":"#1a1f2c",
                "border-radius":"4px",
              }} onClick={(e: any) => console.log(e)}/>
      </PanelSectionRow>
    </PanelSection>
  );

};

export default definePlugin((serverApi: ServerAPI) => {
  console.log("defining battery plugin");
  var app = Router.MainRunningApp?.display_name;
  serverApi.callPluginMethod("set_app", {app: app}).then((val) => {console.log("called async fn", val);});

  setInterval(() => {
    var app_now = Router.MainRunningApp?.display_name;
    serverApi.callPluginMethod("set_app", {app: app_now}).then((val) => {console.log("called async fn", val);});
    app = app_now;
  }, 1000*10);

  return {
    title: <div className={staticClasses.Title}>Example Plugin</div>,
    content: <Content serverAPI={serverApi} />,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute("/decky-plugin-test");
    },
  };
});
