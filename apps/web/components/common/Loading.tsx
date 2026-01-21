import { Spin } from "antd";
import { SpinSize } from "antd/es/spin";

interface LoadingProps {
  fullscreen?: boolean;
  tip?: string;
  size?: SpinSize;
}

const Loading = ({ fullscreen = true, tip, size = "large" }: LoadingProps) => {
  return <Spin fullscreen={fullscreen} tip={tip} size={size} />;
};

export default Loading;
